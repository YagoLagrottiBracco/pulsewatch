import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotifications } from '@/services/notification'

// Esta rota é chamada pelo Vercel Cron a cada 10 minutos
export async function GET(request: NextRequest) {
  try {
    // Verificar se a requisição vem do Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials')
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar todas as lojas ativas
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)

    if (storesError) throw storesError

    const results = []

    // Verificar cada loja
    for (const store of stores || []) {
      try {
        // Validar se tem domain
        if (!store.domain) {
          results.push({
            store: store.name,
            domain: store.domain,
            status: 'offline',
            error: 'Domain not configured'
          })
          continue
        }

        // Verificar se a loja está online (ping básico)
        const checkResult = await checkStoreStatus(store.domain)
        const isOnline = checkResult.isOnline
        const newStatus = isOnline ? 'online' : 'offline'
        
        // Atualizar status se mudou
        if (store.status !== newStatus) {
          await supabase
            .from('stores')
            .update({ 
              status: newStatus,
              last_check: new Date().toISOString()
            })
            .eq('id', store.id)

          // Criar alerta com notificação
          await createAlertWithNotification(supabase, store, {
            type: isOnline ? 'LOJA_ONLINE' : 'LOJA_OFFLINE',
            severity: isOnline ? 'low' : 'high',
            title: isOnline ? 'Loja Online' : 'Loja Offline',
            message: isOnline 
              ? `A loja ${store.name} voltou a ficar online!`
              : `A loja ${store.name} está offline!`,
          })
        } else {
          // Apenas atualizar última verificação
          await supabase
            .from('stores')
            .update({ last_check: new Date().toISOString() })
            .eq('id', store.id)
        }

        // Sincronizar produtos se a loja estiver online e for Shopify
        let productsSynced = 0
        let syncError = null
        if (isOnline && store.platform === 'shopify' && store.platform_config) {
          try {
            productsSynced = await syncShopifyProducts(supabase, store)
          } catch (error) {
            syncError = String(error)
            console.error(`Erro ao sincronizar produtos da loja ${store.name}:`, error)
          }
        }

        results.push({
          store: store.name,
          domain: store.domain,
          normalizedUrl: checkResult.normalizedUrl,
          status: newStatus,
          statusCode: checkResult.statusCode,
          method: checkResult.method,
          error: checkResult.error,
          changed: store.status !== newStatus,
          productsSynced,
          syncError,
          hasShopifyConfig: !!store.platform_config,
          platform: store.platform
        })
      } catch (error) {
        console.error(`Erro ao verificar loja ${store.name}:`, error)
        results.push({
          store: store.name,
          error: String(error)
        })
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storesChecked: stores?.length || 0,
      results,
    })
  } catch (error: any) {
    console.error('Erro no cron job:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

interface CheckResult {
  isOnline: boolean
  normalizedUrl: string
  statusCode?: number
  method?: string
  error?: string
}

async function createAlertWithNotification(
  supabase: any,
  store: any,
  alertData: {
    type: string
    severity: string
    title: string
    message: string
    metadata?: any
  }
) {
  // Criar alerta
  const { error } = await supabase.from('alerts').insert({
    store_id: store.id,
    ...alertData,
    is_read: false,
  })

  if (error) {
    console.error('Erro ao criar alerta:', error)
    return
  }

  // Enviar notificações (não aguarda para não bloquear)
  sendNotifications({
    userId: store.user_id,
    storeId: store.id,
    storeName: store.name,
    alertType: alertData.type,
    alertTitle: alertData.title,
    alertMessage: alertData.message,
  }).catch(err => console.error('Erro ao enviar notificações:', err))
}

async function syncShopifyProducts(supabase: any, store: any): Promise<number> {
  const config = store.platform_config
  if (!config || !config.accessToken) {
    console.log(`Loja ${store.name} sem credenciais configuradas`)
    return 0
  }

  try {
    // Limpar domain (remover https:// se tiver)
    let domain = store.domain.replace(/^https?:\/\//, '')
    
    // URL da API Shopify para produtos
    const shopifyUrl = `https://${domain}/admin/api/2024-01/products.json`
    
    const response = await fetch(shopifyUrl, {
      headers: {
        'X-Shopify-Access-Token': config.accessToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || []

    let synced = 0
    const lowStockThreshold = 5
    
    for (const product of products) {
      const variant = product.variants?.[0]
      if (!variant) continue

      const stockQuantity = variant.inventory_quantity || 0
      
      // Montar URL do produto na loja
      const productUrl = `https://${domain}/products/${product.handle}`
      
      // Pegar primeira categoria/tipo do produto
      const category = product.product_type || product.tags?.[0] || 'Sem categoria'
      
      const productData = {
        store_id: store.id,
        external_id: String(product.id),
        name: product.title,
        sku: variant.sku || null,
        price: parseFloat(variant.price) || 0,
        stock_quantity: stockQuantity,
        stock_status: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        product_url: productUrl,
        category: category,
        last_synced: new Date().toISOString(),
      }

      // Buscar produto anterior para comparar
      const { data: existingProduct } = await supabase
        .from('products')
        .select('stock_quantity, stock_status')
        .eq('store_id', store.id)
        .eq('external_id', String(product.id))
        .single()

      // Upsert (insert ou update)
      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) {
        synced++

        // Criar alertas baseado em mudanças de estoque
        if (existingProduct) {
          // Produto ficou sem estoque
          if (existingProduct.stock_quantity > 0 && stockQuantity === 0) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${product.title}" ficou sem estoque!`,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Produto voltou ao estoque
          else if (existingProduct.stock_quantity === 0 && stockQuantity > 0) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${product.title}" voltou ao estoque (${stockQuantity} unidades)`,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Estoque baixo
          else if (stockQuantity > 0 && stockQuantity <= lowStockThreshold && existingProduct.stock_quantity > lowStockThreshold) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_BAIXO',
              severity: 'medium',
              title: 'Estoque Baixo',
              message: `O produto "${product.title}" está com estoque baixo (${stockQuantity} unidades)`,
              metadata: { product_id: product.id, sku: variant.sku, threshold: lowStockThreshold },
            })
          }
        }
      }
    }

    return synced
  } catch (error) {
    console.error('Erro ao sincronizar produtos Shopify:', error)
    throw error
  }
}

async function checkStoreStatus(url: string): Promise<CheckResult> {
  // Validar se URL existe
  if (!url) {
    return {
      isOnline: false,
      normalizedUrl: '',
      error: 'Empty URL'
    }
  }

  // Normalizar URL - adicionar https:// se não tiver protocolo
  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  // Tentar HEAD primeiro (mais rápido)
  try {
    const headResponse = await fetch(normalizedUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10s timeout
    })
    
    if (headResponse.ok) {
      return {
        isOnline: true,
        normalizedUrl,
        statusCode: headResponse.status,
        method: 'HEAD'
      }
    }
  } catch (headError) {
    console.log(`HEAD failed for ${normalizedUrl}, trying GET:`, headError)
  }

  // Tentar GET
  try {
    const getResponse = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000), // 15s timeout para GET
      headers: {
        'User-Agent': 'PulseWatch-Monitor/1.0',
      },
    })
    
    const isOnline = getResponse.ok && getResponse.status < 400
    
    return {
      isOnline,
      normalizedUrl,
      statusCode: getResponse.status,
      method: 'GET'
    }
  } catch (error) {
    console.error(`Failed to check ${url}:`, error)
    return {
      isOnline: false,
      normalizedUrl,
      error: String(error)
    }
  }
}

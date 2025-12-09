import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

          // Criar alerta
          await supabase
            .from('alerts')
            .insert({
              store_id: store.id,
              type: isOnline ? 'LOJA_ONLINE' : 'LOJA_OFFLINE',
              severity: isOnline ? 'low' : 'high',
              title: isOnline ? 'Loja Online' : 'Loja Offline',
              message: isOnline 
                ? `A loja ${store.name} voltou a ficar online!`
                : `A loja ${store.name} está offline!`,
              is_read: false,
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
        if (isOnline && store.platform === 'shopify' && store.platform_config) {
          try {
            productsSynced = await syncShopifyProducts(supabase, store)
          } catch (syncError) {
            console.error(`Erro ao sincronizar produtos da loja ${store.name}:`, syncError)
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
          productsSynced
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

async function syncShopifyProducts(supabase: any, store: any): Promise<number> {
  const config = store.platform_config
  if (!config || !config.apiKey || !config.accessToken) {
    return 0
  }

  try {
    // URL da API Shopify para produtos
    const shopifyUrl = `https://${store.domain}/admin/api/2024-01/products.json`
    
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
    for (const product of products) {
      // Pegar apenas a primeira variante para simplicidade
      const variant = product.variants?.[0]
      if (!variant) continue

      const productData = {
        store_id: store.id,
        external_id: String(product.id),
        name: product.title,
        sku: variant.sku || null,
        price: parseFloat(variant.price) || 0,
        stock_quantity: variant.inventory_quantity || 0,
        stock_status: variant.inventory_quantity > 0 ? 'in_stock' : 'out_of_stock',
        last_synced: new Date().toISOString(),
      }

      // Upsert (insert ou update)
      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) synced++
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

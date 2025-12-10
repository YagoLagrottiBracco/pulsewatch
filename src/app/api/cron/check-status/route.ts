import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotifications } from '@/services/notification'
import { NuvemshopClient } from '@/integrations/nuvemshop'
import { TrayClient } from '@/integrations/tray'
import { VtexClient } from '@/integrations/vtex'

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

        // Sincronizar produtos se a loja estiver online e tiver integração configurada
        let productsSynced = 0
        let syncError = null
        if (isOnline && store.platform_config) {
          try {
            const stockAlertConfig = await getStockAlertConfigForStore(supabase, store)

            if (store.platform === 'shopify') {
              productsSynced = await syncShopifyProducts(supabase, store, stockAlertConfig)
            } else if (store.platform === 'woocommerce') {
              productsSynced = await syncWooCommerceProducts(supabase, store, stockAlertConfig)
            } else if (store.platform === 'nuvemshop') {
              productsSynced = await syncNuvemshopProducts(supabase, store, stockAlertConfig)
            } else if (store.platform === 'tray') {
              productsSynced = await syncTrayProducts(supabase, store, stockAlertConfig)
            } else if (store.platform === 'vtex') {
              productsSynced = await syncVtexProducts(supabase, store, stockAlertConfig)
            }
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
          hasPlatformConfig: !!store.platform_config,
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

type StockAlertConfig = {
  lowStockThreshold: number
  enableLowStock: boolean
  enableOutOfStock: boolean
  enableBackInStock: boolean
}

async function getStockAlertConfigForStore(supabase: any, store: any): Promise<StockAlertConfig> {
  const defaultConfig: StockAlertConfig = {
    lowStockThreshold: 5,
    enableLowStock: true,
    enableOutOfStock: true,
    enableBackInStock: true,
  }

  try {
    const { data: rules } = await supabase
      .from('alert_rules')
      .select('id, store_id, type, condition')
      .eq('user_id', store.user_id)
      .eq('is_active', true)
      .eq('type', 'STOCK_LEVEL')

    if (!rules || rules.length === 0) {
      return defaultConfig
    }

    // Regra específica da loja tem prioridade; depois regras globais (store_id nulo)
    const storeRule = rules.find((r: any) => r.store_id === store.id)
    const rule = storeRule || rules.find((r: any) => !r.store_id) || rules[0]

    const condition = (rule && rule.condition) || {}

    const lowStockThreshold =
      typeof condition.lowStockThreshold === 'number' && condition.lowStockThreshold > 0
        ? condition.lowStockThreshold
        : defaultConfig.lowStockThreshold

    const enableLowStock =
      typeof condition.enableLowStock === 'boolean'
        ? condition.enableLowStock
        : defaultConfig.enableLowStock

    const enableOutOfStock =
      typeof condition.enableOutOfStock === 'boolean'
        ? condition.enableOutOfStock
        : defaultConfig.enableOutOfStock

    const enableBackInStock =
      typeof condition.enableBackInStock === 'boolean'
        ? condition.enableBackInStock
        : defaultConfig.enableBackInStock

    return {
      lowStockThreshold,
      enableLowStock,
      enableOutOfStock,
      enableBackInStock,
    }
  } catch (error) {
    console.error('Erro ao carregar regras de estoque para loja', store.id, error)
    return defaultConfig
  }
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

async function syncShopifyProducts(
  supabase: any,
  store: any,
  stockConfig?: StockAlertConfig
): Promise<number> {
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
    const lowStockThreshold = stockConfig?.lowStockThreshold ?? 5
    const enableOutOfStock = stockConfig?.enableOutOfStock ?? true
    const enableBackInStock = stockConfig?.enableBackInStock ?? true
    const enableLowStock = stockConfig?.enableLowStock ?? true
    
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
          if (
            existingProduct.stock_quantity > 0 &&
            stockQuantity === 0 &&
            enableOutOfStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${product.title}" ficou sem estoque!`,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Produto voltou ao estoque
          else if (
            existingProduct.stock_quantity === 0 &&
            stockQuantity > 0 &&
            enableBackInStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${product.title}" voltou ao estoque (${stockQuantity} unidades)`,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Estoque baixo
          else if (
            stockQuantity > 0 &&
            stockQuantity <= lowStockThreshold &&
            existingProduct.stock_quantity > lowStockThreshold &&
            enableLowStock
          ) {
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

async function syncWooCommerceProducts(
  supabase: any,
  store: any,
  stockConfig?: StockAlertConfig
): Promise<number> {
  const config = store.platform_config
  if (!config || !config.consumerKey || !config.consumerSecret) {
    console.log(`Loja ${store.name} sem credenciais WooCommerce configuradas`)
    return 0
  }

  try {
    // Limpar domain (remover https:// se tiver)
    const domain = store.domain.replace(/^https?:\/\//, '')

    const params = new URLSearchParams({
      per_page: '50',
      status: 'publish',
      consumer_key: String(config.consumerKey),
      consumer_secret: String(config.consumerSecret),
    })

    const wooUrl = `https://${domain}/wp-json/wc/v3/products?${params.toString()}`

    const response = await fetch(wooUrl, {
      headers: {
        'User-Agent': 'PulseWatch/1.0',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`WooCommerce API error: ${response.status}`)
    }

    const products = await response.json()

    let synced = 0
    const lowStockThreshold = stockConfig?.lowStockThreshold ?? 5
    const enableOutOfStock = stockConfig?.enableOutOfStock ?? true
    const enableBackInStock = stockConfig?.enableBackInStock ?? true
    const enableLowStock = stockConfig?.enableLowStock ?? true

    for (const product of products || []) {
      const stockQuantity = product.stock_quantity ?? 0

      const productUrl = product.permalink || `https://${domain}/?p=${product.id}`
      const category = product.categories?.[0]?.name || 'Sem categoria'

      const priceValue =
        parseFloat(product.price || product.regular_price || '0') || 0

      const productData = {
        store_id: store.id,
        external_id: String(product.id),
        name: product.name,
        sku: product.sku || null,
        price: priceValue,
        stock_quantity: stockQuantity,
        stock_status:
          stockQuantity > 0 && product.stock_status === 'instock'
            ? 'in_stock'
            : 'out_of_stock',
        product_url: productUrl,
        category,
        last_synced: new Date().toISOString(),
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('stock_quantity, stock_status')
        .eq('store_id', store.id)
        .eq('external_id', String(product.id))
        .single()

      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) {
        synced++

        if (existingProduct) {
          // Produto ficou sem estoque
          if (
            existingProduct.stock_quantity > 0 &&
            stockQuantity === 0 &&
            enableOutOfStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${product.name}" ficou sem estoque!`,
              metadata: { product_id: product.id, sku: product.sku },
            })
          }
          // Produto voltou ao estoque
          else if (
            existingProduct.stock_quantity === 0 &&
            stockQuantity > 0 &&
            enableBackInStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${product.name}" voltou ao estoque (${stockQuantity} unidades)`,
              metadata: { product_id: product.id, sku: product.sku },
            })
          }
          // Estoque baixo
          else if (
            stockQuantity > 0 &&
            stockQuantity <= lowStockThreshold &&
            existingProduct.stock_quantity > lowStockThreshold &&
            enableLowStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_BAIXO',
              severity: 'medium',
              title: 'Estoque Baixo',
              message: `O produto "${product.name}" está com estoque baixo (${stockQuantity} unidades)`,
              metadata: {
                product_id: product.id,
                sku: product.sku,
                threshold: lowStockThreshold,
              },
            })
          }
        }
      }
    }

    return synced
  } catch (error) {
    console.error('Erro ao sincronizar produtos WooCommerce:', error)
    throw error
  }
}

async function syncNuvemshopProducts(
  supabase: any,
  store: any,
  stockConfig?: StockAlertConfig
): Promise<number> {
  const config = store.platform_config
  if (!config || !config.storeId || !config.accessToken) {
    console.log(`Loja ${store.name} sem credenciais Nuvemshop configuradas`)
    return 0
  }

  try {
    const client = new NuvemshopClient({
      storeId: String(config.storeId),
      accessToken: String(config.accessToken),
    })

    const products = await client.fetchProducts(50)

    let synced = 0
    const lowStockThreshold = stockConfig?.lowStockThreshold ?? 5
    const enableOutOfStock = stockConfig?.enableOutOfStock ?? true
    const enableBackInStock = stockConfig?.enableBackInStock ?? true
    const enableLowStock = stockConfig?.enableLowStock ?? true
    const domain = store.domain.replace(/^https?:\/\//, '')

    for (const product of products || []) {
      const variant = product.variants?.[0]
      if (!variant) continue

      const stockQuantity = variant.stock || 0

      const handle = product.handle?.pt || ''
      const productUrl = handle
        ? `https://${domain}/${handle}`
        : `https://${domain}`

      const priceValue = parseFloat(variant.price || '0') || 0

      const productData = {
        store_id: store.id,
        external_id: String(product.id),
        name: product.name?.pt || `Produto ${product.id}`,
        sku: variant.sku || null,
        price: priceValue,
        stock_quantity: stockQuantity,
        stock_status: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        product_url: productUrl,
        category: 'Sem categoria',
        last_synced: new Date().toISOString(),
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('stock_quantity, stock_status')
        .eq('store_id', store.id)
        .eq('external_id', String(product.id))
        .single()

      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) {
        synced++

        if (existingProduct) {
          // Produto ficou sem estoque
          if (
            existingProduct.stock_quantity > 0 &&
            stockQuantity === 0 &&
            enableOutOfStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${product.name?.pt || product.id}" ficou sem estoque!`,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Produto voltou ao estoque
          else if (
            existingProduct.stock_quantity === 0 &&
            stockQuantity > 0 &&
            enableBackInStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${product.name?.pt || product.id}" voltou ao estoque (${stockQuantity} unidades)`
              ,
              metadata: { product_id: product.id, sku: variant.sku },
            })
          }
          // Estoque baixo
          else if (
            stockQuantity > 0 &&
            stockQuantity <= lowStockThreshold &&
            existingProduct.stock_quantity > lowStockThreshold &&
            enableLowStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_BAIXO',
              severity: 'medium',
              title: 'Estoque Baixo',
              message: `O produto "${product.name?.pt || product.id}" está com estoque baixo (${stockQuantity} unidades)`
              ,
              metadata: {
                product_id: product.id,
                sku: variant.sku,
                threshold: lowStockThreshold,
              },
            })
          }
        }
      }
    }

    return synced
  } catch (error) {
    console.error('Erro ao sincronizar produtos Nuvemshop:', error)
    throw error
  }
}

async function syncTrayProducts(
  supabase: any,
  store: any,
  stockConfig?: StockAlertConfig
): Promise<number> {
  const config = store.platform_config
  if (!config || !config.accessToken) {
    console.log(`Loja ${store.name} sem credenciais Tray configuradas`)
    return 0
  }

  try {
    const domain = store.domain.replace(/^https?:\/\//, '')
    const client = new TrayClient({
      domain,
      accessToken: String(config.accessToken),
    })

    const products = await client.fetchProducts(50, 1)

    let synced = 0
    const lowStockThreshold = stockConfig?.lowStockThreshold ?? 5
    const enableOutOfStock = stockConfig?.enableOutOfStock ?? true
    const enableBackInStock = stockConfig?.enableBackInStock ?? true
    const enableLowStock = stockConfig?.enableLowStock ?? true

    for (const item of products || []) {
      const stockQuantity = Number(item.stock || '0') || 0

      const productUrl =
        item.url?.https ||
        item.url?.http ||
        `https://${domain}`

      const basePrice =
        (item.promotional_price && item.promotional_price !== '0.00'
          ? item.promotional_price
          : item.price) || '0'

      const priceValue = parseFloat(basePrice) || 0

      const category = item.category_id || 'Sem categoria'

      const productData = {
        store_id: store.id,
        external_id: String(item.id),
        name: item.name,
        sku: item.reference || null,
        price: priceValue,
        stock_quantity: stockQuantity,
        stock_status: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        product_url: productUrl,
        category,
        last_synced: new Date().toISOString(),
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('stock_quantity, stock_status')
        .eq('store_id', store.id)
        .eq('external_id', String(item.id))
        .single()

      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) {
        synced++

        if (existingProduct) {
          if (
            existingProduct.stock_quantity > 0 &&
            stockQuantity === 0 &&
            enableOutOfStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${item.name}" ficou sem estoque!`,
              metadata: { product_id: item.id, sku: item.reference },
            })
          } else if (
            existingProduct.stock_quantity === 0 &&
            stockQuantity > 0 &&
            enableBackInStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${item.name}" voltou ao estoque (${stockQuantity} unidades)`,
              metadata: { product_id: item.id, sku: item.reference },
            })
          } else if (
            stockQuantity > 0 &&
            stockQuantity <= lowStockThreshold &&
            existingProduct.stock_quantity > lowStockThreshold &&
            enableLowStock
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_BAIXO',
              severity: 'medium',
              title: 'Estoque Baixo',
              message: `O produto "${item.name}" está com estoque baixo (${stockQuantity} unidades)`,
              metadata: {
                product_id: item.id,
                sku: item.reference,
                threshold: lowStockThreshold,
              },
            })
          }
        }
      }
    }

    return synced
  } catch (error) {
    console.error('Erro ao sincronizar produtos Tray:', error)
    throw error
  }
}

async function syncVtexProducts(
  supabase: any,
  store: any,
  stockConfig?: StockAlertConfig
): Promise<number> {
  const config = store.platform_config
  if (!config || !config.accountName || !config.appKey || !config.appToken) {
    console.log(`Loja ${store.name} sem credenciais VTEX configuradas`)
    return 0
  }

  try {
    const client = new VtexClient({
      accountName: String(config.accountName),
      appKey: String(config.appKey),
      appToken: String(config.appToken),
      environment: config.environment || 'vtexcommercestable',
    })

    const products = await client.fetchProducts(0, 49)

    let synced = 0
    const lowStockThreshold = stockConfig?.lowStockThreshold ?? 5
    const enableOutOfStock = stockConfig?.enableOutOfStock ?? true
    const enableBackInStock = stockConfig?.enableBackInStock ?? true
    const enableLowStock = stockConfig?.enableLowStock ?? true
    const domain = store.domain.replace(/^https?:\/\//, '')

    for (const product of products || []) {
      const firstItem = product.items?.[0]
      const firstSeller = firstItem?.sellers?.[0]
      const offer = firstSeller?.commertialOffer

      const stockQuantity = offer?.AvailableQuantity ?? 0
      const priceValue = typeof offer?.Price === 'number' ? offer.Price : 0

      const productUrl =
        (product.link && product.link.startsWith('http'))
          ? product.link
          : product.linkText
            ? `https://${domain}/${product.linkText}/p`
            : `https://${domain}`

      const category = product.categories?.[0] || 'Sem categoria'

      const productData = {
        store_id: store.id,
        external_id: String(product.productId),
        name: product.productName,
        sku: firstItem?.itemId || null,
        price: priceValue,
        stock_quantity: stockQuantity,
        stock_status: stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        product_url: productUrl,
        category,
        last_synced: new Date().toISOString(),
      }

      const { data: existingProduct } = await supabase
        .from('products')
        .select('stock_quantity, stock_status')
        .eq('store_id', store.id)
        .eq('external_id', String(product.productId))
        .single()

      const { error } = await supabase
        .from('products')
        .upsert(productData, {
          onConflict: 'store_id,external_id',
        })

      if (!error) {
        synced++

        if (existingProduct) {
          if (existingProduct.stock_quantity > 0 && stockQuantity === 0) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_ZERADO',
              severity: 'high',
              title: 'Produto sem Estoque',
              message: `O produto "${product.productName}" ficou sem estoque!`,
              metadata: { product_id: product.productId, sku: firstItem?.itemId },
            })
          } else if (existingProduct.stock_quantity === 0 && stockQuantity > 0) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_DISPONIVEL',
              severity: 'low',
              title: 'Produto Voltou ao Estoque',
              message: `O produto "${product.productName}" voltou ao estoque (${stockQuantity} unidades)`,
              metadata: { product_id: product.productId, sku: firstItem?.itemId },
            })
          } else if (
            stockQuantity > 0 &&
            stockQuantity <= lowStockThreshold &&
            existingProduct.stock_quantity > lowStockThreshold
          ) {
            await createAlertWithNotification(supabase, store, {
              type: 'ESTOQUE_BAIXO',
              severity: 'medium',
              title: 'Estoque Baixo',
              message: `O produto "${product.productName}" está com estoque baixo (${stockQuantity} unidades)`,
              metadata: {
                product_id: product.productId,
                sku: firstItem?.itemId,
                threshold: lowStockThreshold,
              },
            })
          }
        }
      }
    }

    return synced
  } catch (error) {
    console.error('Erro ao sincronizar produtos VTEX:', error)
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

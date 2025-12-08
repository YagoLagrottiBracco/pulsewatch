import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { corsHeaders } from '../_shared/cors.ts'

interface Store {
  id: string
  user_id: string
  name: string
  domain: string
  platform: 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown'
  platform_config: any
  is_active: boolean
  status: 'online' | 'offline' | 'checking'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Buscar todas as lojas ativas
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('is_active', true)

    if (storesError) {
      throw storesError
    }

    console.log(`Verificando ${stores?.length || 0} lojas ativas`)

    // 2. Verificar cada loja
    for (const store of stores || []) {
      await checkStore(supabase, store)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Verificadas ${stores?.length || 0} lojas`,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function checkStore(supabase: any, store: Store) {
  console.log(`Verificando loja: ${store.name} (${store.domain})`)

  try {
    // 1. Verificar se a loja está online
    const isOnline = await checkStoreStatus(store.domain)
    const previousStatus = store.status

    // Atualizar status da loja
    await supabase
      .from('stores')
      .update({
        status: isOnline ? 'online' : 'offline',
        last_check: new Date().toISOString(),
      })
      .eq('id', store.id)

    // Criar alerta se status mudou
    if (previousStatus === 'online' && !isOnline) {
      await createAlert(supabase, store, {
        type: 'LOJA_OFFLINE',
        severity: 'critical',
        title: 'Loja Offline',
        message: `A loja ${store.name} está fora do ar!`,
      })
    } else if (previousStatus === 'offline' && isOnline) {
      await createAlert(supabase, store, {
        type: 'LOJA_ONLINE',
        severity: 'low',
        title: 'Loja Online',
        message: `A loja ${store.name} voltou ao ar.`,
      })
    }

    // 2. Se estiver online, sincronizar dados
    if (isOnline && store.platform !== 'unknown') {
      await syncStoreData(supabase, store)
    }
  } catch (error) {
    console.error(`Erro ao verificar loja ${store.name}:`, error)
  }
}

async function checkStoreStatus(domain: string): Promise<boolean> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })
    return response.ok
  } catch (error) {
    return false
  }
}

async function syncStoreData(supabase: any, store: Store) {
  console.log(`Sincronizando dados da loja: ${store.name}`)

  try {
    // Buscar produtos conforme a plataforma
    let products: any[] = []

    if (store.platform === 'shopify') {
      products = await syncShopifyProducts(store)
    } else if (store.platform === 'woocommerce') {
      products = await syncWooCommerceProducts(store)
    } else if (store.platform === 'nuvemshop') {
      products = await syncNuvemshopProducts(store)
    }

    // Verificar produtos esgotados
    const outOfStock = products.filter(p => p.stock_quantity <= 0)
    const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5)

    // Criar alertas para produtos esgotados
    for (const product of outOfStock) {
      await createAlert(supabase, store, {
        type: 'PRODUTO_ESGOTADO',
        severity: 'high',
        title: 'Produto Esgotado',
        message: `O produto "${product.name}" está esgotado.`,
        metadata: { product_id: product.external_id },
      })
    }

    // Criar alertas para estoque baixo
    if (lowStock.length > 0) {
      await createAlert(supabase, store, {
        type: 'ESTOQUE_BAIXO',
        severity: 'medium',
        title: 'Estoque Baixo',
        message: `${lowStock.length} produto(s) com estoque baixo (menos de 5 unidades).`,
        metadata: { count: lowStock.length },
      })
    }

    // Salvar/atualizar produtos
    for (const product of products) {
      await supabase
        .from('products')
        .upsert(
          {
            store_id: store.id,
            external_id: product.external_id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock_quantity: product.stock_quantity,
            stock_status: product.stock_status,
            last_synced: new Date().toISOString(),
          },
          { onConflict: 'store_id,external_id' }
        )
    }

    console.log(`Sincronizados ${products.length} produtos`)
  } catch (error) {
    console.error('Erro na sincronização:', error)
  }
}

async function syncShopifyProducts(store: Store): Promise<any[]> {
  try {
    const url = `https://${store.domain}/products.json?limit=250`
    const response = await fetch(url)
    if (!response.ok) return []

    const data = await response.json()
    const products = data.products || []

    return products.map((p: any) => ({
      external_id: String(p.id),
      name: p.title,
      sku: p.variants?.[0]?.sku || '',
      price: parseFloat(p.variants?.[0]?.price || '0'),
      stock_quantity: p.variants?.reduce((sum: number, v: any) => sum + (v.inventory_quantity || 0), 0) || 0,
      stock_status: p.variants?.[0]?.inventory_quantity > 0 ? 'instock' : 'outofstock',
    }))
  } catch (error) {
    console.error('Erro ao buscar produtos Shopify:', error)
    return []
  }
}

async function syncWooCommerceProducts(store: Store): Promise<any[]> {
  try {
    const url = `https://${store.domain}/wp-json/wc/store/products?per_page=100`
    const response = await fetch(url)
    if (!response.ok) return []

    const products = await response.json()

    return products.map((p: any) => ({
      external_id: String(p.id),
      name: p.name,
      sku: p.sku || '',
      price: parseFloat(p.prices?.price || '0') / 100,
      stock_quantity: p.stock_quantity || 0,
      stock_status: p.is_in_stock ? 'instock' : 'outofstock',
    }))
  } catch (error) {
    console.error('Erro ao buscar produtos WooCommerce:', error)
    return []
  }
}

async function syncNuvemshopProducts(store: Store): Promise<any[]> {
  // Nuvemshop requer autenticação, então retorna vazio por enquanto
  // O usuário precisará configurar as credenciais
  return []
}

async function createAlert(
  supabase: any,
  store: Store,
  alert: {
    type: string
    severity: string
    title: string
    message: string
    metadata?: any
  }
) {
  // Verificar se já existe alerta similar recente (últimas 24h)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: existingAlerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('store_id', store.id)
    .eq('type', alert.type)
    .gte('created_at', yesterday.toISOString())
    .limit(1)

  if (existingAlerts && existingAlerts.length > 0) {
    console.log(`Alerta ${alert.type} já existe para esta loja`)
    return
  }

  // Criar alerta
  const { data: newAlert, error } = await supabase
    .from('alerts')
    .insert({
      store_id: store.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metadata: alert.metadata || {},
      is_read: false,
      email_sent: false,
      telegram_sent: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar alerta:', error)
    return
  }

  console.log(`Alerta criado: ${alert.title}`)

  // Buscar perfil do usuário para enviar notificações
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', store.user_id)
    .single()

  if (!profile) return

  // Enviar notificações (email e telegram)
  await sendNotifications(supabase, newAlert.id, profile, store, alert)
}

async function sendNotifications(
  supabase: any,
  alertId: string,
  profile: any,
  store: Store,
  alert: any
) {
  try {
    // Chamar função para enviar email
    if (profile.email_notifications && profile.email) {
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: profile.email,
            storeName: store.name,
            alertType: alert.type,
            message: alert.message,
            timestamp: new Date().toISOString(),
          }),
        }
      )

      if (emailResponse.ok) {
        await supabase
          .from('alerts')
          .update({ email_sent: true })
          .eq('id', alertId)
      }
    }

    // Chamar função para enviar Telegram
    if (profile.telegram_notifications && profile.telegram_chat_id) {
      const telegramResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-alert-telegram`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            chatId: profile.telegram_chat_id,
            storeName: store.name,
            alertType: alert.type,
            message: alert.message,
            timestamp: new Date().toISOString(),
          }),
        }
      )

      if (telegramResponse.ok) {
        await supabase
          .from('alerts')
          .update({ telegram_sent: true })
          .eq('id', alertId)
      }
    }
  } catch (error) {
    console.error('Erro ao enviar notificações:', error)
  }
}

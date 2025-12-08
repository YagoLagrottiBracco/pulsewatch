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
        // Verificar se a loja está online (ping básico)
        const isOnline = await checkStoreStatus(store.url)
        
        // Atualizar status se mudou
        if (store.is_online !== isOnline) {
          await supabase
            .from('stores')
            .update({ 
              is_online: isOnline,
              last_check: new Date().toISOString()
            })
            .eq('id', store.id)

          // Criar alerta
          await supabase
            .from('alerts')
            .insert({
              user_id: store.user_id,
              store_id: store.id,
              type: isOnline ? 'LOJA_ONLINE' : 'LOJA_OFFLINE',
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

        results.push({
          store: store.name,
          status: isOnline ? 'online' : 'offline',
          changed: store.is_online !== isOnline
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

async function checkStoreStatus(url: string): Promise<boolean> {
  try {
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
      if (headResponse.ok) return true
    } catch (headError) {
      // Se HEAD falhar, tentar GET (alguns sites bloqueiam HEAD)
      console.log(`HEAD failed for ${normalizedUrl}, trying GET`)
    }

    // Tentar GET
    const getResponse = await fetch(normalizedUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000), // 15s timeout para GET
      headers: {
        'User-Agent': 'PulseWatch-Monitor/1.0',
      },
    })
    
    return getResponse.ok && getResponse.status < 400
  } catch (error) {
    console.error(`Failed to check ${url}:`, error)
    return false
  }
}

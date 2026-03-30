import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotifications } from '@/services/notification'

/**
 * Rota de teste de notificações.
 * Simula um alerta de ESTOQUE_ZERADO para a primeira loja do usuário autenticado.
 *
 * Requer header: Authorization: Bearer <CRON_SECRET>
 *
 * Aceita query params opcionais:
 *   ?alertType=ESTOQUE_ZERADO  (padrão)
 *   ?alertType=LOJA_OFFLINE
 *   ?alertType=ESTOQUE_BAIXO
 *   ?storeId=<uuid>            (para forçar uma loja específica)
 */
export async function GET(request: NextRequest) {
  // Proteger com o mesmo secret do cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const alertType = searchParams.get('alertType') || 'ESTOQUE_ZERADO'
  const forceStoreId = searchParams.get('storeId') || null

  // Montar dados do alerta de acordo com o tipo
  const alertTemplates: Record<string, { title: string; message: string; severity: string }> = {
    ESTOQUE_ZERADO: {
      title: 'Produto sem Estoque',
      message: '[TESTE] O produto "Produto de Test PulseWatch" ficou sem estoque!',
      severity: 'high',
    },
    ESTOQUE_BAIXO: {
      title: 'Estoque Baixo',
      message: '[TESTE] O produto "Produto de Test PulseWatch" está com estoque baixo (2 unidades).',
      severity: 'medium',
    },
    LOJA_OFFLINE: {
      title: 'Loja Offline',
      message: '[TESTE] A loja está offline!',
      severity: 'high',
    },
    LOJA_ONLINE: {
      title: 'Loja Online',
      message: '[TESTE] A loja voltou a ficar online!',
      severity: 'low',
    },
  }

  const alertData = alertTemplates[alertType] ?? alertTemplates['ESTOQUE_ZERADO']

  // Buscar lojas ativas
  let storesQuery = supabase.from('stores').select('id, name, user_id').eq('is_active', true)
  if (forceStoreId) {
    storesQuery = storesQuery.eq('id', forceStoreId)
  }

  const { data: stores, error: storesError } = await storesQuery.limit(5)

  if (storesError) {
    return NextResponse.json({ error: storesError.message }, { status: 500 })
  }

  if (!stores || stores.length === 0) {
    return NextResponse.json({ error: 'Nenhuma loja ativa encontrada.' }, { status: 404 })
  }

  const results = []

  for (const store of stores) {
    try {
      // Inserir o alerta de teste no banco
      const { error: alertError } = await supabase.from('alerts').insert({
        store_id: store.id,
        type: alertType,
        severity: alertData.severity,
        title: alertData.title,
        message: alertData.message,
        is_read: false,
        metadata: { test: true },
      })

      if (alertError) {
        results.push({
          store: store.name,
          storeId: store.id,
          alertCreated: false,
          alertError: alertError.message,
          notifications: null,
        })
        continue
      }

      // Disparar notificações reais e capturar resultado
      let notificationResult: Record<string, boolean | string> | null = null
      let notificationError: string | null = null

      try {
        notificationResult = await sendNotifications({
          userId: store.user_id,
          storeId: store.id,
          storeName: store.name,
          alertType,
          alertTitle: alertData.title,
          alertMessage: alertData.message,
        }) ?? null
      } catch (err: any) {
        notificationError = String(err?.message ?? err)
      }

      results.push({
        store: store.name,
        storeId: store.id,
        alertCreated: true,
        notifications: notificationResult,
        notificationError,
      })
    } catch (err: any) {
      results.push({
        store: store.name,
        storeId: store.id,
        alertCreated: false,
        error: String(err?.message ?? err),
        notifications: null,
      })
    }
  }

  return NextResponse.json({
    success: true,
    alertType,
    storesTested: results.length,
    results,
  })
}

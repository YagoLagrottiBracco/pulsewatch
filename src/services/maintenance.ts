/**
 * Serviço de janelas de manutenção.
 *
 * Permite agendar manutenções para suprimir alertas durante o período.
 */

import { createClient } from '@supabase/supabase-js'

export interface MaintenanceWindow {
  id: string
  storeId: string | null
  storeName?: string
  title: string
  description: string | null
  startsAt: string
  endsAt: string
  suppressAlerts: boolean
  createdAt: string
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verifica se uma loja está em janela de manutenção.
 */
export async function isInMaintenanceWindow(storeId: string): Promise<boolean> {
  const supabase = getSupabase()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('maintenance_windows')
    .select('id')
    .or(`store_id.eq.${storeId},store_id.is.null`)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .eq('suppress_alerts', true)
    .limit(1)
    .single()

  return !!data
}

/**
 * Lista janelas de manutenção do usuário.
 */
export async function listMaintenanceWindows(userId: string): Promise<MaintenanceWindow[]> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('maintenance_windows')
    .select('*, stores(name)')
    .eq('user_id', userId)
    .order('starts_at', { ascending: false })
    .limit(50)

  return (data || []).map(m => ({
    id: m.id,
    storeId: m.store_id,
    storeName: m.stores?.name,
    title: m.title,
    description: m.description,
    startsAt: m.starts_at,
    endsAt: m.ends_at,
    suppressAlerts: m.suppress_alerts,
    createdAt: m.created_at,
  }))
}

/**
 * Cria uma janela de manutenção.
 */
export async function createMaintenanceWindow(userId: string, data: {
  storeId?: string; title: string; description?: string; startsAt: string; endsAt: string; suppressAlerts?: boolean
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('maintenance_windows')
    .insert({
      user_id: userId,
      store_id: data.storeId || null,
      title: data.title,
      description: data.description || null,
      starts_at: data.startsAt,
      ends_at: data.endsAt,
      suppress_alerts: data.suppressAlerts !== false,
    })

  return { success: !error, error: error?.message }
}

/**
 * Remove uma janela de manutenção.
 */
export async function deleteMaintenanceWindow(userId: string, windowId: string): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('maintenance_windows')
    .delete()
    .eq('id', windowId)
    .eq('user_id', userId)

  return { success: !error }
}

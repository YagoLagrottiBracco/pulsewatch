/**
 * Serviço de gerenciamento de workspaces e white-label para agências.
 * Gate: agency apenas.
 */

import { createClient } from '@supabase/supabase-js'

export interface Workspace {
  id: string
  name: string
  slug: string
  clientEmail: string | null
  clientName: string | null
  isActive: boolean
  storeCount: number
  alertCount: number
  createdAt: string
}

export interface WhitelabelConfig {
  brandName: string | null
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  customDomain: string | null
  faviconUrl: string | null
}

export interface AgencyDashboardData {
  workspaces: Workspace[]
  totalStores: number
  totalAlertsToday: number
  overallUptimePercent: number
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Lista todos os workspaces da agência com métricas consolidadas.
 */
export async function getAgencyDashboard(agencyUserId: string): Promise<AgencyDashboardData> {
  const supabase = getSupabase()

  const { data: workspaces } = await supabase
    .from('agency_workspaces')
    .select('*')
    .eq('agency_user_id', agencyUserId)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (!workspaces || workspaces.length === 0) {
    return { workspaces: [], totalStores: 0, totalAlertsToday: 0, overallUptimePercent: 100 }
  }

  const workspaceIds = workspaces.map(w => w.id)

  // Buscar lojas por workspace
  const { data: stores } = await supabase
    .from('stores')
    .select('id, workspace_id, status')
    .eq('user_id', agencyUserId)
    .in('workspace_id', workspaceIds)

  // Alertas de hoje
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const storeIds = stores?.map(s => s.id) || []

  let todayAlertCount = 0
  if (storeIds.length > 0) {
    const { count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .in('store_id', storeIds)
      .gte('created_at', today.toISOString())

    todayAlertCount = count || 0
  }

  // Contadores por workspace
  const storeCountByWorkspace: Record<string, number> = {}
  const alertCountByWorkspace: Record<string, number> = {}
  const storeIdsByWorkspace: Record<string, string[]> = {}

  for (const store of stores || []) {
    if (!store.workspace_id) continue
    storeCountByWorkspace[store.workspace_id] = (storeCountByWorkspace[store.workspace_id] || 0) + 1
    if (!storeIdsByWorkspace[store.workspace_id]) storeIdsByWorkspace[store.workspace_id] = []
    storeIdsByWorkspace[store.workspace_id].push(store.id)
  }

  // Alertas não lidos por workspace
  for (const [wsId, wsStoreIds] of Object.entries(storeIdsByWorkspace)) {
    if (wsStoreIds.length > 0) {
      const { count } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .in('store_id', wsStoreIds)
        .eq('is_read', false)

      alertCountByWorkspace[wsId] = count || 0
    }
  }

  const onlineStores = stores?.filter(s => s.status === 'online').length || 0
  const totalStores = stores?.length || 0
  const overallUptimePercent = totalStores > 0
    ? Math.round((onlineStores / totalStores) * 10000) / 100
    : 100

  const enrichedWorkspaces: Workspace[] = workspaces.map(w => ({
    id: w.id,
    name: w.name,
    slug: w.slug,
    clientEmail: w.client_email,
    clientName: w.client_name,
    isActive: w.is_active,
    storeCount: storeCountByWorkspace[w.id] || 0,
    alertCount: alertCountByWorkspace[w.id] || 0,
    createdAt: w.created_at,
  }))

  return {
    workspaces: enrichedWorkspaces,
    totalStores,
    totalAlertsToday: todayAlertCount,
    overallUptimePercent,
  }
}

/**
 * Cria um novo workspace.
 */
export async function createWorkspace(
  agencyUserId: string,
  data: { name: string; slug: string; clientEmail?: string; clientName?: string }
): Promise<{ success: boolean; workspace?: any; error?: string }> {
  const supabase = getSupabase()

  const slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')

  const { data: workspace, error } = await supabase
    .from('agency_workspaces')
    .insert({
      agency_user_id: agencyUserId,
      name: data.name,
      slug,
      client_email: data.clientEmail || null,
      client_name: data.clientName || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Já existe um workspace com este slug.' }
    }
    return { success: false, error: 'Erro ao criar workspace.' }
  }

  return { success: true, workspace }
}

/**
 * Remove (desativa) um workspace.
 */
export async function deleteWorkspace(agencyUserId: string, workspaceId: string): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  // Desassociar lojas
  await supabase
    .from('stores')
    .update({ workspace_id: null })
    .eq('workspace_id', workspaceId)
    .eq('user_id', agencyUserId)

  const { error } = await supabase
    .from('agency_workspaces')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', workspaceId)
    .eq('agency_user_id', agencyUserId)

  return { success: !error }
}

/**
 * Atribui uma loja a um workspace.
 */
export async function assignStoreToWorkspace(
  agencyUserId: string,
  storeId: string,
  workspaceId: string | null
): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('stores')
    .update({ workspace_id: workspaceId })
    .eq('id', storeId)
    .eq('user_id', agencyUserId)

  return { success: !error }
}

/**
 * Busca/atualiza configuração de white-label.
 */
export async function getWhitelabelConfig(agencyUserId: string): Promise<WhitelabelConfig> {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('whitelabel_config')
    .select('*')
    .eq('agency_user_id', agencyUserId)
    .single()

  return {
    brandName: data?.brand_name || null,
    logoUrl: data?.logo_url || null,
    primaryColor: data?.primary_color || '#667eea',
    secondaryColor: data?.secondary_color || '#764ba2',
    customDomain: data?.custom_domain || null,
    faviconUrl: data?.favicon_url || null,
  }
}

export async function updateWhitelabelConfig(
  agencyUserId: string,
  config: Partial<WhitelabelConfig>
): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('whitelabel_config')
    .select('id')
    .eq('agency_user_id', agencyUserId)
    .single()

  const dbData = {
    brand_name: config.brandName,
    logo_url: config.logoUrl,
    primary_color: config.primaryColor,
    secondary_color: config.secondaryColor,
    custom_domain: config.customDomain,
    favicon_url: config.faviconUrl,
    updated_at: new Date().toISOString(),
  }

  let error
  if (existing) {
    ({ error } = await supabase.from('whitelabel_config').update(dbData).eq('id', existing.id))
  } else {
    ({ error } = await supabase.from('whitelabel_config').insert({ agency_user_id: agencyUserId, ...dbData }))
  }

  return { success: !error }
}

/**
 * Gera um token de portal para um workspace.
 */
export async function generatePortalToken(
  agencyUserId: string,
  workspaceId: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const supabase = getSupabase()

  // Verificar ownership
  const { data: ws } = await supabase
    .from('agency_workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('agency_user_id', agencyUserId)
    .single()

  if (!ws) return { success: false, error: 'Workspace não encontrado.' }

  // Desativar tokens anteriores
  await supabase
    .from('client_portal_tokens')
    .update({ is_active: false })
    .eq('workspace_id', workspaceId)

  // Criar novo token
  const { data: tokenRow, error } = await supabase
    .from('client_portal_tokens')
    .insert({ workspace_id: workspaceId })
    .select()
    .single()

  if (error || !tokenRow) return { success: false, error: 'Erro ao gerar token.' }

  return { success: true, token: tokenRow.token }
}

/**
 * Valida token de portal e retorna dados do workspace.
 */
export async function validatePortalToken(token: string): Promise<{
  valid: boolean
  workspace?: Workspace
  stores?: any[]
  alerts?: any[]
  whitelabel?: WhitelabelConfig
}> {
  const supabase = getSupabase()

  const { data: tokenRow } = await supabase
    .from('client_portal_tokens')
    .select('*, agency_workspaces(*)')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (!tokenRow) return { valid: false }

  // Check expiry
  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return { valid: false }
  }

  const ws = tokenRow.agency_workspaces
  const agencyUserId = ws.agency_user_id

  // Buscar lojas do workspace
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name, domain, platform, status, last_check')
    .eq('workspace_id', ws.id)
    .eq('user_id', agencyUserId)

  // Buscar alertas recentes
  const storeIds = stores?.map(s => s.id) || []
  let alerts: any[] = []
  if (storeIds.length > 0) {
    const { data: recentAlerts } = await supabase
      .from('alerts')
      .select('id, type, severity, title, message, created_at, stores(name)')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })
      .limit(20)

    alerts = recentAlerts || []
  }

  // White-label config
  const whitelabel = await getWhitelabelConfig(agencyUserId)

  return {
    valid: true,
    workspace: {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      clientEmail: ws.client_email,
      clientName: ws.client_name,
      isActive: ws.is_active,
      storeCount: stores?.length || 0,
      alertCount: 0,
      createdAt: ws.created_at,
    },
    stores: stores || [],
    alerts,
    whitelabel,
  }
}

import { createClient } from '@/lib/supabase/client'

export interface AuditLogData {
  action: string
  entity_type: string
  entity_id?: string
  metadata?: Record<string, any>
}

export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      metadata: data.metadata || null,
    })
  } catch (error) {
    console.error('Failed to log audit:', error)
  }
}

export const AuditActions = {
  STORE_CREATED: 'store.created',
  STORE_UPDATED: 'store.updated',
  STORE_DELETED: 'store.deleted',
  ALERT_DISMISSED: 'alert.dismissed',
  ALERT_DELETED: 'alert.deleted',
  ALERT_VIEWED: 'alert.viewed',
  RULE_CREATED: 'rule.created',
  RULE_UPDATED: 'rule.updated',
  RULE_DELETED: 'rule.deleted',
  RULE_TOGGLED: 'rule.toggled',
  SETTINGS_UPDATED: 'settings.updated',
  EXPORT_GENERATED: 'export.generated',
  SUBSCRIPTION_CHANGED: 'subscription.changed',
} as const

export const EntityTypes = {
  STORE: 'store',
  ALERT: 'alert',
  RULE: 'alert_rule',
  USER_PROFILE: 'user_profile',
  PRODUCT: 'product',
  EXPORT: 'export',
} as const

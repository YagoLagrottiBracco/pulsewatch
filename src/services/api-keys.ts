/**
 * Serviço de API keys para API pública.
 * Gate: agency apenas.
 */

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Gera uma nova API key.
 */
export async function createApiKey(userId: string, name: string, scopes: string[] = ['read']): Promise<{
  success: boolean; key?: string; keyPrefix?: string; error?: string
}> {
  const supabase = getSupabase()

  // Gerar key: pw_live_<32 chars random>
  const rawKey = `pw_live_${crypto.randomBytes(24).toString('base64url')}`
  const keyPrefix = rawKey.slice(0, 12) + '...'
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const { error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes,
    })

  if (error) return { success: false, error: error.message }

  // Retorna a key apenas neste momento (nunca mais será visível)
  return { success: true, key: rawKey, keyPrefix }
}

/**
 * Lista API keys do usuário (sem expor a key completa).
 */
export async function listApiKeys(userId: string) {
  const supabase = getSupabase()

  const { data } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, scopes, is_active, last_used_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return data || []
}

/**
 * Revoga uma API key.
 */
export async function revokeApiKey(userId: string, keyId: string): Promise<{ success: boolean }> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId)

  return { success: !error }
}

/**
 * Valida uma API key e retorna o userId associado.
 */
export async function validateApiKey(key: string): Promise<{ valid: boolean; userId?: string; scopes?: string[] }> {
  const supabase = getSupabase()

  const keyHash = crypto.createHash('sha256').update(key).digest('hex')

  const { data } = await supabase
    .from('api_keys')
    .select('user_id, scopes')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (!data) return { valid: false }

  // Atualizar last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', keyHash)

  return { valid: true, userId: data.user_id, scopes: data.scopes }
}

'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  channel: string
  table: string
  schema?: string
  filter?: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  onInsert?: (record: any) => void
  onUpdate?: (record: any) => void
  onDelete?: (record: any) => void
  onChange?: (payload: any) => void
  enabled?: boolean
}

/**
 * Hook genérico para subscrever mudanças em qualquer tabela via Supabase Realtime.
 *
 * Usa refs para os callbacks para evitar o problema de stale closure: mesmo que
 * onChange/onInsert/onUpdate/onDelete sejam redefinidos a cada render, o canal
 * sempre chama a versão mais recente do callback.
 */
export function useRealtimeSubscription({
  channel,
  table,
  schema = 'public',
  filter,
  event = '*',
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeSubscriptionOptions) {
  // Refs garantem que o canal usa sempre o callback mais atual, sem recriar a subscrição
  const onChangeRef = useRef(onChange)
  const onInsertRef = useRef(onInsert)
  const onUpdateRef = useRef(onUpdate)
  const onDeleteRef = useRef(onDelete)

  // Atualiza refs a cada render sem recriar o canal
  useEffect(() => {
    onChangeRef.current = onChange
    onInsertRef.current = onInsert
    onUpdateRef.current = onUpdate
    onDeleteRef.current = onDelete
  })

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()

    const config: Record<string, unknown> = { event, schema, table }
    if (filter) config.filter = filter

    const ch = supabase
      .channel(channel)
      .on('postgres_changes' as any, config, (payload: any) => {
        onChangeRef.current?.(payload)
        if (payload.eventType === 'INSERT') onInsertRef.current?.(payload.new)
        if (payload.eventType === 'UPDATE') onUpdateRef.current?.(payload.new)
        if (payload.eventType === 'DELETE') onDeleteRef.current?.(payload.old)
      })

    ch.subscribe()
    channelRef.current = ch

    return () => {
      supabase.removeChannel(ch)
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, table, schema, filter, event, enabled])
}

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

interface RealtimeContextValue {
  unreadCount: number
  recentAlerts: any[]
  storeIds: string[]
  /** Incrementa toda vez que qualquer mudança na tabela alerts é detectada */
  alertsVersion: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const RealtimeContext = createContext<RealtimeContextValue>({
  unreadCount: 0,
  recentAlerts: [],
  storeIds: [],
  alertsVersion: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
})

export function RealtimeProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string
}) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [storeIds, setStoreIds] = useState<string[]>([])
  const [alertsVersion, setAlertsVersion] = useState(0)
  const storeIdsRef = useRef<string[]>([])

  const loadAlerts = useCallback(async () => {
    const supabase = createClient()

    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', userId)

    const ids = stores?.map((s: any) => s.id) ?? []
    storeIdsRef.current = ids
    setStoreIds(ids)

    if (ids.length === 0) {
      setRecentAlerts([])
      setUnreadCount(0)
      return
    }

    const { data: alerts } = await supabase
      .from('alerts')
      .select('*, stores(name)')
      .in('store_id', ids)
      .order('created_at', { ascending: false })
      .limit(20)

    const list = alerts ?? []
    setRecentAlerts(list)
    setUnreadCount(list.filter((a: any) => !a.is_read).length)
  }, [userId])

  // Carga inicial
  useEffect(() => {
    if (!userId) return
    loadAlerts()
  }, [loadAlerts, userId])

  // Ref para o callback mais atual — evita stale closure no canal realtime
  const loadAlertsRef = useRef(loadAlerts)
  useEffect(() => {
    loadAlertsRef.current = loadAlerts
  })

  // Canal realtime — unico ponto de entrada para mudanças na tabela alerts
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    const channel = supabase
      .channel(`ctx-alerts-${userId}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'alerts' },
        () => {
          loadAlertsRef.current()
          setAlertsVersion((v) => v + 1)
          // Evento global para páginas que ficam fora da árvore do Provider
          window.dispatchEvent(new CustomEvent('pw:alerts-changed'))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setRecentAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
      setAlertsVersion((v) => v + 1)
      window.dispatchEvent(new CustomEvent('pw:alerts-changed'))
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const supabase = createClient()
    const unreadIds = recentAlerts.filter((a) => !a.is_read).map((a) => a.id)

    if (unreadIds.length === 0) return

    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .in('id', unreadIds)

    if (!error) {
      setRecentAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })))
      setUnreadCount(0)
      setAlertsVersion((v) => v + 1)
      window.dispatchEvent(new CustomEvent('pw:alerts-changed'))
    }
  }, [recentAlerts])

  return (
    <RealtimeContext.Provider
      value={{ unreadCount, recentAlerts, storeIds, alertsVersion, markAsRead, markAllAsRead }}
    >
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)

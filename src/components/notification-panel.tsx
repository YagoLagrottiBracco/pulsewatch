'use client'

import { useState } from 'react'
import { Bell, X, CheckCheck, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRealtime } from '@/contexts/realtime-context'

const SEVERITY_CONFIG = {
  critical: {
    border: 'border-l-red-600',
    bg: 'bg-red-50 dark:bg-red-950/30',
    dot: 'bg-red-600',
    text: 'text-red-700 dark:text-red-400',
    label: 'Crítico',
  },
  high: {
    border: 'border-l-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Alto',
  },
  medium: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    label: 'Médio',
  },
  low: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-400',
    label: 'Baixo',
  },
} as const

type Severity = keyof typeof SEVERITY_CONFIG

function getSeverityConfig(severity: string) {
  return SEVERITY_CONFIG[severity as Severity] ?? SEVERITY_CONFIG.low
}

function getBellStyle(recentAlerts: any[], unreadCount: number) {
  const unread = recentAlerts.filter((a) => !a.is_read)
  if (unread.some((a) => a.severity === 'critical'))
    return 'bg-red-600 hover:bg-red-700 shadow-red-500/40'
  if (unread.some((a) => a.severity === 'high'))
    return 'bg-orange-500 hover:bg-orange-600 shadow-orange-400/40'
  if (unread.some((a) => a.severity === 'medium'))
    return 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-400/40'
  if (unreadCount > 0)
    return 'bg-green-600 hover:bg-green-700 shadow-green-500/40'
  return 'bg-primary hover:bg-primary/90 shadow-primary/30'
}

export function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const { unreadCount, recentAlerts, markAsRead, markAllAsRead } = useRealtime()

  const bellStyle = getBellStyle(recentAlerts, unreadCount)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Painel */}
      {open && (
        <div className="mb-3 w-80 md:w-96 rounded-xl border bg-card shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todos como lido
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[420px] overflow-y-auto divide-y">
            {recentAlerts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Nenhuma notificação
              </div>
            ) : (
              recentAlerts.map((alert) => {
                const cfg = getSeverityConfig(alert.severity)
                return (
                  <div
                    key={alert.id}
                    className={`flex gap-3 p-3 border-l-4 transition-colors ${cfg.border} ${
                      !alert.is_read ? cfg.bg : 'bg-background'
                    }`}
                  >
                    <div
                      className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot} ${
                        !alert.is_read ? 'animate-pulse' : 'opacity-40'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm font-medium leading-snug ${
                            !alert.is_read ? cfg.text : 'text-foreground'
                          }`}
                        >
                          {alert.title}
                        </p>
                        {!alert.is_read && (
                          <button
                            onClick={() => markAsRead(alert.id)}
                            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                            title="Marcar como lido"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
                        <span>·</span>
                        {alert.stores?.name && (
                          <>
                            <span>{alert.stores.name}</span>
                            <span>·</span>
                          </>
                        )}
                        <span>
                          {new Date(alert.created_at).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Botão flutuante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative flex items-center justify-center h-14 w-14 rounded-full shadow-lg text-white transition-all duration-200 ${bellStyle}`}
        aria-label="Notificações"
      >
        <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'animate-[ring_1s_ease-in-out_infinite]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-white text-red-600 text-xs font-bold px-1 rounded-full border-2 border-current">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}

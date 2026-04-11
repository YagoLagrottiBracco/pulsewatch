'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Star } from 'lucide-react'

interface Feedback {
  id: string
  user_id: string | null
  user_email: string | null
  type: string
  message: string
  rating: number | null
  status: string
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  bug: '🐛 Bug',
  suggestion: '💡 Sugestão',
  compliment: '❤️ Elogio',
  other: '💬 Outro',
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Novo',
  read: 'Lido',
  resolved: 'Resolvido',
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadFeedbacks()
  }, [])

  const loadFeedbacks = async () => {
    try {
      const res = await fetch('/api/feedback')
      if (res.ok) {
        const data = await res.json()
        setFeedbacks(data.feedbacks || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setFeedbacks((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status } : f))
      )
    }
  }

  const filtered = feedbacks.filter((f) => {
    if (filterType !== 'all' && f.type !== filterType) return false
    if (filterStatus !== 'all' && f.status !== filterStatus) return false
    return true
  })

  const newCount = feedbacks.filter((f) => f.status === 'new').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando feedbacks...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-7 w-7" />
            Feedbacks
            {newCount > 0 && (
              <span className="text-sm bg-blue-600 text-white rounded-full px-2 py-0.5 font-medium">
                {newCount} novo{newCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Feedbacks enviados pelos usuários</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {['all', 'bug', 'suggestion', 'compliment', 'other'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filterType === t
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {t === 'all' ? 'Todos os tipos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['all', 'new', 'read', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                filterStatus === s
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              {s === 'all' ? 'Todos os status' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nenhum feedback encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((feedback) => (
            <Card key={feedback.id} className={feedback.status === 'new' ? 'border-blue-200' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium">
                      {TYPE_LABELS[feedback.type] || feedback.type}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[feedback.status]}`}
                    >
                      {STATUS_LABELS[feedback.status]}
                    </span>
                    {feedback.rating && (
                      <span className="flex items-center gap-1 text-sm text-yellow-600">
                        {Array.from({ length: feedback.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {feedback.status !== 'read' && feedback.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(feedback.id, 'read')}
                      >
                        Marcar como lido
                      </Button>
                    )}
                    {feedback.status !== 'resolved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(feedback.id, 'resolved')}
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-800 whitespace-pre-wrap">{feedback.message}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                  <span>{feedback.user_email || 'Usuário anônimo'}</span>
                  <span>
                    {new Date(feedback.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

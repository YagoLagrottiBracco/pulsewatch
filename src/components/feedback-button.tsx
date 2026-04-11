'use client'

import { useState } from 'react'
import { MessageSquarePlus, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const TYPES = [
  { value: 'bug', label: '🐛 Bug' },
  { value: 'suggestion', label: '💡 Sugestão' },
  { value: 'compliment', label: '❤️ Elogio' },
  { value: 'other', label: '💬 Outro' },
]

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim() || message.trim().length < 5) return

    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, rating }),
      })

      if (res.ok) {
        setSent(true)
        setTimeout(() => {
          setOpen(false)
          setSent(false)
          setMessage('')
          setType('suggestion')
          setRating(null)
        }, 1800)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => {
    setSent(false)
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        title="Enviar feedback"
        className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-secondary/80 transition-all text-sm font-medium"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>Feedback</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar feedback</DialogTitle>
          </DialogHeader>

          {sent ? (
            <div className="py-8 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="font-medium text-gray-800">Obrigado pelo feedback!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua opinião é muito importante para nós.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Tipo */}
              <div>
                <p className="text-sm font-medium mb-2">Tipo</p>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        type === t.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avaliação */}
              <div>
                <p className="text-sm font-medium mb-2">Avaliação geral (opcional)</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(null)}
                      onClick={() => setRating(rating === star ? null : star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= (hoveredStar ?? rating ?? 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <p className="text-sm font-medium mb-2">Mensagem</p>
                <Textarea
                  placeholder="Descreva sua experiência, sugestão ou problema..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {message.trim().length}/500 caracteres
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || message.trim().length < 5}
              >
                {loading ? 'Enviando...' : 'Enviar feedback'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

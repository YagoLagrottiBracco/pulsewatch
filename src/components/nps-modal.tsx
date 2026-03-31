'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface NpsModalProps {
  open: boolean
  onClose: () => void
  initialScore?: number
}

export default function NpsModal({ open, onClose, initialScore }: NpsModalProps) {
  const [score, setScore] = useState<number | null>(initialScore ?? null)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (score === null) return
    setLoading(true)

    await fetch('/api/nps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback: feedback || null }),
    })

    setSubmitted(true)
    setLoading(false)
  }

  const getScoreColor = (value: number) => {
    if (value <= 6) return 'bg-red-500 hover:bg-red-600'
    if (value <= 8) return 'bg-yellow-500 hover:bg-yellow-600'
    return 'bg-green-500 hover:bg-green-600'
  }

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold mb-2">Obrigado pelo feedback!</h3>
            <p className="text-sm text-gray-600">
              Sua opiniao nos ajuda a melhorar o PulseWatch.
            </p>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Como estamos indo?</DialogTitle>
          <DialogDescription>
            De 0 a 10, qual a probabilidade de voce recomendar o PulseWatch para um colega?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* NPS Scale */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={`w-9 h-9 rounded-lg text-sm font-bold text-white transition-all ${
                  score === i ? `${getScoreColor(i)} ring-2 ring-offset-2 ring-purple-500 scale-110` : `${getScoreColor(i)} opacity-60`
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>Nada provavel</span>
            <span>Muito provavel</span>
          </div>

          {/* Feedback */}
          {score !== null && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {score <= 6
                  ? 'O que podemos melhorar?'
                  : score <= 8
                  ? 'O que falta para ser um 10?'
                  : 'O que voce mais gosta no PulseWatch?'}
              </label>
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Seu feedback (opcional)..."
                rows={3}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Pular
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={score === null || loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500"
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

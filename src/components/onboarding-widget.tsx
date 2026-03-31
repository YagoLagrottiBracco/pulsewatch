'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Gift, Trophy } from 'lucide-react'

interface OnboardingStep {
  key: string
  label: string
  points: number
  completed: boolean
  completedAt: string | null
}

interface OnboardingProgress {
  steps: OnboardingStep[]
  totalPoints: number
  earnedPoints: number
  percentComplete: number
  trialBonusDays: number
}

export default function OnboardingWidget() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/onboarding')
      .then(res => res.json())
      .then(data => {
        setProgress(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || !progress || dismissed || progress.percentComplete === 100) {
    return null
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-purple-600" />
            Primeiros Passos
          </CardTitle>
          <div className="flex items-center gap-2">
            {progress.trialBonusDays > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Gift className="h-3 w-3 mr-1" />
                +{progress.trialBonusDays} dias trial
              </Badge>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{progress.earnedPoints}/{progress.totalPoints} pontos</span>
            <span className="font-medium text-purple-600">{progress.percentComplete}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {progress.steps.map(step => (
            <div
              key={step.key}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                step.completed ? 'bg-green-50' : 'hover:bg-white/50'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
              )}
              <span className={`text-sm flex-1 ${step.completed ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                {step.label}
              </span>
              <Badge variant="outline" className="text-xs">
                +{step.points}pts
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Complete tarefas para ganhar pontos e dias extras de trial!
        </p>
      </CardContent>
    </Card>
  )
}

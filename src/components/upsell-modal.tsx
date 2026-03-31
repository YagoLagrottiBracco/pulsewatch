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
import { Badge } from '@/components/ui/badge'
import { Zap, Shield, BarChart3, Users, ArrowRight } from 'lucide-react'

interface UpsellModalProps {
  open: boolean
  onClose: () => void
  featureKey: string
  featureName: string
  requiredTier: string
}

const TIER_FEATURES: Record<string, { icon: React.ReactNode; benefits: string[] }> = {
  pro: {
    icon: <Zap className="h-6 w-6 text-blue-500" />,
    benefits: [
      'Monitor de checkout e velocidade',
      'Alertas avançados',
      'Relatório semanal por email',
      'Página de status pública',
    ],
  },
  business: {
    icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
    benefits: [
      'Tudo do Pro +',
      'Integrações brasileiras (ML, Shopee)',
      'Previsão de estoque',
      'Webhooks (n8n, Zapier)',
      'Até 3 membros na equipe',
    ],
  },
  agency: {
    icon: <Shield className="h-6 w-6 text-orange-500" />,
    benefits: [
      'Tudo do Business +',
      'Dashboard multi-cliente',
      'White-label completo',
      'API documentada',
      'Membros ilimitados',
    ],
  },
}

export default function UpsellModal({ open, onClose, featureKey, featureName, requiredTier }: UpsellModalProps) {
  const tierInfo = TIER_FEATURES[requiredTier] || TIER_FEATURES.pro

  const handleUpgrade = () => {
    // Track click
    fetch('/api/upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureKey, action: 'clicked' }),
    })

    window.location.href = '/#pricing'
  }

  const handleDismiss = () => {
    fetch('/api/upsell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featureKey, action: 'dismissed' }),
    })
    onClose()
  }

  // Track shown
  useState(() => {
    if (open) {
      fetch('/api/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, action: 'shown' }),
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tierInfo.icon}
            Recurso {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          </DialogTitle>
          <DialogDescription>
            <strong>{featureName}</strong> requer o plano{' '}
            <Badge variant="secondary" className="font-semibold">
              {requiredTier.toUpperCase()}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Faça upgrade e desbloqueie:
          </p>

          <ul className="space-y-2">
            {tierInfo.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>

          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 text-center">
            <p className="text-sm text-purple-700 font-medium">
              Teste gratis por 7 dias - cancele a qualquer momento
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Agora nao
          </Button>
          <Button onClick={handleUpgrade} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600">
            Fazer Upgrade
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

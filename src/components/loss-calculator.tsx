'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingDown, Clock, AlertTriangle, ArrowRight, Calculator } from 'lucide-react'
import Link from 'next/link'

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

function parseRevenue(raw: string): number {
  // Strip non-numeric characters except period and comma
  const cleaned = raw.replace(/[^\d,.]/g, '').replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function LossCalculator() {
  const [rawInput, setRawInput] = useState('')

  const monthlyRevenue = parseRevenue(rawInput)
  // 30 days * 24 hours = 720 hours per month
  const hourlyLoss = monthlyRevenue / 720
  const salesDropImpact = monthlyRevenue * 0.20

  const hasValue = monthlyRevenue > 0

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4" variant="outline">
          <Calculator className="h-3 w-3 mr-1" />
          Calculadora de Perdas
        </Badge>
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
          Quanto Você Perde com
          <span className="block bg-gradient-to-r from-destructive to-orange-600 bg-clip-text text-transparent">
            Downtime?
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Digite seu faturamento mensal e descubra o impacto real de cada hora de indisponibilidade na sua loja.
        </p>
      </div>

      <Card className="border-2 hover:border-primary/30 transition-all duration-300 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-destructive to-orange-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            Calcule suas perdas potenciais
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 pt-4">
          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground" htmlFor="monthly-revenue">
              Seu faturamento mensal (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                R$
              </span>
              <Input
                id="monthly-revenue"
                type="text"
                inputMode="numeric"
                placeholder="ex: 50.000"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                className="pl-10 h-14 text-lg font-semibold border-2 focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hourly downtime loss */}
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-sm font-semibold text-destructive">Perda por hora de downtime</p>
              </div>
              <p className="text-3xl font-black text-destructive">
                {hasValue ? formatBRL(hourlyLoss) : 'R$ 0,00'}
              </p>
              <p className="text-xs text-muted-foreground">
                Baseado em {hasValue ? formatBRL(monthlyRevenue) : 'R$ 0,00'}/mês ÷ 720 horas
              </p>
            </div>

            {/* 20% drop impact */}
            <div className="rounded-2xl bg-orange-500/5 border border-orange-500/20 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  Impacto de queda de 20%
                </p>
              </div>
              <p className="text-3xl font-black text-orange-600 dark:text-orange-400">
                {hasValue ? formatBRL(salesDropImpact) : 'R$ 0,00'}
              </p>
              <p className="text-xs text-muted-foreground">
                Perda mensal se vendas caírem 20%
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2 text-center space-y-3">
            {hasValue && (
              <p className="text-sm text-muted-foreground">
                Com o PulseWatch, você seria alertado em <strong className="text-foreground">menos de 1 minuto</strong> — antes que a perda se acumule.
              </p>
            )}
            <Link href="/auth/signup" className="inline-block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg hover:shadow-primary/40 transition-all hover:scale-105 group"
              >
                Proteger Minha Loja Agora
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">Grátis por 7 dias. Sem cartão de crédito.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

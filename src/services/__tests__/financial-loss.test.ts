import { describe, it, expect } from 'vitest'
import { calculateFinancialLoss, resolveRevenuePerHour } from '../financial-loss'

describe('calculateFinancialLoss', () => {
  it('calcula perda para 60 minutos a R$ 100/h → R$ 100', () => {
    const result = calculateFinancialLoss(60, 100)
    expect(result.estimatedLoss).toBe(100)
    expect(result.durationMinutes).toBe(60)
    expect(result.revenuePerHour).toBe(100)
  })

  it('calcula perda para 30 minutos (meia hora)', () => {
    const result = calculateFinancialLoss(30, 200)
    expect(result.estimatedLoss).toBe(100) // 0.5h × 200
  })

  it('calcula perda para 90 minutos (1.5h)', () => {
    const result = calculateFinancialLoss(90, 60)
    expect(result.estimatedLoss).toBe(90) // 1.5h × 60
  })

  it('usa revenueSource padrão "configured" quando não informado', () => {
    const result = calculateFinancialLoss(60, 100)
    expect(result.revenueSource).toBe('configured')
  })

  it('respeita revenueSource quando informado', () => {
    const result = calculateFinancialLoss(60, 50, 'orders_history')
    expect(result.revenueSource).toBe('orders_history')
  })

  it('retorna messages com as três chaves obrigatórias', () => {
    const result = calculateFinancialLoss(30, 100)
    expect(result.messages).toHaveProperty('neutral')
    expect(result.messages).toHaveProperty('commercial')
    expect(result.messages).toHaveProperty('urgency')
  })

  it('message neutral contém a duração e o valor de perda', () => {
    const result = calculateFinancialLoss(30, 100)
    expect(result.messages.neutral).toContain('30min')
  })

  it('message urgency contém a taxa por hora', () => {
    const result = calculateFinancialLoss(120, 200)
    expect(result.messages.urgency).toContain('2h')
  })

  it('formata duração de 1h corretamente (sem "0min")', () => {
    const result = calculateFinancialLoss(60, 50)
    expect(result.messages.neutral).toContain('1h')
    expect(result.messages.neutral).not.toContain('0min')
  })

  it('formata duração mista ex: 1h 30min', () => {
    const result = calculateFinancialLoss(90, 50)
    expect(result.messages.neutral).toContain('1h 30min')
  })

  it('perda zero para 0 minutos', () => {
    const result = calculateFinancialLoss(0, 100)
    expect(result.estimatedLoss).toBe(0)
  })
})

describe('resolveRevenuePerHour', () => {
  it('usa configuredRevenue quando positivo', () => {
    const { value, source } = resolveRevenuePerHour({ configuredRevenue: 200 })
    expect(value).toBe(200)
    expect(source).toBe('configured')
  })

  it('ignora configuredRevenue zero e usa orders_history', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: 0,
      recentOrdersTotal: 7200, // 7200 / 720h = 10/h
    })
    expect(value).toBe(10)
    expect(source).toBe('orders_history')
  })

  it('ignora configuredRevenue null e usa orders_history', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: 3600,
    })
    expect(value).toBe(5)
    expect(source).toBe('orders_history')
  })

  it('usa product_avg quando orders_history é zero', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: 0,
      avgProductPrice: 200, // 200 × 0.5 = 100
    })
    expect(value).toBe(100)
    expect(source).toBe('product_avg')
  })

  it('usa product_avg quando orders_history é null', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: null,
      avgProductPrice: 100,
    })
    expect(value).toBe(50)
    expect(source).toBe('product_avg')
  })

  it('usa default R$ 50/h quando tudo é null/zero', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: null,
      avgProductPrice: null,
    })
    expect(value).toBe(50)
    expect(source).toBe('default')
  })

  it('usa default quando avgProductPrice é zero', () => {
    const { value, source } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: null,
      avgProductPrice: 0,
    })
    expect(value).toBe(50)
    expect(source).toBe('default')
  })

  it('arredonda a 2 casas decimais no orders_history', () => {
    const { value } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: 1000,
    })
    // 1000 / 720 = 1.388... → 1.39
    expect(value).toBe(1.39)
  })

  it('arredonda a 2 casas decimais no product_avg', () => {
    const { value } = resolveRevenuePerHour({
      configuredRevenue: null,
      recentOrdersTotal: null,
      avgProductPrice: 333.33,
    })
    // 333.33 × 0.5 = 166.665 → 166.67
    expect(value).toBe(166.67)
  })
})

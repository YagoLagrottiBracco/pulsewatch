import { describe, it, expect } from 'vitest'
import { DIAGNOSIS_CHECKLISTS } from '../alert-checklists'

describe('DIAGNOSIS_CHECKLISTS', () => {
  it('contém as três categorias obrigatórias', () => {
    expect(DIAGNOSIS_CHECKLISTS).toHaveProperty('downtime')
    expect(DIAGNOSIS_CHECKLISTS).toHaveProperty('stock_low')
    expect(DIAGNOSIS_CHECKLISTS).toHaveProperty('sales_drop')
  })

  it('cada categoria tem title e items não-vazios', () => {
    for (const key of Object.keys(DIAGNOSIS_CHECKLISTS)) {
      const checklist = DIAGNOSIS_CHECKLISTS[key]
      expect(typeof checklist.title).toBe('string')
      expect(checklist.title.length).toBeGreaterThan(0)
      expect(Array.isArray(checklist.items)).toBe(true)
      expect(checklist.items.length).toBeGreaterThan(0)
    }
  })

  it('downtime tem pelo menos 6 itens', () => {
    expect(DIAGNOSIS_CHECKLISTS.downtime.items.length).toBeGreaterThanOrEqual(6)
  })

  it('todos os itens são strings não-vazias', () => {
    for (const key of Object.keys(DIAGNOSIS_CHECKLISTS)) {
      for (const item of DIAGNOSIS_CHECKLISTS[key].items) {
        expect(typeof item).toBe('string')
        expect(item.length).toBeGreaterThan(0)
      }
    }
  })
})

import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('retorna string vazia quando sem argumentos', () => {
    expect(cn()).toBe('')
  })

  it('combina classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('descarta valores falsy', () => {
    expect(cn('foo', false, undefined, null, 0 as any, 'bar')).toBe('foo bar')
  })

  it('resolve conflitos do Tailwind (merge)', () => {
    // tailwind-merge mantém a última classe que ganhar conflito
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('combina classes condicionais via objeto', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('suporta arrays de classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })
})

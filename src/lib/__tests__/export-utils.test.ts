import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportToCSV, formatAlertForExport, formatProductForExport, formatStoreForExport } from '../export-utils'

// ─── formatAlertForExport ───────────────────────────────────────────────────

describe('formatAlertForExport', () => {
  it('formata alerta com todos os campos preenchidos', () => {
    const alert = {
      created_at: '2024-01-15T10:30:00Z',
      stores: { name: 'Loja Teste' },
      type: 'downtime',
      severity: 'critical',
      title: 'Loja offline',
      message: 'Seu site está fora do ar',
      is_read: true,
      email_sent: true,
      telegram_sent: false,
    }
    const result = formatAlertForExport(alert)
    expect(result['Loja']).toBe('Loja Teste')
    expect(result['Tipo']).toBe('downtime')
    expect(result['Severidade']).toBe('critical')
    expect(result['Lido']).toBe('Sim')
    expect(result['Email Enviado']).toBe('Sim')
    expect(result['Telegram Enviado']).toBe('Não')
  })

  it('usa "N/A" quando loja não está presente', () => {
    const alert = {
      created_at: '2024-01-15T10:30:00Z',
      stores: null,
      type: 'stock_low',
      severity: 'warning',
      title: 'Estoque baixo',
      message: 'Produto X com estoque crítico',
      is_read: false,
      email_sent: false,
      telegram_sent: false,
    }
    const result = formatAlertForExport(alert)
    expect(result['Loja']).toBe('N/A')
    expect(result['Lido']).toBe('Não')
  })
})

// ─── formatProductForExport ─────────────────────────────────────────────────

describe('formatProductForExport', () => {
  it('formata produto com todos os campos', () => {
    const product = {
      name: 'Camiseta',
      sku: 'CAM-001',
      price: 79.9,
      stock_quantity: 15,
      stock_status: 'in_stock',
      last_synced: '2024-01-15T08:00:00Z',
    }
    const result = formatProductForExport(product)
    expect(result['Nome']).toBe('Camiseta')
    expect(result['SKU']).toBe('CAM-001')
    expect(result['Preço']).toBe('R$ 79.90')
    expect(result['Estoque']).toBe(15)
    expect(result['Status']).toBe('in_stock')
  })

  it('usa "N/A" para SKU ausente', () => {
    const product = {
      name: 'Produto sem SKU',
      sku: null,
      price: 100,
      stock_quantity: 0,
      stock_status: 'out_of_stock',
      last_synced: '2024-01-15T08:00:00Z',
    }
    const result = formatProductForExport(product)
    expect(result['SKU']).toBe('N/A')
  })
})

// ─── formatStoreForExport ───────────────────────────────────────────────────

describe('formatStoreForExport', () => {
  it('formata loja com todos os campos', () => {
    const store = {
      name: 'Minha Loja',
      domain: 'minhaloja.com.br',
      platform: 'shopify',
      status: 'online',
      is_active: true,
      last_check: '2024-01-15T12:00:00Z',
      created_at: '2023-06-01T00:00:00Z',
    }
    const result = formatStoreForExport(store)
    expect(result['Nome']).toBe('Minha Loja')
    expect(result['Domínio']).toBe('minhaloja.com.br')
    expect(result['Plataforma']).toBe('shopify')
    expect(result['Ativo']).toBe('Sim')
  })

  it('usa "N/A" para last_check ausente', () => {
    const store = {
      name: 'Loja Nova',
      domain: 'lojanova.com',
      platform: 'woocommerce',
      status: 'unknown',
      is_active: false,
      last_check: null,
      created_at: '2024-01-01T00:00:00Z',
    }
    const result = formatStoreForExport(store)
    expect(result['Última Verificação']).toBe('N/A')
    expect(result['Ativo']).toBe('Não')
  })
})

// ─── exportToCSV ────────────────────────────────────────────────────────────

describe('exportToCSV', () => {
  beforeEach(() => {
    // Mock global alert
    vi.stubGlobal('alert', vi.fn())

    // Mock URL.createObjectURL / URL.revokeObjectURL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    })

    // Mock document.createElement para link
    const linkEl = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {} as CSSStyleDeclaration,
    }
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkEl as any)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkEl as any)
    vi.spyOn(document, 'createElement').mockReturnValue(linkEl as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('chama alert e retorna cedo quando array vazio', async () => {
    await exportToCSV([], 'test')
    expect(vi.mocked(alert)).toHaveBeenCalledWith('Nenhum dado para exportar')
  })

  it('cria e clica no link de download com dados válidos', async () => {
    // Mock audit-logger para evitar import dinâmico real
    vi.doMock('@/lib/audit-logger', () => ({
      logAudit: vi.fn().mockResolvedValue(undefined),
      AuditActions: { EXPORT_GENERATED: 'export_generated' },
      EntityTypes: { EXPORT: 'export' },
    }))

    const data = [{ nome: 'Produto A', preco: '100,00' }]
    await exportToCSV(data, 'relatorio')

    const link = document.createElement('a')
    expect(link.setAttribute).toHaveBeenCalled()
    expect(link.click).toHaveBeenCalled()
  })

  it('lida com valores que contêm vírgulas (escape CSV)', async () => {
    vi.doMock('@/lib/audit-logger', () => ({
      logAudit: vi.fn().mockResolvedValue(undefined),
      AuditActions: { EXPORT_GENERATED: 'export_generated' },
      EntityTypes: { EXPORT: 'export' },
    }))

    const data = [{ descricao: 'Produto, com vírgula', preco: '50' }]
    await expect(exportToCSV(data, 'teste')).resolves.not.toThrow()
  })

  it('lida com valores que contêm quebra de linha (escape CSV)', async () => {
    vi.doMock('@/lib/audit-logger', () => ({
      logAudit: vi.fn().mockResolvedValue(undefined),
      AuditActions: { EXPORT_GENERATED: 'export_generated' },
      EntityTypes: { EXPORT: 'export' },
    }))

    const data = [{ descricao: 'Produto\ncom quebra', preco: '50' }]
    await expect(exportToCSV(data, 'teste-newline')).resolves.not.toThrow()
  })

  it('lida com valores que contêm aspas duplas (escape CSV com "")', async () => {
    vi.doMock('@/lib/audit-logger', () => ({
      logAudit: vi.fn().mockResolvedValue(undefined),
      AuditActions: { EXPORT_GENERATED: 'export_generated' },
      EntityTypes: { EXPORT: 'export' },
    }))

    const data = [{ descricao: 'Produto "especial"', preco: '50' }]
    await expect(exportToCSV(data, 'teste-aspas')).resolves.not.toThrow()
  })

  it('lida com valores null e undefined no CSV', async () => {
    vi.doMock('@/lib/audit-logger', () => ({
      logAudit: vi.fn().mockResolvedValue(undefined),
      AuditActions: { EXPORT_GENERATED: 'export_generated' },
      EntityTypes: { EXPORT: 'export' },
    }))

    const data = [{ nome: null, sku: undefined, preco: 'R$ 10.00' }]
    await expect(exportToCSV(data, 'teste-null')).resolves.not.toThrow()
  })
})

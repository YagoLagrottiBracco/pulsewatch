import { describe, it, expect, vi, afterEach } from 'vitest'
import { detectPlatform, SUPPORTED_PLATFORMS } from '../platform-detector'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function mockFetch(html: string, headers: Record<string, string> = {}, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    text: vi.fn().mockResolvedValue(html),
    headers: {
      entries: () => Object.entries(headers),
    },
  }))
}

describe('detectPlatform — detecção rápida por domínio (sem fetch)', () => {
  it('detecta shopify via .myshopify.com', async () => {
    const result = await detectPlatform('minha-loja.myshopify.com')
    expect(result.platform).toBe('shopify')
    expect(result.confidence).toBe(99)
  })

  it('detecta nuvemshop via .nuvemshop.com.br', async () => {
    const result = await detectPlatform('minhaloja.nuvemshop.com.br')
    expect(result.platform).toBe('nuvemshop')
    expect(result.confidence).toBe(99)
  })

  it('detecta nuvemshop via .tiendanube.com', async () => {
    const result = await detectPlatform('miloja.tiendanube.com')
    expect(result.platform).toBe('nuvemshop')
    expect(result.confidence).toBe(99)
  })

  it('detecta bigcommerce via .mybigcommerce.com', async () => {
    const result = await detectPlatform('minha.mybigcommerce.com')
    expect(result.platform).toBe('bigcommerce')
    expect(result.confidence).toBe(99)
  })

  it('detecta tray via .tray.com.br', async () => {
    const result = await detectPlatform('loja.tray.com.br')
    expect(result.platform).toBe('tray')
    expect(result.confidence).toBe(99)
  })

  it('remove prefixo https:// antes de checar domínio', async () => {
    const result = await detectPlatform('https://loja.myshopify.com')
    expect(result.platform).toBe('shopify')
  })
})

describe('detectPlatform — detecção via HTML/headers (com fetch)', () => {
  it('detecta shopify via HTML', async () => {
    mockFetch('<html>cdn.shopify.com</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('shopify')
    expect(result.confidence).toBe(95)
  })

  it('detecta woocommerce via HTML', async () => {
    mockFetch('<html>woocommerce</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('woocommerce')
    expect(result.confidence).toBe(90)
  })

  it('detecta vtex via header server', async () => {
    mockFetch('<html>vtex</html>', { server: 'VTEX' })
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('vtex')
  })

  it('detecta magento via HTML', async () => {
    mockFetch('<html>magento-init</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('magento')
    expect(result.confidence).toBe(90)
  })

  it('detecta magento via header x-magento-cache-debug', async () => {
    mockFetch('<html>loja qualquer</html>', { 'x-magento-cache-debug': 'MISS' })
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('magento')
  })

  it('detecta bigcommerce via HTML', async () => {
    mockFetch('<html>cdn.bcapp.dev</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('bigcommerce')
    expect(result.confidence).toBe(95)
  })

  it('detecta bigcommerce via header x-bc-storefront-request-id', async () => {
    mockFetch('<html>loja qualquer</html>', { 'x-bc-storefront-request-id': 'abc123' })
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('bigcommerce')
  })

  it('detecta prestashop via HTML', async () => {
    mockFetch('<html>prestashop.com</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('prestashop')
    expect(result.confidence).toBe(85)
  })

  it('detecta spree via HTML', async () => {
    mockFetch('<html>spree_application</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('spree')
    expect(result.confidence).toBe(90)
  })

  it('detecta spree via header x-spree-version', async () => {
    mockFetch('<html>qualquer coisa</html>', { 'x-spree-version': '4.5.0' })
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('spree')
  })

  it('detecta tray via HTML', async () => {
    mockFetch('<html>tray-commerce</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('tray')
    expect(result.confidence).toBe(90)
  })

  it('detecta nuvemshop via HTML', async () => {
    mockFetch('<html>tiendanube</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('nuvemshop')
    expect(result.confidence).toBe(95)
  })

  it('retorna null quando site responde !ok', async () => {
    mockFetch('', {}, false)
    const result = await detectPlatform('loja-offline.com')
    expect(result.platform).toBeNull()
    expect(result.confidence).toBe(0)
    expect(result.indicators).toContain('Site não acessível')
  })

  it('retorna null quando plataforma não identificada', async () => {
    mockFetch('<html>loja customizada sem marca</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBeNull()
    expect(result.confidence).toBe(0)
  })

  it('detecta WordPress via meta generator (possível WooCommerce)', async () => {
    mockFetch('<html><meta name="generator" content="WordPress 6.4" /></html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('woocommerce')
    expect(result.confidence).toBe(50)
  })

  it('detecta Magento via meta generator', async () => {
    // Usar lowercase para não acionar o branch primário (html.includes('Magento'))
    mockFetch('<html><meta name="generator" content="magento_platform" /></html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('magento')
    expect(result.confidence).toBe(85)
  })

  it('detecta PrestaShop via meta generator (all-caps evita branch primário)', async () => {
    // PRESTASHOP (all caps) não aciona html.includes('prestashop') nem 'PrestaShop'
    // mas generator.toLowerCase().includes('prestashop') → true
    mockFetch('<html><meta name="generator" content="PRESTASHOP 1.7" /></html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBe('prestashop')
    expect(result.confidence).toBe(85)
  })

  it('cobre branch falso do && em /modules/ sem /themes/', async () => {
    // Aciona html.includes('/modules/') = true mas html.includes('/themes/') = false
    // cobre o ramo false do && na detecção de PrestaShop
    mockFetch('<html>/modules/algum-modulo</html>')
    const result = await detectPlatform('loja.com.br')
    expect(result.platform).toBeNull()
  })

  it('captura erro de fetch e retorna platform null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const result = await detectPlatform('loja-sem-rede.com')
    expect(result.platform).toBeNull()
    expect(result.confidence).toBe(0)
    expect(result.indicators[0]).toContain('Erro:')
  })
})

describe('SUPPORTED_PLATFORMS', () => {
  it('contém as 11 plataformas suportadas', () => {
    expect(SUPPORTED_PLATFORMS.length).toBe(11)
  })

  it('cada plataforma tem key, name e icon', () => {
    for (const platform of SUPPORTED_PLATFORMS) {
      expect(typeof platform.key).toBe('string')
      expect(typeof platform.name).toBe('string')
      expect(typeof platform.icon).toBe('string')
    }
  })

  it('shopify está na lista', () => {
    const shopify = SUPPORTED_PLATFORMS.find(p => p.key === 'shopify')
    expect(shopify).toBeDefined()
    expect(shopify?.name).toBe('Shopify')
  })
})

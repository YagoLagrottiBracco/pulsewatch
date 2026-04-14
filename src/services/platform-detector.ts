export interface PlatformDetectionResult {
  platform: string | null
  confidence: number
  indicators: string[]
}

/**
 * Detecta automaticamente a plataforma de e-commerce baseado no domínio
 */
export async function detectPlatform(domain: string): Promise<PlatformDetectionResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const url = `https://${cleanDomain}`

  const indicators: string[] = []
  let detectedPlatform: string | null = null
  let confidence = 0

  // Detecção rápida por domínio (sem precisar de fetch)
  if (cleanDomain.includes('.myshopify.com')) {
    return { platform: 'shopify', confidence: 99, indicators: ['Shopify detectado via domínio .myshopify.com'] }
  }
  if (cleanDomain.includes('.nuvemshop.com.br') || cleanDomain.includes('.tiendanube.com')) {
    return { platform: 'nuvemshop', confidence: 99, indicators: ['Nuvemshop detectado via domínio'] }
  }
  if (cleanDomain.includes('.mybigcommerce.com')) {
    return { platform: 'bigcommerce', confidence: 99, indicators: ['BigCommerce detectado via domínio'] }
  }
  if (cleanDomain.includes('.tray.com.br')) {
    return { platform: 'tray', confidence: 99, indicators: ['Tray detectado via domínio'] }
  }

  try {
    // Fetch da página principal
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PulseWatch/1.0' },
      redirect: 'follow',
    })

    if (!response.ok) {
      return { platform: null, confidence: 0, indicators: ['Site não acessível'] }
    }

    const html = await response.text()
    const headers = Object.fromEntries(response.headers.entries())

    // Shopify
    if (
      html.includes('Shopify') ||
      html.includes('cdn.shopify.com') ||
      headers['x-shopify-stage']
    ) {
      indicators.push('Shopify detectado via HTML/headers')
      detectedPlatform = 'shopify'
      confidence = 95
    }

    // WooCommerce
    else if (
      html.includes('woocommerce') ||
      html.includes('wp-content/plugins/woocommerce') ||
      html.includes('WooCommerce')
    ) {
      indicators.push('WooCommerce detectado via HTML')
      detectedPlatform = 'woocommerce'
      confidence = 90
    }

    // Nuvemshop
    else if (
      html.includes('nuvemshop') ||
      html.includes('tiendanube') ||
      cleanDomain.includes('.nuvemshop.com.br') ||
      cleanDomain.includes('.tiendanube.com')
    ) {
      indicators.push('Nuvemshop detectado via HTML/domínio')
      detectedPlatform = 'nuvemshop'
      confidence = 95
    }

    // VTEX
    else if (
      html.includes('vtex') ||
      html.includes('vtexcommercestable') ||
      html.includes('vteximg') ||
      headers['server']?.includes('VTEX')
    ) {
      indicators.push('VTEX detectado via HTML/headers')
      detectedPlatform = 'vtex'
      confidence = 90
    }

    // Magento
    else if (
      html.includes('Magento') ||
      html.includes('mage/cookies') ||
      html.includes('magento-init') ||
      html.includes('Mage.Cookies') ||
      headers['x-magento-cache-debug']
    ) {
      indicators.push('Magento detectado via HTML/headers')
      detectedPlatform = 'magento'
      confidence = 90
    }

    // BigCommerce
    else if (
      html.includes('bigcommerce') ||
      html.includes('cdn.bcapp.dev') ||
      headers['x-bc-storefront-request-id'] ||
      cleanDomain.includes('.mybigcommerce.com')
    ) {
      indicators.push('BigCommerce detectado via HTML/headers')
      detectedPlatform = 'bigcommerce'
      confidence = 95
    }

    // PrestaShop
    else if (
      html.includes('prestashop') ||
      html.includes('PrestaShop') ||
      html.includes('/modules/') && html.includes('/themes/') ||
      html.includes('prestashop.com')
    ) {
      indicators.push('PrestaShop detectado via HTML')
      detectedPlatform = 'prestashop'
      confidence = 85
    }

    // Spree Commerce
    else if (
      html.includes('spree') ||
      html.includes('Spree') ||
      html.includes('spree_application') ||
      headers['x-spree-version']
    ) {
      indicators.push('Spree detectado via HTML/headers')
      detectedPlatform = 'spree'
      confidence = 90
    }

    // Tray
    else if (
      html.includes('tray.com.br') ||
      html.includes('tray-commerce') ||
      cleanDomain.includes('.tray.com.br')
    ) {
      indicators.push('Tray detectado via HTML/domínio')
      detectedPlatform = 'tray'
      confidence = 90
    }

    // Fallback: tentar detectar via meta tags
    if (!detectedPlatform) {
      const metaGeneratorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i)
      if (metaGeneratorMatch) {
        const generator = metaGeneratorMatch[1].toLowerCase()
        
        if (generator.includes('wordpress')) {
          // Pode ser WooCommerce
          indicators.push('WordPress detectado, possível WooCommerce')
          detectedPlatform = 'woocommerce'
          confidence = 50
        } else if (generator.includes('magento')) {
          indicators.push('Magento detectado via meta generator')
          detectedPlatform = 'magento'
          confidence = 85
        } else if (generator.includes('prestashop')) {
          indicators.push('PrestaShop detectado via meta generator')
          detectedPlatform = 'prestashop'
          confidence = 85
        }
      }
    }

    // Se ainda não detectou, indicar que é desconhecido
    if (!detectedPlatform) {
      indicators.push('Plataforma não identificada automaticamente')
      return { platform: null, confidence: 0, indicators }
    }

    return {
      platform: detectedPlatform,
      confidence,
      indicators,
    }
  } catch (error: any) {
    console.error('Erro na detecção de plataforma:', error)
    return {
      platform: null,
      confidence: 0,
      indicators: [`Erro: ${error.message}`],
    }
  }
}

/**
 * Lista de todas as plataformas suportadas
 */
export const SUPPORTED_PLATFORMS = [
  { key: 'shopify', name: 'Shopify', icon: '🛍️' },
  { key: 'woocommerce', name: 'WooCommerce', icon: '🔌' },
  { key: 'nuvemshop', name: 'Nuvemshop', icon: '☁️' },
  { key: 'vtex', name: 'VTEX', icon: '🏢' },
  { key: 'magento', name: 'Magento', icon: '🔶' },
  { key: 'bigcommerce', name: 'BigCommerce', icon: '🏪' },
  { key: 'prestashop', name: 'PrestaShop', icon: '🛒' },
  { key: 'spree', name: 'Spree', icon: '🌲' },
  { key: 'tray', name: 'Tray', icon: '📦' },
  { key: 'mercadolivre', name: 'Mercado Livre', icon: '🛒' },
  { key: 'shopee', name: 'Shopee', icon: '🧡' },
] as const

export type PlatformKey = typeof SUPPORTED_PLATFORMS[number]['key']

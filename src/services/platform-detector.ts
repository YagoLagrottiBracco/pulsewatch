export type PlatformType = 'shopify' | 'woocommerce' | 'nuvemshop' | 'unknown'

export interface PlatformDetectionResult {
  platform: PlatformType
  confidence: number
  indicators: string[]
}

/**
 * Detecta automaticamente a plataforma de e-commerce de um domínio
 */
export async function detectPlatform(domain: string): Promise<PlatformDetectionResult> {
  const indicators: string[] = []
  let platform: PlatformType = 'unknown'
  let confidence = 0

  try {
    // Normalizar domínio
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const url = `https://${normalizedDomain}`

    // Tentar detectar Shopify
    const shopifyConfidence = await detectShopify(url, indicators)
    if (shopifyConfidence > confidence) {
      platform = 'shopify'
      confidence = shopifyConfidence
    }

    // Tentar detectar WooCommerce
    const wooConfidence = await detectWooCommerce(url, indicators)
    if (wooConfidence > confidence) {
      platform = 'woocommerce'
      confidence = wooConfidence
    }

    // Tentar detectar Nuvemshop
    const nuvemConfidence = await detectNuvemshop(url, indicators)
    if (nuvemConfidence > confidence) {
      platform = 'nuvemshop'
      confidence = nuvemConfidence
    }

    return {
      platform,
      confidence,
      indicators,
    }
  } catch (error) {
    console.error('Erro na detecção de plataforma:', error)
    return {
      platform: 'unknown',
      confidence: 0,
      indicators: ['Erro ao acessar domínio'],
    }
  }
}

/**
 * Detecta se é uma loja Shopify
 */
async function detectShopify(url: string, indicators: string[]): Promise<number> {
  let confidence = 0

  try {
    // Verificar endpoint /products.json (típico do Shopify)
    const productsResponse = await fetch(`${url}/products.json`, {
      method: 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    if (productsResponse.ok) {
      const data = await productsResponse.json()
      if (data.products && Array.isArray(data.products)) {
        indicators.push('Endpoint /products.json encontrado (Shopify)')
        confidence += 50
      }
    }

    // Verificar HTML para meta tags Shopify
    const htmlResponse = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    if (htmlResponse.ok) {
      const html = await htmlResponse.text()

      if (html.includes('Shopify.theme') || html.includes('Shopify.shop')) {
        indicators.push('JavaScript Shopify detectado')
        confidence += 30
      }

      if (html.includes('cdn.shopify.com')) {
        indicators.push('CDN Shopify detectado')
        confidence += 20
      }

      if (html.includes('shopify-section')) {
        indicators.push('Seções Shopify detectadas')
        confidence += 10
      }
    }
  } catch (error) {
    // Erro silencioso
  }

  return Math.min(confidence, 100)
}

/**
 * Detecta se é uma loja WooCommerce
 */
async function detectWooCommerce(url: string, indicators: string[]): Promise<number> {
  let confidence = 0

  try {
    // Verificar endpoint WooCommerce REST API
    const apiResponse = await fetch(`${url}/wp-json/wc/store/products`, {
      method: 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    if (apiResponse.ok) {
      indicators.push('API WooCommerce detectada (/wp-json/wc/store/products)')
      confidence += 50
    }

    // Verificar HTML
    const htmlResponse = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    if (htmlResponse.ok) {
      const html = await htmlResponse.text()

      if (html.includes('woocommerce') || html.includes('WooCommerce')) {
        indicators.push('Marcadores WooCommerce encontrados')
        confidence += 30
      }

      if (html.includes('wp-content/plugins/woocommerce')) {
        indicators.push('Plugin WooCommerce detectado')
        confidence += 20
      }

      if (html.includes('cart') && html.includes('wp-')) {
        indicators.push('Estrutura WordPress + carrinho detectada')
        confidence += 10
      }
    }
  } catch (error) {
    // Erro silencioso
  }

  return Math.min(confidence, 100)
}

/**
 * Detecta se é uma loja Nuvemshop
 */
async function detectNuvemshop(url: string, indicators: string[]): Promise<number> {
  let confidence = 0

  try {
    // Verificar HTML
    const htmlResponse = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    if (htmlResponse.ok) {
      const html = await htmlResponse.text()

      if (html.includes('nuvemshop.com.br') || html.includes('tiendanube.com')) {
        indicators.push('Assets Nuvemshop detectados')
        confidence += 50
      }

      if (html.includes('LS.ready') || html.includes('LS.')) {
        indicators.push('JavaScript Nuvemshop detectado (LS)')
        confidence += 30
      }

      if (html.includes('d26lpennugtm8s.cloudfront.net')) {
        indicators.push('CDN Nuvemshop detectada')
        confidence += 20
      }

      // Verificar estrutura de URL típica
      if (url.includes('.lojavirtualnuvem.com.br') || url.includes('.mitiendanube.com')) {
        indicators.push('Subdomínio Nuvemshop detectado')
        confidence += 40
      }
    }
  } catch (error) {
    // Erro silencioso
  }

  return Math.min(confidence, 100)
}

/**
 * Verifica se a loja está online
 */
export async function checkStoreStatus(url: string): Promise<boolean> {
  try {
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    const response = await fetch(normalizedUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': 'PulseWatch/1.0' },
    })

    return response.ok
  } catch (error) {
    return false
  }
}

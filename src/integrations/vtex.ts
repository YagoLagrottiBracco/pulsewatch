export interface VtexConfig {
  accountName: string
  appKey: string
  appToken: string
  environment?: string
}

export interface VtexSellerOffer {
  commertialOffer?: {
    AvailableQuantity?: number
    Price?: number
  }
}

export interface VtexItem {
  itemId: string
  name: string
  sellers?: VtexSellerOffer[]
}

export interface VtexSearchProduct {
  productId: string | number
  productName: string
  brand?: string
  categories?: string[]
  link?: string
  linkText?: string
  items?: VtexItem[]
}

export class VtexClient {
  private accountName: string
  private appKey: string
  private appToken: string
  private environment: string

  constructor(config: VtexConfig) {
    this.accountName = config.accountName
    this.appKey = config.appKey
    this.appToken = config.appToken
    this.environment = config.environment || 'vtexcommercestable'
  }

  private get baseUrl() {
    return `https://${this.accountName}.${this.environment}.com.br`
  }

  private getHeaders(): HeadersInit {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
      'X-VTEX-API-AppKey': this.appKey,
      'X-VTEX-API-AppToken': this.appToken,
    }
  }

  /**
   * Buscar produtos via API de busca de catálogo
   */
  async fetchProducts(from: number = 0, to: number = 49): Promise<VtexSearchProduct[]> {
    const url = `${this.baseUrl}/api/catalog_system/pub/products/search?_from=${from}&_to=${to}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`VTEX API error: ${response.status}`)
    }

    const data = (await response.json()) as VtexSearchProduct[]
    return Array.isArray(data) ? data : []
  }
}

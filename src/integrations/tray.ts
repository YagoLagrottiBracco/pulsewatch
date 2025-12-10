export interface TrayConfig {
  domain: string
  accessToken: string
}

export interface TrayProductUrl {
  http?: string
  https?: string
}

export interface TrayProduct {
  id: string
  name: string
  price: string
  promotional_price: string
  stock: string
  category_id?: string
  brand?: string
  reference?: string
  url?: TrayProductUrl
}

interface TrayProductsResponse {
  paging?: any
  Products?: Array<{
    Product: TrayProduct
  }>
}

export class TrayClient {
  private domain: string
  private accessToken: string

  constructor(config: TrayConfig) {
    this.domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    this.accessToken = config.accessToken
  }

  /**
   * Buscar produtos na API da Tray
   */
  async fetchProducts(limit: number = 50, page: number = 1): Promise<TrayProduct[]> {
    const url = `https://${this.domain}/web_api/products?access_token=${this.accessToken}&limit=${limit}&page=${page}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PulseWatch/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data: TrayProductsResponse = await response.json()
    const items = data.Products || []

    return items.map((p) => p.Product)
  }
}

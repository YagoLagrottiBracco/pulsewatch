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

export interface TrayOrder {
  id: string
  status_id: string
  date: string
  total: string
  customer_id: string
  payment_method_id?: string
}

interface TrayOrdersResponse {
  paging?: any
  Orders?: Array<{
    Order: TrayOrder
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

  /**
   * Buscar pedidos recentes
   */
  async fetchOrders(limit: number = 50, page: number = 1): Promise<TrayOrder[]> {
    const url = `https://${this.domain}/web_api/orders?access_token=${this.accessToken}&limit=${limit}&page=${page}`

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PulseWatch/1.0' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return []

      const data: TrayOrdersResponse = await response.json()
      return (data.Orders || []).map((o) => o.Order)
    } catch (error) {
      console.error('Erro ao buscar pedidos Tray:', error)
      return []
    }
  }

  /**
   * Obter estoque disponível de um produto
   */
  async fetchInventory(productId: string): Promise<number> {
    const url = `https://${this.domain}/web_api/products/${productId}?access_token=${this.accessToken}`

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PulseWatch/1.0' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return 0

      const data = await response.json()
      const product: TrayProduct | undefined = data.Product
      return Number(product?.stock || '0') || 0
    } catch (error) {
      console.error('Erro ao buscar estoque Tray:', error)
      return 0
    }
  }

  /**
   * Verificar se a API está acessível
   */
  async checkStatus(): Promise<boolean> {
    const url = `https://${this.domain}/web_api/products?access_token=${this.accessToken}&limit=1`

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PulseWatch/1.0' },
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

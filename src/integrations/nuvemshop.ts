export interface NuvemshopConfig {
  storeId: string
  accessToken?: string
}

export interface NuvemshopProduct {
  id: number
  name: {
    pt: string
  }
  description: {
    pt: string
  }
  handle: {
    pt: string
  }
  variants: NuvemshopVariant[]
  images: NuvemshopImage[]
  created_at: string
  updated_at: string
  published: boolean
}

export interface NuvemshopVariant {
  id: number
  product_id: number
  sku: string
  stock: number
  price: string
  promotional_price: string | null
}

export interface NuvemshopImage {
  id: number
  src: string
  position: number
}

export interface NuvemshopOrder {
  id: number
  token: string
  store_id: string
  contact_email: string
  contact_name: string
  created_at: string
  updated_at: string
  number: number
  price: string
  products: NuvemshopOrderProduct[]
  payment_status: string
  shipping_status: string
}

export interface NuvemshopOrderProduct {
  id: number
  product_id: number
  variant_id: number
  name: string
  price: string
  quantity: number
}

export class NuvemshopClient {
  private storeId: string
  private accessToken?: string
  private apiBase: string

  constructor(config: NuvemshopConfig) {
    this.storeId = config.storeId
    this.accessToken = config.accessToken
    this.apiBase = 'https://api.nuvemshop.com.br/v1'
  }

  /**
   * Obter headers de autenticação
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }

    if (this.accessToken) {
      headers['Authentication'] = `bearer ${this.accessToken}`
    }

    return headers
  }

  /**
   * Buscar produtos
   */
  async fetchProducts(perPage: number = 50): Promise<NuvemshopProduct[]> {
    if (!this.accessToken) {
      throw new Error('Access token necessário para buscar produtos Nuvemshop')
    }

    try {
      const url = `${this.apiBase}/${this.storeId}/products?per_page=${perPage}`

      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar produtos Nuvemshop:', error)
      return []
    }
  }

  /**
   * Buscar pedidos
   */
  async fetchOrders(perPage: number = 50): Promise<NuvemshopOrder[]> {
    if (!this.accessToken) {
      throw new Error('Access token necessário para buscar pedidos Nuvemshop')
    }

    try {
      const url = `${this.apiBase}/${this.storeId}/orders?per_page=${perPage}`

      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar pedidos Nuvemshop:', error)
      return []
    }
  }

  /**
   * Buscar inventário de um produto
   */
  async fetchInventory(productId: number): Promise<number> {
    if (!this.accessToken) {
      return 0
    }

    try {
      const url = `${this.apiBase}/${this.storeId}/products/${productId}`

      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return 0
      }

      const product: NuvemshopProduct = await response.json()

      // Somar estoque de todas as variantes
      let totalStock = 0
      if (product.variants && Array.isArray(product.variants)) {
        totalStock = product.variants.reduce(
          (sum, variant) => sum + (variant.stock || 0),
          0
        )
      }

      return totalStock
    } catch (error) {
      console.error('Erro ao buscar inventário:', error)
      return 0
    }
  }

  /**
   * Verificar se a loja está online
   * (Nuvemshop não tem endpoint público fácil, então verificamos a API)
   */
  async checkStatus(): Promise<boolean> {
    if (!this.accessToken) {
      return false
    }

    try {
      const url = `${this.apiBase}/${this.storeId}/products?per_page=1`

      const response = await fetch(url, {
        method: 'HEAD',
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Buscar pedidos recentes (últimas 24h) para métricas em tempo real
   */
  async fetchRecentOrders(hoursBack = 24): Promise<NuvemshopOrder[]> {
    if (!this.accessToken) return []

    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()
      const url = `${this.apiBase}/${this.storeId}/orders?created_at_min=${since}&per_page=200`

      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) return []

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar pedidos recentes Nuvemshop:', error)
      return []
    }
  }

  /**
   * Obter métricas de vendas (total vendido hoje, ticket médio, pedidos do dia)
   */
  async getStoreSalesMetrics(): Promise<{
    totalSalesToday: number
    ordersToday: number
    averageTicket: number
  } | null> {
    try {
      const orders = await this.fetchRecentOrders(24)
      if (!orders || orders.length === 0) {
        return { totalSalesToday: 0, ordersToday: 0, averageTicket: 0 }
      }

      const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.price || '0'), 0)
      const averageTicket = totalSales / orders.length

      return {
        totalSalesToday: totalSales,
        ordersToday: orders.length,
        averageTicket: Math.round(averageTicket * 100) / 100,
      }
    } catch (error) {
      console.error('Erro ao calcular métricas Nuvemshop:', error)
      return null
    }
  }

  /**
   * Obter informações da loja
   */
  async getStoreInfo(): Promise<any | null> {
    if (!this.accessToken) {
      return null
    }

    try {
      const url = `${this.apiBase}/${this.storeId}/store`

      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao obter info da loja:', error)
      return null
    }
  }
}

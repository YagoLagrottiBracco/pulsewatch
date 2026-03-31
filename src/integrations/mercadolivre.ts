export interface MercadoLivreConfig {
  accessToken: string
  refreshToken?: string
  userId?: string
}

export interface MercadoLivreProduct {
  id: string
  title: string
  price: number
  currency_id: string
  available_quantity: number
  sold_quantity: number
  status: string // active, paused, closed, under_review
  permalink: string
  thumbnail: string
  category_id: string
  listing_type_id: string
  condition: string
  date_created: string
  last_updated: string
}

export interface MercadoLivreOrder {
  id: number
  date_created: string
  date_closed: string
  status: string
  total_amount: number
  currency_id: string
  buyer: {
    id: number
    nickname: string
    email: string
  }
  order_items: Array<{
    item: { id: string; title: string }
    quantity: number
    unit_price: number
  }>
}

export interface MercadoLivreReputation {
  level_id: string // 1_red, 2_orange, 3_yellow, 4_light_green, 5_green
  power_seller_status: string | null
  transactions: {
    total: number
    completed: number
    canceled: number
    ratings: {
      positive: number
      neutral: number
      negative: number
    }
  }
}

export class MercadoLivreClient {
  private accessToken: string
  private userId?: string
  private apiBase: string

  constructor(config: MercadoLivreConfig) {
    this.accessToken = config.accessToken
    this.userId = config.userId
    this.apiBase = 'https://api.mercadolibre.com'
  }

  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }
  }

  /**
   * Obter userId se nao foi fornecido
   */
  async resolveUserId(): Promise<string | null> {
    if (this.userId) return this.userId

    try {
      const response = await fetch(`${this.apiBase}/users/me`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return null

      const data = await response.json()
      this.userId = String(data.id)
      return this.userId
    } catch (error) {
      console.error('Erro ao resolver userId ML:', error)
      return null
    }
  }

  /**
   * Buscar listagens ativas do seller
   */
  async fetchProducts(limit = 50): Promise<MercadoLivreProduct[]> {
    try {
      const userId = await this.resolveUserId()
      if (!userId) return []

      // Buscar IDs dos items
      const searchUrl = `${this.apiBase}/users/${userId}/items/search?limit=${limit}&status=active`
      const searchResponse = await fetch(searchUrl, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!searchResponse.ok) return []

      const searchData = await searchResponse.json()
      const itemIds: string[] = searchData.results || []

      if (itemIds.length === 0) return []

      // Buscar detalhes dos items (multiget, max 20 por request)
      const products: MercadoLivreProduct[] = []
      const chunks = []
      for (let i = 0; i < itemIds.length; i += 20) {
        chunks.push(itemIds.slice(i, i + 20))
      }

      for (const chunk of chunks) {
        const idsParam = chunk.join(',')
        const itemsUrl = `${this.apiBase}/items?ids=${idsParam}`
        const itemsResponse = await fetch(itemsUrl, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(10000),
        })

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json()
          for (const item of itemsData) {
            if (item.code === 200 && item.body) {
              products.push(item.body as MercadoLivreProduct)
            }
          }
        }
      }

      return products
    } catch (error) {
      console.error('Erro ao buscar produtos ML:', error)
      return []
    }
  }

  /**
   * Buscar pedidos recentes
   */
  async fetchOrders(limit = 50): Promise<MercadoLivreOrder[]> {
    try {
      const userId = await this.resolveUserId()
      if (!userId) return []

      const url = `${this.apiBase}/orders/search?seller=${userId}&sort=date_desc&limit=${limit}`
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.results || []
    } catch (error) {
      console.error('Erro ao buscar pedidos ML:', error)
      return []
    }
  }

  /**
   * Obter reputacao do seller
   */
  async getSellerReputation(): Promise<MercadoLivreReputation | null> {
    try {
      const userId = await this.resolveUserId()
      if (!userId) return null

      const url = `${this.apiBase}/users/${userId}`
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.seller_reputation || null
    } catch (error) {
      console.error('Erro ao buscar reputação ML:', error)
      return null
    }
  }

  /**
   * Verificar listagens pausadas/bloqueadas
   */
  async checkPausedListings(): Promise<MercadoLivreProduct[]> {
    try {
      const userId = await this.resolveUserId()
      if (!userId) return []

      const url = `${this.apiBase}/users/${userId}/items/search?status=paused&limit=50`
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return []

      const data = await response.json()
      const itemIds: string[] = data.results || []
      if (itemIds.length === 0) return []

      // Fetch details
      const idsParam = itemIds.slice(0, 20).join(',')
      const itemsResponse = await fetch(`${this.apiBase}/items?ids=${idsParam}`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!itemsResponse.ok) return []

      const itemsData = await itemsResponse.json()
      return itemsData
        .filter((item: any) => item.code === 200 && item.body)
        .map((item: any) => item.body as MercadoLivreProduct)
    } catch (error) {
      console.error('Erro ao verificar listagens pausadas ML:', error)
      return []
    }
  }

  /**
   * Verificar status da API
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/users/me`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

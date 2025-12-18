export interface SpreeConfig {
  baseUrl: string
  apiToken?: string
}

export interface SpreeProduct {
  id: string
  name: string
  description: string
  slug: string
  available_on: string
  meta_description: string
  meta_keywords: string
  price: string
  display_price: string
  has_variants: boolean
  master: SpreeVariant
  variants: SpreeVariant[]
}

export interface SpreeVariant {
  id: string
  sku: string
  price: string
  weight: string
  height: string
  width: string
  depth: string
  is_master: boolean
  cost_price: string
  position: number
  track_inventory: boolean
  total_on_hand: number
  images: SpreeImage[]
}

export interface SpreeImage {
  id: string
  position: number
  attachment_content_type: string
  attachment_file_name: string
  type: string
  attachment_updated_at: string
  attachment_width: number
  attachment_height: number
  alt: string
  viewable_type: string
  viewable_id: string
  mini_url: string
  small_url: string
  product_url: string
  large_url: string
}

export interface SpreeOrder {
  id: string
  number: string
  item_total: string
  total: string
  ship_total: string
  state: string
  adjustment_total: string
  user_id: string
  created_at: string
  updated_at: string
  completed_at: string
  payment_total: string
  shipment_state: string
  payment_state: string
  email: string
  line_items: SpreeLineItem[]
}

export interface SpreeLineItem {
  id: string
  quantity: number
  price: string
  variant_id: string
  variant: SpreeVariant
  adjustments: any[]
  currency: string
}

export class SpreeClient {
  private baseUrl: string
  private apiToken?: string

  constructor(config: SpreeConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiToken = config.apiToken
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`
    }

    return headers
  }

  /**
   * Buscar produtos
   * Spree é headless, então usa API REST/GraphQL
   */
  async fetchProducts(page: number = 1, perPage: number = 50): Promise<SpreeProduct[]> {
    try {
      const url = `${this.baseUrl}/api/v2/storefront/products?page=${page}&per_page=${perPage}&include=variants,images`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar produtos Spree:', error)
      return []
    }
  }

  /**
   * Buscar pedidos (requer autenticação)
   */
  async fetchOrders(page: number = 1, perPage: number = 50): Promise<SpreeOrder[]> {
    if (!this.apiToken) {
      throw new Error('API token necessário para buscar pedidos')
    }

    try {
      const url = `${this.baseUrl}/api/v2/storefront/account/orders?page=${page}&per_page=${perPage}&include=line_items`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Erro ao buscar pedidos Spree:', error)
      return []
    }
  }

  /**
   * Buscar detalhes de um produto específico
   */
  async fetchProductDetails(productId: string): Promise<SpreeProduct | null> {
    try {
      const url = `${this.baseUrl}/api/v2/storefront/products/${productId}?include=variants,images`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return data.data || null
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto Spree:', error)
      return null
    }
  }

  /**
   * Buscar inventário de um produto
   */
  async fetchInventory(productId: string): Promise<number> {
    try {
      const product = await this.fetchProductDetails(productId)
      
      if (!product) return 0

      // Somar total_on_hand de todas as variantes
      let totalInventory = 0
      
      if (product.master) {
        totalInventory += product.master.total_on_hand || 0
      }

      if (product.variants && Array.isArray(product.variants)) {
        totalInventory += product.variants.reduce(
          (sum, variant) => sum + (variant.total_on_hand || 0),
          0
        )
      }

      return totalInventory
    } catch (error) {
      console.error('Erro ao buscar inventário Spree:', error)
      return 0
    }
  }

  /**
   * Verificar se a API está online
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/storefront/products?per_page=1`, {
        method: 'HEAD',
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}

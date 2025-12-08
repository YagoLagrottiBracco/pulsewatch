export interface ShopifyConfig {
  domain: string
  accessToken?: string
  apiVersion?: string
}

export interface ShopifyProduct {
  id: number
  title: string
  handle: string
  vendor: string
  product_type: string
  created_at: string
  updated_at: string
  published_at: string
  variants: ShopifyVariant[]
  images: ShopifyImage[]
}

export interface ShopifyVariant {
  id: number
  product_id: number
  title: string
  price: string
  sku: string
  inventory_quantity: number
  inventory_management: string
}

export interface ShopifyImage {
  id: number
  product_id: number
  src: string
  alt: string | null
}

export interface ShopifyOrder {
  id: number
  order_number: number
  email: string
  created_at: string
  updated_at: string
  total_price: string
  subtotal_price: string
  financial_status: string
  fulfillment_status: string
  line_items: ShopifyLineItem[]
}

export interface ShopifyLineItem {
  id: number
  variant_id: number
  title: string
  quantity: number
  price: string
}

export class ShopifyClient {
  private domain: string
  private accessToken?: string
  private apiVersion: string

  constructor(config: ShopifyConfig) {
    this.domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    this.accessToken = config.accessToken
    this.apiVersion = config.apiVersion || '2024-01'
  }

  /**
   * Buscar produtos (via API pública ou Admin API)
   */
  async fetchProducts(limit: number = 50): Promise<ShopifyProduct[]> {
    try {
      if (this.accessToken) {
        return await this.fetchProductsWithToken(limit)
      } else {
        return await this.fetchProductsPublic(limit)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos Shopify:', error)
      return []
    }
  }

  /**
   * Buscar produtos via API pública (sem autenticação)
   */
  private async fetchProductsPublic(limit: number): Promise<ShopifyProduct[]> {
    const url = `https://${this.domain}/products.json?limit=${limit}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PulseWatch/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.products || []
  }

  /**
   * Buscar produtos via Admin API (com token)
   */
  private async fetchProductsWithToken(limit: number): Promise<ShopifyProduct[]> {
    const url = `https://${this.domain}/admin/api/${this.apiVersion}/products.json?limit=${limit}`

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': this.accessToken!,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data.products || []
  }

  /**
   * Buscar pedidos (requer Admin API)
   */
  async fetchOrders(limit: number = 50): Promise<ShopifyOrder[]> {
    if (!this.accessToken) {
      throw new Error('Access token necessário para buscar pedidos')
    }

    try {
      const url = `https://${this.domain}/admin/api/${this.apiVersion}/orders.json?limit=${limit}&status=any`

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.orders || []
    } catch (error) {
      console.error('Erro ao buscar pedidos Shopify:', error)
      return []
    }
  }

  /**
   * Buscar inventário de um produto
   */
  async fetchInventory(productId: number): Promise<number> {
    try {
      const url = `https://${this.domain}/products/${productId}.json`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PulseWatch/1.0',
        },
      })

      if (!response.ok) {
        return 0
      }

      const data = await response.json()
      const product = data.product

      // Somar inventory_quantity de todas as variantes
      let totalInventory = 0
      if (product.variants && Array.isArray(product.variants)) {
        totalInventory = product.variants.reduce(
          (sum: number, variant: ShopifyVariant) => sum + (variant.inventory_quantity || 0),
          0
        )
      }

      return totalInventory
    } catch (error) {
      console.error('Erro ao buscar inventário:', error)
      return 0
    }
  }

  /**
   * Verificar se a loja está online
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`https://${this.domain}`, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'PulseWatch/1.0',
        },
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}

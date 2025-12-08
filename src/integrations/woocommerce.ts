export interface WooCommerceConfig {
  domain: string
  consumerKey?: string
  consumerSecret?: string
}

export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  permalink: string
  date_created: string
  date_modified: string
  type: string
  status: string
  price: string
  regular_price: string
  sale_price: string
  stock_quantity: number | null
  stock_status: string
  sku: string
  images: WooCommerceImage[]
}

export interface WooCommerceImage {
  id: number
  src: string
  alt: string
}

export interface WooCommerceOrder {
  id: number
  order_key: string
  status: string
  currency: string
  date_created: string
  date_modified: string
  total: string
  subtotal: string
  line_items: WooCommerceLineItem[]
  billing: {
    email: string
    first_name: string
    last_name: string
  }
}

export interface WooCommerceLineItem {
  id: number
  name: string
  product_id: number
  quantity: number
  total: string
  price: number
}

export class WooCommerceClient {
  private domain: string
  private consumerKey?: string
  private consumerSecret?: string

  constructor(config: WooCommerceConfig) {
    this.domain = config.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    this.consumerKey = config.consumerKey
    this.consumerSecret = config.consumerSecret
  }

  /**
   * Buscar produtos (via Store API ou REST API)
   */
  async fetchProducts(perPage: number = 50): Promise<WooCommerceProduct[]> {
    try {
      if (this.consumerKey && this.consumerSecret) {
        return await this.fetchProductsWithAuth(perPage)
      } else {
        return await this.fetchProductsPublic(perPage)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos WooCommerce:', error)
      return []
    }
  }

  /**
   * Buscar produtos via Store API (sem autenticação)
   */
  private async fetchProductsPublic(perPage: number): Promise<WooCommerceProduct[]> {
    const url = `https://${this.domain}/wp-json/wc/store/products?per_page=${perPage}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PulseWatch/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const products = await response.json()
    
    // Converter formato Store API para formato REST API
    return products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      permalink: p.permalink,
      date_created: p.date_created || '',
      date_modified: p.date_modified || '',
      type: p.type || 'simple',
      status: 'publish',
      price: p.prices?.price || '0',
      regular_price: p.prices?.regular_price || '0',
      sale_price: p.prices?.sale_price || '',
      stock_quantity: p.stock_quantity || null,
      stock_status: p.is_in_stock ? 'instock' : 'outofstock',
      sku: p.sku || '',
      images: p.images?.map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt,
      })) || [],
    }))
  }

  /**
   * Buscar produtos via REST API (com autenticação)
   */
  private async fetchProductsWithAuth(perPage: number): Promise<WooCommerceProduct[]> {
    const url = `https://${this.domain}/wp-json/wc/v3/products?per_page=${perPage}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PulseWatch/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Buscar pedidos (requer autenticação)
   */
  async fetchOrders(perPage: number = 50): Promise<WooCommerceOrder[]> {
    if (!this.consumerKey || !this.consumerSecret) {
      throw new Error('Credenciais necessárias para buscar pedidos')
    }

    try {
      const url = `https://${this.domain}/wp-json/wc/v3/orders?per_page=${perPage}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'PulseWatch/1.0',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar pedidos WooCommerce:', error)
      return []
    }
  }

  /**
   * Buscar inventário de um produto
   */
  async fetchInventory(productId: number): Promise<number> {
    try {
      const products = await this.fetchProducts(100)
      const product = products.find((p) => p.id === productId)

      return product?.stock_quantity || 0
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

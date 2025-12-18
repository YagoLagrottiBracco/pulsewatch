export interface BigCommerceConfig {
  storeHash: string
  accessToken: string
  apiVersion?: string
}

export interface BigCommerceProduct {
  id: number
  name: string
  type: string
  sku: string
  description: string
  weight: number
  price: number
  cost_price: number
  retail_price: number
  sale_price: number
  inventory_level: number
  inventory_tracking: string
  is_visible: boolean
  date_created: string
  date_modified: string
}

export interface BigCommerceOrder {
  id: number
  customer_id: number
  date_created: string
  date_modified: string
  date_shipped: string
  status_id: number
  status: string
  subtotal_ex_tax: string
  subtotal_inc_tax: string
  total_inc_tax: string
  total_ex_tax: string
  items_total: number
  customer_message: string
  products: BigCommerceOrderProduct[]
}

export interface BigCommerceOrderProduct {
  id: number
  order_id: number
  product_id: number
  name: string
  sku: string
  quantity: number
  base_price: string
  price_ex_tax: string
  price_inc_tax: string
}

export class BigCommerceClient {
  private storeHash: string
  private accessToken: string
  private apiVersion: string

  constructor(config: BigCommerceConfig) {
    this.storeHash = config.storeHash
    this.accessToken = config.accessToken
    this.apiVersion = config.apiVersion || 'v3'
  }

  private get baseUrl() {
    return `https://api.bigcommerce.com/stores/${this.storeHash}/${this.apiVersion}`
  }

  private getHeaders(): HeadersInit {
    return {
      'X-Auth-Token': this.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }
  }

  /**
   * Buscar produtos
   */
  async fetchProducts(limit: number = 50, page: number = 1): Promise<BigCommerceProduct[]> {
    try {
      const url = `${this.baseUrl}/catalog/products?limit=${limit}&page=${page}&include_fields=id,name,sku,price,inventory_level,inventory_tracking,date_created,date_modified`

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
      console.error('Erro ao buscar produtos BigCommerce:', error)
      return []
    }
  }

  /**
   * Buscar pedidos
   */
  async fetchOrders(limit: number = 50, page: number = 1): Promise<BigCommerceOrder[]> {
    try {
      // V2 API para orders (mais completa)
      const url = `https://api.bigcommerce.com/stores/${this.storeHash}/v2/orders?limit=${limit}&page=${page}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const orders = await response.json()
      
      // Buscar produtos de cada pedido
      if (Array.isArray(orders)) {
        for (const order of orders) {
          order.products = await this.fetchOrderProducts(order.id)
        }
      }

      return Array.isArray(orders) ? orders : []
    } catch (error) {
      console.error('Erro ao buscar pedidos BigCommerce:', error)
      return []
    }
  }

  /**
   * Buscar produtos de um pedido específico
   */
  private async fetchOrderProducts(orderId: number): Promise<BigCommerceOrderProduct[]> {
    try {
      const url = `https://api.bigcommerce.com/stores/${this.storeHash}/v2/orders/${orderId}/products`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return []
      }

      const products = await response.json()
      return Array.isArray(products) ? products : []
    } catch (error) {
      console.error('Erro ao buscar produtos do pedido:', error)
      return []
    }
  }

  /**
   * Buscar inventário de um produto
   */
  async fetchInventory(productId: number): Promise<number> {
    try {
      const url = `${this.baseUrl}/catalog/products/${productId}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return 0
      }

      const data = await response.json()
      const product = data.data

      return product.inventory_level || 0
    } catch (error) {
      console.error('Erro ao buscar inventário BigCommerce:', error)
      return 0
    }
  }

  /**
   * Verificar se a loja está online (verifica via API)
   */
  async checkStatus(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/store`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      return response.ok
    } catch (error) {
      return false
    }
  }
}

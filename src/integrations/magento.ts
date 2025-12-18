export interface MagentoConfig {
  baseUrl: string
  accessToken?: string
  username?: string
  password?: string
  storeCode?: string
}

export interface MagentoProduct {
  id: number
  sku: string
  name: string
  price: number
  status: number
  visibility: number
  type_id: string
  created_at: string
  updated_at: string
  extension_attributes?: {
    stock_item?: {
      qty: number
      is_in_stock: boolean
    }
  }
  custom_attributes?: Array<{
    attribute_code: string
    value: any
  }>
}

export interface MagentoOrder {
  entity_id: number
  increment_id: string
  state: string
  status: string
  customer_email: string
  created_at: string
  updated_at: string
  grand_total: number
  subtotal: number
  items: MagentoOrderItem[]
}

export interface MagentoOrderItem {
  item_id: number
  order_id: number
  product_id: number
  sku: string
  name: string
  qty_ordered: number
  price: number
}

export interface MagentoStockItem {
  item_id: number
  product_id: number
  qty: number
  is_in_stock: boolean
}

export class MagentoClient {
  private baseUrl: string
  private accessToken?: string
  private username?: string
  private password?: string
  private storeCode: string

  constructor(config: MagentoConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.accessToken = config.accessToken
    this.username = config.username
    this.password = config.password
    this.storeCode = config.storeCode || 'default'
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    } else if (this.username && this.password) {
      // Get token via integration
      const token = await this.getIntegrationToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  private async getIntegrationToken(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/V1/integration/admin/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      })

      if (!response.ok) return null

      const token = await response.json()
      return token
    } catch (error) {
      console.error('Erro ao obter token Magento:', error)
      return null
    }
  }

  /**
   * Buscar produtos
   */
  async fetchProducts(pageSize: number = 50, currentPage: number = 1): Promise<MagentoProduct[]> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseUrl}/rest/${this.storeCode}/V1/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Erro ao buscar produtos Magento:', error)
      return []
    }
  }

  /**
   * Buscar pedidos
   */
  async fetchOrders(pageSize: number = 50, currentPage: number = 1): Promise<MagentoOrder[]> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseUrl}/rest/${this.storeCode}/V1/orders?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${currentPage}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.items || []
    } catch (error) {
      console.error('Erro ao buscar pedidos Magento:', error)
      return []
    }
  }

  /**
   * Buscar estoque de um produto por SKU
   */
  async fetchInventory(sku: string): Promise<number> {
    try {
      const headers = await this.getHeaders()
      const url = `${this.baseUrl}/rest/${this.storeCode}/V1/stockItems/${encodeURIComponent(sku)}`

      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return 0
      }

      const stockItem: MagentoStockItem = await response.json()
      return stockItem.qty || 0
    } catch (error) {
      console.error('Erro ao buscar inventário Magento:', error)
      return 0
    }
  }

  /**
   * Verificar se a loja está online
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health_check.php`, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'PulseWatch/1.0',
        },
      })

      // Se health_check não existir, tenta a home
      if (response.status === 404) {
        const homeResponse = await fetch(this.baseUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'PulseWatch/1.0',
          },
        })
        return homeResponse.ok
      }

      return response.ok
    } catch (error) {
      return false
    }
  }
}

export interface PrestaShopConfig {
  baseUrl: string
  apiKey: string
}

export interface PrestaShopProduct {
  id: number
  id_manufacturer: number
  id_supplier: number
  id_category_default: number
  reference: string
  price: string
  wholesale_price: string
  active: boolean
  quantity: number
  name: string
  description: string
  date_add: string
  date_upd: string
}

export interface PrestaShopOrder {
  id: number
  id_customer: number
  id_cart: number
  reference: string
  current_state: number
  total_paid: string
  total_paid_real: string
  total_products: string
  total_products_wt: string
  date_add: string
  date_upd: string
  associations?: {
    order_rows?: PrestaShopOrderRow[]
  }
}

export interface PrestaShopOrderRow {
  id: number
  product_id: number
  product_name: string
  product_quantity: number
  product_price: string
  product_reference: string
}

export interface PrestaShopStockAvailable {
  id: number
  id_product: number
  id_product_attribute: number
  quantity: number
  depends_on_stock: boolean
  out_of_stock: number
}

export class PrestaShopClient {
  private baseUrl: string
  private apiKey: string

  constructor(config: PrestaShopConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.apiKey = config.apiKey
  }

  private getHeaders(): HeadersInit {
    // PrestaShop usa Basic Auth com API key como username
    const auth = Buffer.from(`${this.apiKey}:`).toString('base64')
    
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
    }
  }

  /**
   * Buscar produtos
   */
  async fetchProducts(limit: number = 50, offset: number = 0): Promise<PrestaShopProduct[]> {
    try {
      const url = `${this.baseUrl}/api/products?output_format=JSON&display=full&limit=${offset},${limit}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // PrestaShop retorna em formato específico
      if (data.products && Array.isArray(data.products)) {
        return data.products.map((p: any) => p.product || p)
      }

      return []
    } catch (error) {
      console.error('Erro ao buscar produtos PrestaShop:', error)
      return []
    }
  }

  /**
   * Buscar pedidos
   */
  async fetchOrders(limit: number = 50, offset: number = 0): Promise<PrestaShopOrder[]> {
    try {
      const url = `${this.baseUrl}/api/orders?output_format=JSON&display=full&limit=${offset},${limit}`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.orders && Array.isArray(data.orders)) {
        return data.orders.map((o: any) => o.order || o)
      }

      return []
    } catch (error) {
      console.error('Erro ao buscar pedidos PrestaShop:', error)
      return []
    }
  }

  /**
   * Buscar estoque de um produto
   */
  async fetchInventory(productId: number): Promise<number> {
    try {
      const url = `${this.baseUrl}/api/stock_availables?output_format=JSON&filter[id_product]=[${productId}]&display=full`

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return 0
      }

      const data = await response.json()
      
      if (data.stock_availables && Array.isArray(data.stock_availables)) {
        const stockItems = data.stock_availables.map((s: any) => s.stock_available || s)
        
        // Somar quantidade de todas as variantes
        const totalQuantity = stockItems.reduce(
          (sum: number, item: PrestaShopStockAvailable) => sum + (item.quantity || 0),
          0
        )
        
        return totalQuantity
      }

      return 0
    } catch (error) {
      console.error('Erro ao buscar inventário PrestaShop:', error)
      return 0
    }
  }

  /**
   * Verificar se a loja está online
   */
  async checkStatus(): Promise<boolean> {
    try {
      // Tenta acessar a API
      const response = await fetch(`${this.baseUrl}/api`, {
        method: 'HEAD',
        headers: this.getHeaders(),
      })

      // Se API não responder, tenta a home
      if (!response.ok) {
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

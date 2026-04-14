export interface VtexConfig {
  accountName: string
  appKey: string
  appToken: string
  environment?: string
}

export interface VtexSellerOffer {
  commertialOffer?: {
    AvailableQuantity?: number
    Price?: number
  }
}

export interface VtexItem {
  itemId: string
  name: string
  sellers?: VtexSellerOffer[]
}

export interface VtexSearchProduct {
  productId: string | number
  productName: string
  brand?: string
  categories?: string[]
  link?: string
  linkText?: string
  items?: VtexItem[]
}

export interface VtexOrder {
  orderId: string
  status: string
  value: number
  creationDate: string
  clientName?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
}

export class VtexClient {
  private accountName: string
  private appKey: string
  private appToken: string
  private environment: string

  constructor(config: VtexConfig) {
    this.accountName = config.accountName
    this.appKey = config.appKey
    this.appToken = config.appToken
    this.environment = config.environment || 'vtexcommercestable'
  }

  private get baseUrl() {
    return `https://${this.accountName}.${this.environment}.com.br`
  }

  private getHeaders(): HeadersInit {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'PulseWatch/1.0',
      'X-VTEX-API-AppKey': this.appKey,
      'X-VTEX-API-AppToken': this.appToken,
    }
  }

  /**
   * Buscar produtos via API de busca de catálogo
   */
  async fetchProducts(from: number = 0, to: number = 49): Promise<VtexSearchProduct[]> {
    const url = `${this.baseUrl}/api/catalog_system/pub/products/search?_from=${from}&_to=${to}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`VTEX API error: ${response.status}`)
    }

    const data = (await response.json()) as VtexSearchProduct[]
    return Array.isArray(data) ? data : []
  }

  /**
   * Buscar pedidos recentes via OMS API
   */
  async fetchOrders(perPage: number = 50, page: number = 1): Promise<VtexOrder[]> {
    const url = `${this.baseUrl}/api/oms/pvt/orders?per_page=${perPage}&page=${page}&f_status=invoiced,handling,ready-for-handling,waiting-ffmt-authorization,approved`

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return []

      const data = await response.json()
      const list = data.list || []

      return list.map((o: any) => ({
        orderId: o.orderId,
        status: o.status,
        value: o.value / 100, // VTEX armazena em centavos
        creationDate: o.creationDate,
        clientName: o.clientName,
        items: (o.items || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price / 100,
        })),
      }))
    } catch (error) {
      console.error('Erro ao buscar pedidos VTEX:', error)
      return []
    }
  }

  /**
   * Obter estoque disponível de um SKU via Logistics API
   */
  async fetchInventory(skuId: string): Promise<number> {
    const url = `${this.baseUrl}/api/logistics/pvt/inventory/skus/${skuId}`

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return 0

      const data = await response.json()
      const warehouses: any[] = data.balance || []
      return warehouses.reduce((sum: number, w: any) => sum + (w.totalQuantity ?? 0), 0)
    } catch (error) {
      console.error('Erro ao buscar estoque VTEX:', error)
      return 0
    }
  }

  /**
   * Verificar se a conta VTEX está acessível
   */
  async checkStatus(): Promise<boolean> {
    const url = `${this.baseUrl}/api/catalog_system/pub/products/search?_from=0&_to=0`

    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

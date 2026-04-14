import crypto from 'crypto'

export interface ShopeeConfig {
  shopId: string
  accessToken: string
  partnerId: string
  partnerKey: string
}

export interface ShopeeProduct {
  item_id: number
  item_name: string
  item_sku: string
  item_status: string // NORMAL, DELETED, BANNED, UNLIST
  price_info: Array<{
    current_price: number
    original_price: number
    currency: string
  }>
  stock_info_v2: {
    summary_info: {
      total_available_stock: number
    }
  }
  category_id: number
  create_time: number
  update_time: number
  image: {
    image_url_list: string[]
  }
}

export interface ShopeeOrder {
  order_sn: string
  order_status: string
  total_amount: number
  currency: string
  create_time: number
  update_time: number
  buyer_username: string
  item_list: Array<{
    item_id: number
    item_name: string
    model_quantity_purchased: number
    model_discounted_price: number
  }>
}

export interface ShopeeShopInfo {
  shop_name: string
  rating_star: number
  rating_bad: number
  rating_good: number
  rating_normal: number
  item_count: number
  response_rate: number
  response_time: number
  preparation_time: number
}

export class ShopeeClient {
  private shopId: string
  private accessToken: string
  private partnerId: string
  private partnerKey: string
  private apiBase: string

  constructor(config: ShopeeConfig) {
    this.shopId = config.shopId
    this.accessToken = config.accessToken
    this.partnerId = config.partnerId
    this.partnerKey = config.partnerKey
    this.apiBase = 'https://partner.shopeemobile.com'
  }

  /**
   * Gerar assinatura para requests da API Shopee
   */
  private generateSign(path: string, timestamp: number): string {
    const baseString = `${this.partnerId}${path}${timestamp}${this.accessToken}${this.shopId}`
    return crypto.createHmac('sha256', this.partnerKey).update(baseString).digest('hex')
  }

  /**
   * Construir URL com autenticacao
   */
  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const sign = this.generateSign(path, timestamp)

    const searchParams = new URLSearchParams({
      partner_id: this.partnerId,
      timestamp: String(timestamp),
      access_token: this.accessToken,
      shop_id: this.shopId,
      sign,
      ...params,
    })

    return `${this.apiBase}${path}?${searchParams.toString()}`
  }

  /**
   * Buscar produtos da loja
   */
  async fetchProducts(limit = 50): Promise<ShopeeProduct[]> {
    try {
      const listUrl = this.buildUrl('/api/v2/product/get_item_list', {
        offset: '0',
        page_size: String(Math.min(limit, 100)),
        item_status: 'NORMAL',
      })

      const listResponse = await fetch(listUrl, {
        signal: AbortSignal.timeout(10000),
      })

      if (!listResponse.ok) return []

      const listData = await listResponse.json()
      if (listData.error) {
        console.error('Shopee list error:', listData.error, listData.message)
        return []
      }

      const itemIds: number[] = (listData.response?.item || []).map((i: any) => i.item_id)
      if (itemIds.length === 0) return []

      // Buscar detalhes dos items
      const detailUrl = this.buildUrl('/api/v2/product/get_item_base_info', {
        item_id_list: itemIds.join(','),
      })

      const detailResponse = await fetch(detailUrl, {
        signal: AbortSignal.timeout(10000),
      })

      if (!detailResponse.ok) return []

      const detailData = await detailResponse.json()
      return detailData.response?.item_list || []
    } catch (error) {
      console.error('Erro ao buscar produtos Shopee:', error)
      return []
    }
  }

  /**
   * Buscar pedidos recentes
   */
  async fetchOrders(daysBack = 7): Promise<ShopeeOrder[]> {
    try {
      const timeFrom = Math.floor(Date.now() / 1000) - daysBack * 24 * 60 * 60
      const timeTo = Math.floor(Date.now() / 1000)

      const url = this.buildUrl('/api/v2/order/get_order_list', {
        time_range_field: 'create_time',
        time_from: String(timeFrom),
        time_to: String(timeTo),
        page_size: '50',
        order_status: 'ALL',
      })

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.response?.order_list || []
    } catch (error) {
      console.error('Erro ao buscar pedidos Shopee:', error)
      return []
    }
  }

  /**
   * Obter score/info da loja
   */
  async getShopScore(): Promise<ShopeeShopInfo | null> {
    try {
      const url = this.buildUrl('/api/v2/shop/get_shop_info')

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.response || null
    } catch (error) {
      console.error('Erro ao buscar score Shopee:', error)
      return null
    }
  }

  /**
   * Obter estoque disponível de um item
   */
  async fetchInventory(itemId: number): Promise<number> {
    try {
      const url = this.buildUrl('/api/v2/product/get_item_base_info', {
        item_id_list: String(itemId),
      })

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) return 0

      const data = await response.json()
      const item: ShopeeProduct | undefined = data.response?.item_list?.[0]
      return item?.stock_info_v2?.summary_info?.total_available_stock ?? 0
    } catch (error) {
      console.error('Erro ao buscar estoque Shopee:', error)
      return 0
    }
  }

  /**
   * Verificar status da API
   */
  async checkStatus(): Promise<boolean> {
    try {
      const url = this.buildUrl('/api/v2/shop/get_shop_info')
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

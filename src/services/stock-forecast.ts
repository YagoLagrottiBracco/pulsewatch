/**
 * Serviço de previsão de estoque.
 *
 * Calcula em quantos dias um produto fica sem estoque
 * baseado no histórico de vendas recentes.
 * Gate: business+ apenas.
 */

import { createClient } from '@supabase/supabase-js'

export interface StockForecastItem {
  productId: string
  productName: string
  sku: string | null
  storeName: string
  storeId: string
  currentStock: number
  avgDailySales: number
  daysUntilZero: number | null // null = sem vendas suficientes para prever
  urgency: 'critical' | 'warning' | 'ok'
}

export interface StockForecastResult {
  forecasts: StockForecastItem[]
  generatedAt: string
}

/**
 * Gera previsão de estoque para todas as lojas do usuário.
 */
export async function generateStockForecast(userId: string): Promise<StockForecastResult> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar lojas do usuário
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!stores || stores.length === 0) {
    return { forecasts: [], generatedAt: new Date().toISOString() }
  }

  const storeIds = stores.map(s => s.id)
  const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))

  // Buscar produtos com estoque > 0
  const { data: products } = await supabase
    .from('products')
    .select('id, store_id, name, sku, stock_quantity')
    .in('store_id', storeIds)
    .gt('stock_quantity', 0)

  if (!products || products.length === 0) {
    return { forecasts: [], generatedAt: new Date().toISOString() }
  }

  // Buscar pedidos dos últimos 30 dias para calcular média de vendas
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: orders } = await supabase
    .from('orders')
    .select('id, store_id, order_date, total')
    .in('store_id', storeIds)
    .gte('order_date', thirtyDaysAgo.toISOString())
    .eq('status', 'completed')

  // Calcular pedidos por dia por loja
  const ordersByStore: Record<string, number> = {}
  for (const order of orders || []) {
    ordersByStore[order.store_id] = (ordersByStore[order.store_id] || 0) + 1
  }

  const forecasts: StockForecastItem[] = []

  for (const product of products) {
    const totalOrders = ordersByStore[product.store_id] || 0
    // Estimativa: média diária de vendas = pedidos / 30 dias
    // Simplificação: cada pedido consome ~1 unidade de cada produto
    const avgDailySales = totalOrders / 30

    let daysUntilZero: number | null = null
    let urgency: StockForecastItem['urgency'] = 'ok'

    if (avgDailySales > 0) {
      daysUntilZero = Math.round(product.stock_quantity / avgDailySales)

      if (daysUntilZero <= 3) {
        urgency = 'critical'
      } else if (daysUntilZero <= 7) {
        urgency = 'warning'
      }
    }

    // Só incluir produtos com previsão relevante (< 30 dias ou estoque baixo)
    if (daysUntilZero !== null && daysUntilZero <= 30) {
      forecasts.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        storeName: storeMap[product.store_id] || 'Unknown',
        storeId: product.store_id,
        currentStock: product.stock_quantity,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        daysUntilZero,
        urgency,
      })
    }
  }

  // Ordenar por urgência (critical > warning > ok) e depois por dias restantes
  const urgencyOrder = { critical: 0, warning: 1, ok: 2 }
  forecasts.sort((a, b) => {
    const urgDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
    if (urgDiff !== 0) return urgDiff
    return (a.daysUntilZero ?? 999) - (b.daysUntilZero ?? 999)
  })

  return {
    forecasts,
    generatedAt: new Date().toISOString(),
  }
}

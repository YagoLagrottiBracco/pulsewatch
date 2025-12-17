'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package, Search, ExternalLink, Download } from 'lucide-react'
import { exportToCSV, formatProductForExport } from '@/lib/export-utils'

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStore, setSelectedStore] = useState<string>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Buscar lojas
    const { data: storesData } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)

    setStores(storesData || [])

    // Buscar produtos
    const { data: productsData } = await supabase
      .from('products')
      .select('*, stores(name, domain)')
      .order('created_at', { ascending: false })

    setProducts(productsData || [])
    setLoading(false)
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku?.toLowerCase().includes(search.toLowerCase())
    
    const matchesStore = 
      selectedStore === 'all' || product.store_id === selectedStore

    return matchesSearch && matchesStore
  })

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
      case 'instock':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Em Estoque</Badge>
      case 'out_of_stock':
      case 'outofstock':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Esgotado</Badge>
      case 'low_stock':
      case 'lowstock':
        return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Estoque Baixo</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            Produtos sincronizados das suas lojas
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {filteredProducts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const exportData = filteredProducts.map(formatProductForExport)
                    exportToCSV(exportData, 'produtos-pulsewatch')
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
              <select
                className="px-3 py-2 border rounded-md bg-background"
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
              >
                <option value="all">Todas as lojas</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                {products.length === 0
                  ? 'Nenhum produto sincronizado'
                  : 'Nenhum produto encontrado'}
              </p>
              <p className="text-muted-foreground">
                {products.length === 0
                  ? 'Adicione lojas e aguarde a primeira sincronização'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle 
                        className="text-lg truncate" 
                        title={product.name}
                      >
                        {product.name}
                      </CardTitle>
                      <CardDescription className="truncate">
                        {product.category && (
                          <span className="text-primary font-medium">{product.category} • </span>
                        )}
                        {product.stores?.name} • SKU: {product.sku || 'N/A'}
                      </CardDescription>
                    </div>
                    <div className="flex-shrink-0">
                      {getStockBadge(product.stock_status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Preço</p>
                      <p className="text-lg font-semibold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(product.price || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Estoque</p>
                      <p className="text-lg font-semibold">
                        {product.stock_quantity || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ID Externo</p>
                      <p className="text-sm font-mono">{product.external_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última Sync</p>
                      <p className="text-sm">
                        {product.last_synced
                          ? new Date(product.last_synced).toLocaleDateString('pt-BR')
                          : 'Nunca'}
                      </p>
                    </div>
                  </div>
                  
                  {product.product_url && (
                    <div className="mt-4 pt-4 border-t">
                      <a
                        href={product.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ver na Loja
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        {products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{products.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Produtos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter((p) => p.stock_status === 'in_stock').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Estoque</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Estoque Baixo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter((p) => p.stock_status === 'out_of_stock').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Esgotados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

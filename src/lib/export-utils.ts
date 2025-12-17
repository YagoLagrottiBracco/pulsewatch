export async function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert('Nenhum dado para exportar')
    return
  }

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Log audit
  const { logAudit, AuditActions, EntityTypes } = await import('./audit-logger')
  await logAudit({
    action: AuditActions.EXPORT_GENERATED,
    entity_type: EntityTypes.EXPORT,
    metadata: { filename, count: data.length }
  })
}

export function formatAlertForExport(alert: any) {
  return {
    'Data': new Date(alert.created_at).toLocaleString('pt-BR'),
    'Loja': alert.stores?.name || 'N/A',
    'Tipo': alert.type,
    'Severidade': alert.severity,
    'Título': alert.title,
    'Mensagem': alert.message,
    'Lido': alert.is_read ? 'Sim' : 'Não',
    'Email Enviado': alert.email_sent ? 'Sim' : 'Não',
    'Telegram Enviado': alert.telegram_sent ? 'Sim' : 'Não',
  }
}

export function formatProductForExport(product: any) {
  return {
    'Nome': product.name,
    'SKU': product.sku || 'N/A',
    'Preço': `R$ ${Number(product.price).toFixed(2)}`,
    'Estoque': product.stock_quantity,
    'Status': product.stock_status,
    'Última Sincronização': new Date(product.last_synced).toLocaleString('pt-BR'),
  }
}

export function formatStoreForExport(store: any) {
  return {
    'Nome': store.name,
    'Domínio': store.domain,
    'Plataforma': store.platform,
    'Status': store.status,
    'Ativo': store.is_active ? 'Sim' : 'Não',
    'Última Verificação': store.last_check ? new Date(store.last_check).toLocaleString('pt-BR') : 'N/A',
    'Criado em': new Date(store.created_at).toLocaleString('pt-BR'),
  }
}

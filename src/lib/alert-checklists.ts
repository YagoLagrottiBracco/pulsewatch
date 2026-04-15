export const DIAGNOSIS_CHECKLISTS: Record<string, { title: string; items: string[] }> = {
  downtime: {
    title: 'O que fazer agora — Loja offline',
    items: [
      'Acesse a loja diretamente no navegador para confirmar a indisponibilidade.',
      'Verifique o status da plataforma (painel do provedor ou status page pública).',
      'Cheque o DNS do domínio em uma ferramenta como MXToolbox ou DNS Checker.',
      'Reinicie a integração ou sincronize manualmente se a plataforma estiver disponível.',
      'Contate o suporte da plataforma se o problema persistir por mais de 30 minutos.',
      'Comunique sua equipe e clientes se a indisponibilidade ultrapassar 1 hora.',
    ],
  },
  stock_low: {
    title: 'O que fazer agora — Estoque baixo / zerado',
    items: [
      'Identifique os SKUs afetados no painel da plataforma.',
      'Verifique o prazo de reposição com seu fornecedor.',
      'Considere pausar campanhas de tráfego pago para o produto afetado.',
      'Ative a opção "fora de estoque" para evitar vendas de produtos indisponíveis.',
      'Atualize a descrição ou aviso na página do produto se a reposição demorar.',
      'Registre a ocorrência para analisar padrões de ruptura recorrente.',
    ],
  },
  sales_drop: {
    title: 'O que fazer agora — Queda nas vendas',
    items: [
      'Verifique se a loja está online e o checkout está funcionando corretamente.',
      'Confirme se campanhas de marketing estão ativas e com orçamento disponível.',
      'Compare o período com a semana anterior para identificar sazonalidade.',
      'Analise se houve mudança de preço recente nos produtos principais.',
      'Revise avaliações e comentários recentes que possam indicar problema de confiança.',
      'Cheque concorrentes diretos por promoções que possam estar desviando tráfego.',
      'Ative um cupom ou promoção temporária para estimular conversões.',
    ],
  },
}

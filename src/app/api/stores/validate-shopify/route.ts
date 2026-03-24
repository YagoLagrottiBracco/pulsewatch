import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { domain, accessToken } = await request.json()

    if (!domain || !accessToken) {
      return NextResponse.json(
        { valid: false, error: 'Domínio e Access Token são obrigatórios' },
        { status: 400 }
      )
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

    const response = await fetch(
      `https://${cleanDomain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    )

    if (response.status === 401) {
      return NextResponse.json({
        valid: false,
        error: 'Admin API Access Token inválido. Verifique o token gerado no Shopify Admin.',
      })
    }

    if (response.status === 403) {
      return NextResponse.json({
        valid: false,
        error: 'Token sem permissão para acessar a loja. Verifique os escopos do app.',
      })
    }

    if (response.status === 404) {
      return NextResponse.json({
        valid: false,
        error: 'Loja não encontrada. Verifique se o domínio está correto (ex: minhaloja.myshopify.com).',
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        valid: false,
        error: `Erro ao conectar com a loja (HTTP ${response.status}). Verifique o domínio e tente novamente.`,
      })
    }

    const data = await response.json()
    const shopName = data?.shop?.name ?? cleanDomain

    return NextResponse.json({ valid: true, shopName })
  } catch (error: any) {
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError'

    return NextResponse.json(
      {
        valid: false,
        error: isTimeout
          ? 'Tempo esgotado ao tentar conectar com a loja. Verifique se o domínio está correto.'
          : 'Não foi possível conectar com a loja. Verifique se o domínio está correto e acessível.',
      },
      { status: 500 }
    )
  }
}

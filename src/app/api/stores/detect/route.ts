import { NextRequest, NextResponse } from 'next/server'
import { detectPlatform } from '@/services/platform-detector'

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain é obrigatório' },
        { status: 400 }
      )
    }

    const result = await detectPlatform(domain)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Erro na detecção:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao detectar plataforma' },
      { status: 500 }
    )
  }
}

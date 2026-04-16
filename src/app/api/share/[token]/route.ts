import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { token } = params;

    // Buscar link pelo token
    const { data: link, error: linkError } = await supabase
      .from('shared_insights')
      .select('id, generation_id, expires_at, revoked_at')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Link não disponível', available: false },
        { status: 410 }
      );
    }

    // Verificar revogação
    if (link.revoked_at) {
      return NextResponse.json(
        { error: 'Link não disponível', available: false },
        { status: 410 }
      );
    }

    // Verificar expiração
    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Link não disponível', available: false },
        { status: 410 }
      );
    }

    // Buscar insights da geração — apenas campos públicos (sem PII)
    const { data: insights, error: insightsError } = await supabase
      .from('ai_insights')
      .select('id, insight_type, title, summary, detailed_analysis, recommendations, confidence_score, data_analyzed, created_at')
      .eq('generation_id', link.generation_id)
      .order('created_at', { ascending: true });

    if (insightsError) {
      console.error('Erro ao buscar insights:', insightsError);
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }

    return NextResponse.json({
      available: true,
      expiresAt: link.expires_at,
      insights: insights ?? [],
    });
  } catch (error: any) {
    captureError(error, { module: 'api/share/:token' })
    console.error('Share fetch error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

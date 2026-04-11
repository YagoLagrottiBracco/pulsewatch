import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Expiração padrão: 30 dias
const SHARE_EXPIRY_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Apenas agency pode compartilhar links públicos
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profile?.subscription_tier !== 'agency') {
      return NextResponse.json(
        { error: 'Links compartilháveis são exclusivos do plano Agency' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { generationId } = body;

    if (!generationId) {
      return NextResponse.json({ error: 'generationId é obrigatório' }, { status: 400 });
    }

    // Verificar que a geração pertence ao usuário
    const { data: gen, error: genError } = await supabase
      .from('insight_generation_log')
      .select('id')
      .eq('id', generationId)
      .eq('user_id', user.id)
      .eq('success', true)
      .single();

    if (genError || !gen) {
      return NextResponse.json({ error: 'Geração não encontrada' }, { status: 404 });
    }

    // Gerar token único
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SHARE_EXPIRY_DAYS);

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: link, error: insertError } = await serviceClient
      .from('shared_insights')
      .insert({
        token,
        user_id: user.id,
        generation_id: generationId,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, token, expires_at')
      .single();

    if (insertError || !link) {
      console.error('Erro ao criar link:', insertError);
      return NextResponse.json({ error: 'Erro ao criar link' }, { status: 500 });
    }

    return NextResponse.json({
      shareId: link.id,
      token: link.token,
      expiresAt: link.expires_at,
      shareUrl: `/share/${link.token}`,
    });
  } catch (error: any) {
    console.error('Share create error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

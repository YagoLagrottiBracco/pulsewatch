import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateInsightsForUser } from '@/services/ai-insights';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Check rate limit (6 hours)
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc(
      'check_insight_rate_limit',
      { p_user_id: user.id }
    );

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      return NextResponse.json(
        { error: 'Erro ao verificar limite de geração' },
        { status: 500 }
      );
    }

    if (!rateLimitCheck) {
      // Get next available time
      const { data: nextAvailable } = await supabase.rpc(
        'get_next_insight_available_at',
        { p_user_id: user.id }
      );

      return NextResponse.json(
        {
          error: 'Limite de geração atingido',
          message: 'Você pode gerar insights novamente em 6 horas',
          nextAvailableAt: nextAvailable,
        },
        { status: 429 }
      );
    }

    // Get user profile to check subscription tier
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Erro ao verificar perfil do usuário' },
        { status: 500 }
      );
    }

    // Check if user has Business or Agency plan
    if (!['business', 'agency'].includes(userProfile?.subscription_tier || '')) {
      return NextResponse.json(
        {
          error: 'Acesso restrito',
          message: 'Insights com IA são exclusivos para assinantes dos planos Business e Agency',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const { insightCount, generationId } = await generateInsightsForUser(user.id, 'manual');

    return NextResponse.json({
      success: true,
      message: `${insightCount} insights gerados com sucesso!`,
      generationId,
    });
  } catch (error: any) {
    console.error('Generate insights error:', error);

    // Log failed generation
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.from('insight_generation_log').insert({
          user_id: user.id,
          success: false,
          error_message: error.message,
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: 'Erro ao gerar insights', message: error.message },
      { status: 500 }
    );
  }
}

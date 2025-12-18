import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { aiInsightsService } from '@/services/ai-insights';

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
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Erro ao verificar perfil do usuário' },
        { status: 500 }
      );
    }

    // Check if user has Ultimate plan
    if (userProfile?.subscription_tier !== 'ultimate') {
      return NextResponse.json(
        {
          error: 'Acesso restrito',
          message: 'Insights com IA são exclusivos para assinantes do plano Ultimate',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Fetch user's data for analysis
    const [ordersResult, productsResult, alertsResult, storesResult] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
      
      supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .limit(100),
      
      supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id),
    ]);

    const orders = ordersResult.data || [];
    const products = productsResult.data || [];
    const alerts = alertsResult.data || [];
    const stores = storesResult.data || [];

    // Check if user has enough data
    if (orders.length === 0 && products.length === 0) {
      return NextResponse.json(
        {
          error: 'Dados insuficientes',
          message: 'Você precisa ter pelo menos alguns pedidos ou produtos cadastrados para gerar insights.',
        },
        { status: 400 }
      );
    }

    // Generate insights using AI
    const insights = await aiInsightsService.generateInsights({
      orders,
      products,
      alerts,
      stores,
      userProfile,
    });

    if (!insights || insights.length === 0) {
      throw new Error('Falha ao gerar insights');
    }

    // Save insights to database
    const insightsToInsert = insights.map((insight) => ({
      user_id: user.id,
      store_id: stores[0]?.id || null,
      insight_type: insight.type,
      title: insight.title,
      summary: insight.summary,
      detailed_analysis: insight.detailedAnalysis,
      recommendations: insight.recommendations,
      confidence_score: insight.confidenceScore,
      data_analyzed: insight.dataAnalyzed,
    }));

    const { data: savedInsights, error: insertError } = await supabase
      .from('ai_insights')
      .insert(insightsToInsert)
      .select();

    if (insertError) {
      console.error('Insert insights error:', insertError);
      throw new Error('Falha ao salvar insights');
    }

    // Log successful generation
    await supabase.from('insight_generation_log').insert({
      user_id: user.id,
      success: true,
    });

    return NextResponse.json({
      success: true,
      insights: savedInsights,
      message: `${insights.length} insights gerados com sucesso!`,
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

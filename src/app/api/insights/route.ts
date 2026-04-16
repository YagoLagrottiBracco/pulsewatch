import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Check if user has Ultimate plan
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!['business', 'agency'].includes(userProfile?.subscription_tier || '')) {
      return NextResponse.json(
        {
          error: 'Acesso restrito',
          message: 'Insights com IA são exclusivos para assinantes dos planos Business e Agency',
          upgradeRequired: true,
          insights: [],
          canGenerate: false,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const generationId = searchParams.get('generation_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type) {
      query = query.eq('insight_type', type);
    }

    if (generationId) {
      query = query.eq('generation_id', generationId);
    }

    const { data: insights, error } = await query;

    if (error) {
      console.error('Fetch insights error:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar insights' },
        { status: 500 }
      );
    }

    // Get next available generation time
    const { data: nextAvailable } = await supabase.rpc(
      'get_next_insight_available_at',
      { p_user_id: user.id }
    );

    const { data: canGenerate } = await supabase.rpc(
      'check_insight_rate_limit',
      { p_user_id: user.id }
    );

    // Fetch existing action statuses for all loaded insights (single extra round-trip)
    const insightIds = (insights ?? []).map((i: { id: string }) => i.id);
    let actions: Array<{ insight_id: string; rec_index: number; status: string }> = [];
    if (insightIds.length > 0) {
      const { data: actionsData } = await supabase
        .from('recommendation_actions')
        .select('insight_id, rec_index, status')
        .in('insight_id', insightIds);
      actions = actionsData ?? [];
    }

    return NextResponse.json({
      insights,
      actions,
      nextAvailableAt: nextAvailable,
      canGenerate: canGenerate || false,
    });
  } catch (error: any) {
    console.error('Get insights error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar insights', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Check if user has Business or Agency plan
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do insight é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('ai_insights')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete insight error:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar insight' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete insight error:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar insight', message: error.message },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Tier gate — mirrors /api/insights GET
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    if (!['business', 'agency'].includes(userProfile?.subscription_tier || '')) {
      return NextResponse.json(
        {
          error: 'Acesso restrito',
          message: 'Insights com IA são exclusivos para assinantes dos planos Business e Agency',
          upgradeRequired: true,
          generations: [],
        },
        { status: 403 }
      );
    }

    // Fetch successful generations for this user (D-12, Open Question 2 — filter success=true)
    const { data: logs, error: logsError } = await supabase
      .from('insight_generation_log')
      .select('id, generated_at, source')
      .eq('user_id', user.id)
      .eq('success', true)
      .order('generated_at', { ascending: false });

    if (logsError) {
      console.error('Fetch generations error:', logsError);
      return NextResponse.json(
        { error: 'Erro ao buscar gerações' },
        { status: 500 }
      );
    }

    const generationIds = (logs ?? []).map((l) => l.id);

    // Two-query approach (Pitfall 6): fetch counts separately for reliability
    const counts: Record<string, number> = {};
    if (generationIds.length > 0) {
      const { data: insightRows } = await supabase
        .from('ai_insights')
        .select('generation_id')
        .eq('user_id', user.id)
        .in('generation_id', generationIds);

      for (const row of insightRows ?? []) {
        const gid = (row as { generation_id: string | null }).generation_id;
        if (gid) counts[gid] = (counts[gid] ?? 0) + 1;
      }
    }

    const generations = (logs ?? []).map((l) => ({
      id: l.id,
      generated_at: l.generated_at,
      source: (l as any).source ?? 'manual',
      insight_count: counts[l.id] ?? 0,
    }));

    return NextResponse.json({ generations });
  } catch (error: any) {
    console.error('Get generations error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar gerações', message: error.message },
      { status: 500 }
    );
  }
}

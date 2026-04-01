import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UpsertActionBody, ActionStatus } from '@/types/recommendation-actions';

const VALID_STATUSES: ActionStatus[] = ['pending', 'in_progress', 'done', 'ignored'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: UpsertActionBody = await request.json();
    const { insight_id, rec_index, status } = body;

    // Validate input
    if (!insight_id || rec_index === undefined || rec_index === null || !status) {
      return NextResponse.json({ error: 'Campos obrigatórios: insight_id, rec_index, status' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }
    if (typeof rec_index !== 'number' || rec_index < 0) {
      return NextResponse.json({ error: 'rec_index deve ser um número inteiro não-negativo' }, { status: 400 });
    }

    // Security: verify insight belongs to this user (defense in depth beyond RLS)
    const { data: insight } = await supabase
      .from('ai_insights')
      .select('id')
      .eq('id', insight_id)
      .eq('user_id', user.id)
      .single();

    if (!insight) {
      return NextResponse.json({ error: 'Insight não encontrado' }, { status: 404 });
    }

    // UPSERT: insert on first status change, update on subsequent changes.
    // UNIQUE(insight_id, rec_index) constraint in migration enables onConflict.
    const { error: upsertError } = await supabase
      .from('recommendation_actions')
      .upsert(
        {
          insight_id,
          rec_index,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'insight_id,rec_index' }
      );

    if (upsertError) {
      console.error('Upsert recommendation action error:', upsertError);
      return NextResponse.json({ error: 'Erro ao salvar status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/insights/actions error:', error);
    return NextResponse.json({ error: 'Erro interno', message: error.message }, { status: 500 });
  }
}

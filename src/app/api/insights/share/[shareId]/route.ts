import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { shareId } = params;

    // RLS garante que só o dono pode atualizar — verificamos explicitamente também
    const { data: updated, error } = await supabase
      .from('shared_insights')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', shareId)
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .select('id')
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: 'Link não encontrado ou já revogado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, revokedId: shareId });
  } catch (error: any) {
    captureError(error, { module: 'src\app\api\insights\share\:shareId\route.ts' })
    console.error('Share revoke error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

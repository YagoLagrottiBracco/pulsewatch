import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateInsightsForUser } from '@/services/ai-insights';

// Vercel Cron: toda segunda-feira às 9h (horário de Brasília = 12h UTC)
export async function GET(request: NextRequest) {
  try {
    // Auth check — same pattern as weekly-report
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await generateWeeklyInsights();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no cron de insights semanais:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateWeeklyInsights(): Promise<{
  processed: number;
  generated: number;
  skipped: number;
  errors: number;
  details: Array<{ user_id: string; skipped: boolean; reason?: string; insights_generated?: number }>;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // D-07: Only business+ users
  const { data: users, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, subscription_tier')
    .in('subscription_tier', ['business', 'agency']);

  if (usersError || !users || users.length === 0) {
    return { processed: 0, generated: 0, skipped: 0, errors: 0, details: [] };
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;
  const details: Array<{ user_id: string; skipped: boolean; reason?: string; insights_generated?: number }> = [];

  for (const user of users) {
    try {
      // D-04: Deduplication — check if user generated in last 6 days
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const { data: recentGen } = await supabase
        .from('insight_generation_log')
        .select('id')
        .eq('user_id', user.id)
        .gte('generated_at', sixDaysAgo.toISOString())
        .eq('success', true)
        .limit(1);

      if (recentGen && recentGen.length > 0) {
        // D-05: Log skip
        skipped++;
        details.push({ user_id: user.id, skipped: true, reason: 'generated_within_6_days' });
        continue;
      }

      // Generate insights using shared service with source='automatic'
      const { insightCount } = await generateInsightsForUser(user.id, 'automatic');

      generated++;
      details.push({ user_id: user.id, skipped: false, insights_generated: insightCount });
    } catch (error) {
      console.error(`Erro ao gerar insights para usuario ${user.id}:`, error);
      errors++;
      details.push({ user_id: user.id, skipped: false, reason: `error: ${(error as Error).message}` });
    }
  }

  return { processed: users.length, generated, skipped, errors, details };
}

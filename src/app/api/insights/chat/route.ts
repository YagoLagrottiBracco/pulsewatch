import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const DAILY_LIMITS: Record<string, number> = { business: 10, agency: 30 };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 });
  }

  // Tier gate — business+
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('user_id', user.id)
    .single();

  const tier = profile?.subscription_tier || '';
  if (!['business', 'agency'].includes(tier)) {
    return new Response(
      JSON.stringify({ error: 'Chat disponível apenas para planos Business e Agency' }),
      { status: 403 }
    );
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Rate limit: count today's messages
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await serviceClient
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString());

  const used = count ?? 0;
  const limit = DAILY_LIMITS[tier] ?? 10;
  const remaining = Math.max(0, limit - used);

  if (remaining === 0) {
    return new Response(
      JSON.stringify({
        error: 'Limite diário atingido',
        message: `Você atingiu o limite de ${limit} mensagens por dia. Tente novamente amanhã.`,
        remaining: 0,
        limit,
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'X-Chat-Remaining': '0' },
      }
    );
  }

  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'message é obrigatório' }), { status: 400 });
  }

  // Fetch store context for AI prompt
  const [alertsResult, insightsResult, storesResult] = await Promise.all([
    serviceClient
      .from('alerts')
      .select('type, severity, title, message, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    serviceClient
      .from('ai_insights')
      .select('title, summary, insight_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    serviceClient
      .from('stores')
      .select('name, platform, url, id')
      .eq('user_id', user.id),
  ]);

  const storeIds = (storesResult.data ?? []).map((s: { id: string }) => s.id);
  const [ordersResult, productsResult] = storeIds.length > 0
    ? await Promise.all([
        serviceClient
          .from('orders')
          .select('total, status, created_at')
          .in('store_id', storeIds)
          .order('created_at', { ascending: false })
          .limit(50),
        serviceClient
          .from('products')
          .select('name, stock_quantity, price')
          .in('store_id', storeIds)
          .limit(30),
      ])
    : [{ data: [] }, { data: [] }];

  const contextSummary = buildContextSummary({
    alerts: alertsResult.data ?? [],
    orders: ordersResult.data ?? [],
    products: productsResult.data ?? [],
    insights: insightsResult.data ?? [],
    stores: storesResult.data ?? [],
  });

  const prompt = `Você é um assistente de análise de e-commerce. Responda em português brasileiro de forma direta e baseada nos dados reais abaixo.

=== DADOS DA LOJA ===
${contextSummary}

=== PERGUNTA DO USUÁRIO ===
${message.trim()}

Responda de forma objetiva, citando dados específicos quando relevante. Não invente dados que não estão acima.`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullAnswer = '';

      try {
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullAnswer += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err: any) {
        const detail = err?.message || String(err);
        console.error('Gemini stream error:', detail, err);
        const errorMsg = '\n\n[Erro ao gerar resposta]';
        controller.enqueue(encoder.encode(errorMsg));
        fullAnswer += errorMsg;
        serviceClient
          .from('insight_generation_log')
          .insert({ user_id: user.id, success: false, source: 'chat', error_message: detail })
          .then(null, (e: any) => console.error('Erro ao salvar log do chat:', e));
      } finally {
        controller.close();
        serviceClient
          .from('chat_messages')
          .insert({ user_id: user.id, question: message.trim(), answer: fullAnswer })
          .then(null, (err: any) => console.error('Erro ao salvar chat:', err));
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Chat-Remaining': String(remaining - 1),
      'X-Chat-Limit': String(limit),
    },
  });
}

function buildContextSummary(data: {
  alerts: any[];
  orders: any[];
  products: any[];
  insights: any[];
  stores: any[];
}): string {
  const lines: string[] = [];

  if (data.stores.length > 0) {
    lines.push(`Lojas: ${data.stores.map((s) => `${s.name} (${s.platform})`).join(', ')}`);
  }

  if (data.orders.length > 0) {
    const revenue = data.orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    lines.push(`Pedidos recentes: ${data.orders.length} pedidos, receita total R$${revenue.toFixed(2)}`);
  }

  if (data.products.length > 0) {
    const outOfStock = data.products.filter((p) => (p.stock_quantity ?? 0) === 0).length;
    const lowStock = data.products.filter(
      (p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) < 10
    ).length;
    lines.push(
      `Produtos: ${data.products.length} cadastrados, ${outOfStock} sem estoque, ${lowStock} com estoque baixo (<10)`
    );
  }

  if (data.alerts.length > 0) {
    const critical = data.alerts.filter((a) => a.severity === 'critical' || a.severity === 'high');
    lines.push(`Alertas recentes: ${data.alerts.length} total, ${critical.length} críticos/altos`);
    critical.slice(0, 5).forEach((a) => {
      lines.push(
        `  - [${a.severity}] ${a.title}: ${a.message} (${new Date(a.created_at).toLocaleDateString('pt-BR')})`
      );
    });
  }

  if (data.insights.length > 0) {
    lines.push(`Insights de IA recentes:`);
    data.insights.forEach((i) => {
      lines.push(`  - ${i.title}: ${i.summary?.slice(0, 120)}...`);
    });
  }

  return lines.join('\n') || 'Nenhum dado disponível ainda.';
}

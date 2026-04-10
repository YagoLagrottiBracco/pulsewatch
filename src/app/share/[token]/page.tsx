interface InsightPublic {
  id: string;
  insight_type: string;
  title: string;
  summary: string;
  detailed_analysis: any;
  recommendations: any[];
  confidence_score: number;
  data_analyzed: any;
  created_at: string;
}

async function getSharedInsights(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/share/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const data = await getSharedInsights(params.token);

  if (!data || !data.available) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link não disponível</h1>
          <p className="text-gray-500">
            Este link foi revogado, expirou ou não existe.
          </p>
        </div>
      </div>
    );
  }

  const insights: InsightPublic[] = data.insights;
  const expiresAt = new Date(data.expiresAt).toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Insights Compartilhados</h1>
          <p className="text-sm text-gray-400 mt-2">Válido até {expiresAt}</p>
        </div>

        {/* Insight Cards */}
        {insights.length === 0 ? (
          <p className="text-center text-gray-500">Nenhum insight encontrado nesta geração.</p>
        ) : (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">{insight.title}</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full ml-3 shrink-0">
                    {Math.round((insight.confidence_score ?? 0) * 100)}% confiança
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{insight.summary}</p>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Recomendações</h3>
                    <ul className="space-y-2">
                      {insight.recommendations.map((rec: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-blue-500 shrink-0">→</span>
                          <span>
                            {typeof rec === 'string' ? rec : rec.action || rec.title || JSON.stringify(rec)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer neutro — sem marca ou dados do dono */}
        <p className="text-center text-xs text-gray-300 mt-10">
          Gerado por PulseWatch · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

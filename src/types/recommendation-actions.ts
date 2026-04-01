// src/types/recommendation-actions.ts
// Phase 9: Rastreamento de Ações — shared type contracts

/** Os quatro estados possíveis de uma recomendação. Ausência de row = implicitamente 'pending'. */
export type ActionStatus = 'pending' | 'in_progress' | 'done' | 'ignored';

/** Shape de uma row retornada pelo GET /api/insights (join de recommendation_actions). */
export interface RecommendationAction {
  insight_id: string;
  rec_index: number;
  status: ActionStatus;
}

/**
 * Shape de um item exibido no card "O que fazer hoje".
 * Derivado do estado React (insights + actionsMap) via useMemo — sem chamada de API extra.
 */
export interface TodayAction {
  insightId: string;
  insightTitle: string;
  rec: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
  };
  recIndex: number;
}

/**
 * Shape completo da resposta do GET /api/insights após a extensão da Task 4.
 * O campo `actions` é um array apenas das rows que existem na tabela;
 * rows ausentes = status implicitamente 'pending'.
 */
export interface InsightsWithActionsResponse {
  insights: Array<{
    id: string;
    insight_type: string;
    title: string;
    summary: string;
    detailed_analysis: {
      mainFindings: string[];
      trends: string[];
      risks: string[];
      opportunities: string[];
    };
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      impact: string;
    }>;
    confidence_score: number;
    created_at: string;
    expires_at: string;
  }>;
  actions: RecommendationAction[];
  nextAvailableAt: string;
  canGenerate: boolean;
  upgradeRequired?: boolean;
  message?: string;
  error?: string;
}

/** Body enviado pelo cliente ao POST /api/insights/actions. */
export interface UpsertActionBody {
  insight_id: string;
  rec_index: number;
  status: ActionStatus;
}

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, TrendingUp, Package, AlertTriangle, DollarSign, BarChart3, ShoppingCart, Clock, Trash2, RefreshCw, Crown, Lock } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import type { ActionStatus, TodayAction, InsightsWithActionsResponse } from '@/types/recommendation-actions';

interface Insight {
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
}

interface Generation {
  id: string;
  generated_at: string;
  insight_count: number;
  source?: string;
}

const insightTypeConfig = {
  sales_patterns: {
    icon: TrendingUp,
    label: 'Padrões de Vendas',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  stock_forecast: {
    icon: Package,
    label: 'Previsão de Estoque',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  product_recommendations: {
    icon: ShoppingCart,
    label: 'Recomendações de Produtos',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  anomaly_detection: {
    icon: AlertTriangle,
    label: 'Detecção de Anomalias',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  pricing_suggestions: {
    icon: DollarSign,
    label: 'Sugestões de Precificação',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  performance_analysis: {
    icon: BarChart3,
    label: 'Análise de Performance',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  dropshipping_analysis: {
    icon: Sparkles,
    label: 'Análise Dropshipping',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [canGenerate, setCanGenerate] = useState(false);
  const [nextAvailable, setNextAvailable] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [actionsMap, setActionsMap] = useState<Record<string, ActionStatus>>({});
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [selectedGenerationId, setSelectedGenerationId] = useState<string | null>(null);
  const [generationsLoading, setGenerationsLoading] = useState(false);
  // Compare mode state (Plan 10-03)
  const [compareMode, setCompareMode] = useState(false);
  const [compareGenerationId, setCompareGenerationId] = useState<string | null>(null);
  const [compareInsights, setCompareInsights] = useState<Insight[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchGenerations();
    fetchInsights(null);
  }, []);

  const fetchGenerations = async () => {
    try {
      const response = await fetch('/api/insights/generations');
      if (!response.ok) return; // silent fail — selector simply won't show (Pitfall 3)
      const data = await response.json();
      setGenerations(data.generations ?? []);
    } catch (error) {
      console.error('Error fetching generations:', error);
    }
  };

  const fetchInsights = async (generationId: string | null = selectedGenerationId) => {
    try {
      setLoading(true);
      const url = generationId
        ? `/api/insights?generation_id=${encodeURIComponent(generationId)}`
        : '/api/insights';
      const response = await fetch(url);
      const data: InsightsWithActionsResponse = await response.json();

      if (response.ok) {
        setInsights(data.insights || []);
        setCanGenerate(data.canGenerate);
        setNextAvailable(data.nextAvailableAt);
        setUpgradeRequired(false);

        // Populate actionsMap from API (only rows that exist; absent = implicit 'pending')
        if (data.actions && data.actions.length > 0) {
          const map: Record<string, ActionStatus> = {};
          for (const action of data.actions) {
            map[`${action.insight_id}:${action.rec_index}`] = action.status as ActionStatus;
          }
          setActionsMap(map);
        }
      } else if (response.status === 403 && data.upgradeRequired) {
        setUpgradeRequired(true);
        setInsights([]);
        setCanGenerate(false);
      } else {
        throw new Error(data.message || 'Erro ao carregar insights');
      }
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      if (!upgradeRequired) {
        toast({
          title: 'Erro',
          description: error.message || 'Falha ao carregar insights',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCompareInsights = async (generationId: string | null) => {
    try {
      setCompareLoading(true);
      const url = generationId
        ? `/api/insights?generation_id=${encodeURIComponent(generationId)}`
        : '/api/insights';
      const response = await fetch(url);
      if (!response.ok) return;
      const data: InsightsWithActionsResponse = await response.json();
      setCompareInsights(data.insights ?? []);
      // Merge this column's actions into shared actionsMap (Pitfall 4: insight IDs are globally unique)
      if (data.actions && data.actions.length > 0) {
        setActionsMap((prev) => {
          const next = { ...prev };
          for (const action of data.actions) {
            next[`${action.insight_id}:${action.rec_index}`] = action.status as ActionStatus;
          }
          return next;
        });
      }
    } catch (error) {
      console.error('Error fetching compare insights:', error);
    } finally {
      setCompareLoading(false);
    }
  };

  const enterCompareMode = async () => {
    setCompareMode(true);
    await fetchCompareInsights(null); // default right column = latest
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setCompareGenerationId(null);
    setCompareInsights([]);
  };

  const handleCompareGenerationChange = async (value: string) => {
    const newId = value === 'latest' ? null : value;
    setCompareGenerationId(newId);
    await fetchCompareInsights(newId);
  };

  /** Retorna o status de uma recomendação, com fallback para 'pending' se não existe row. */
  const getStatus = (insightId: string, recIndex: number): ActionStatus =>
    actionsMap[`${insightId}:${recIndex}`] ?? 'pending';

  /** Conta apenas recomendações com status 'done' (D-07: ignoradas não entram na contagem). */
  const getDoneCount = (insightId: string, totalRecs: number): number => {
    let count = 0;
    for (let i = 0; i < totalRecs; i++) {
      if (getStatus(insightId, i) === 'done') count++;
    }
    return count;
  };

  /**
   * Atualiza o status de uma recomendação com optimistic update + per-key debounce 300ms (D-08).
   * UI atualiza imediatamente; API é chamada após 300ms de inatividade na mesma chave.
   * Em caso de falha da API, reverte o estado e exibe toast de erro.
   */
  const updateStatus = (insightId: string, recIndex: number, newStatus: ActionStatus) => {
    const key = `${insightId}:${recIndex}`;
    const previousStatus = actionsMap[key] ?? 'pending';

    // Optimistic update: fires immediately for instant UI feedback
    setActionsMap(prev => ({ ...prev, [key]: newStatus }));

    // Per-key debounce: cancels previous timeout for this key only (Pitfall 2)
    if (debounceRefs.current[key]) clearTimeout(debounceRefs.current[key]);
    debounceRefs.current[key] = setTimeout(async () => {
      try {
        const response = await fetch('/api/insights/actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ insight_id: insightId, rec_index: recIndex, status: newStatus }),
        });
        if (!response.ok) throw new Error('Update failed');
      } catch {
        // Rollback to previous status on failure
        setActionsMap(prev => ({ ...prev, [key]: previousStatus }));
        toast({
          title: 'Erro ao salvar',
          description: 'Não foi possível salvar o status da recomendação',
          variant: 'destructive',
        });
      }
    }, 300);
  };

  /**
   * Top 3 recomendações pendentes ou em progresso, ordenadas por prioridade (D-03, D-04, D-05).
   * Cross-store: itera todos os insights do usuário independente da store.
   * Derivado do estado React — atualiza automaticamente sem refetch (D-09).
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayActions = useMemo((): TodayAction[] => {
    const pending: TodayAction[] = [];
    for (const insight of insights) {
      for (let i = 0; i < (insight.recommendations?.length ?? 0); i++) {
        const rec = insight.recommendations[i];
        const status = getStatus(insight.id, i);
        if (status === 'pending' || status === 'in_progress') {
          pending.push({
            insightId: insight.id,
            insightTitle: insight.title,
            rec,
            recIndex: i,
          });
        }
      }
    }
    // Sort: high → medium → low (D-05: alta prioridade primeiro)
    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    pending.sort((a, b) => (priorityOrder[a.rec.priority] ?? 2) - (priorityOrder[b.rec.priority] ?? 2));
    return pending.slice(0, 3);
  }, [insights, actionsMap]); // actionsMap covers getStatus closure

  const generateInsights = async () => {
    try {
      setGenerating(true);
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Sucesso! 🎉',
          description: data.message,
        });
        await fetchInsights(null);
        await fetchGenerations();
        setSelectedGenerationId(null); // snap back to latest after new generation (D-05)
        // Also exit compare mode so user sees fresh single-column view
        exitCompareMode();
      } else {
        if (response.status === 429) {
          const timeUntil = new Date(data.nextAvailableAt).toLocaleString('pt-BR');
          toast({
            title: 'Limite atingido',
            description: `Próxima geração disponível em: ${timeUntil}`,
            variant: 'destructive',
          });
        } else {
          throw new Error(data.message || data.error);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao gerar insights',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const deleteInsight = async (id: string) => {
    try {
      const response = await fetch(`/api/insights?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setInsights(insights.filter((i) => i.id !== id));
        toast({
          title: 'Insight removido',
          description: 'Insight deletado com sucesso',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao deletar insight',
        variant: 'destructive',
      });
    }
  };

  const handleGenerationChange = async (value: string) => {
    const newId = value === 'latest' ? null : value;
    setSelectedGenerationId(newId);
    setGenerationsLoading(true);
    await fetchInsights(newId);
    setGenerationsLoading(false);
  };

  const filteredInsights =
    selectedType === 'all'
      ? insights
      : insights.filter((i) => i.insight_type === selectedType);

  const getTimeUntilNext = () => {
    if (!nextAvailable) return null;
    const now = new Date();
    const next = new Date(nextAvailable);
    const diff = next.getTime() - now.getTime();

    if (diff <= 0) return 'Disponível agora';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatGenerationDate = (iso: string): string =>
    new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatGenerationLabel = (gen: Generation): string => {
    const date = new Date(gen.generated_at);
    if (gen.source === 'automatic') {
      return `Automatico — ${date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    }
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Renders a single column of insight cards.
   * Used for both compare-mode columns and optionally the single-column non-compare view.
   *
   * @param columnInsights  The insights array for this column (main or compare)
   * @param columnGenerationId  null = latest, UUID = historical
   * @param columnLoading  Whether this column is fetching
   * @param columnLabel  'A' = left/primary, 'B' = right/compare
   */
  const renderInsightColumn = (
    columnInsights: Insight[],
    columnGenerationId: string | null,
    columnLoading: boolean,
    columnLabel: 'A' | 'B'
  ) => {
    const columnFiltered =
      selectedType === 'all'
        ? columnInsights
        : columnInsights.filter((i) => i.insight_type === selectedType);

    const isLatest = columnGenerationId === null;
    const generationMeta = columnGenerationId
      ? generations.find((g) => g.id === columnGenerationId)
      : null;

    return (
      <div className={columnLoading ? 'opacity-50 pointer-events-none' : ''}>
        {/* Column header with badge */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={isLatest ? 'default' : 'secondary'}>
            {isLatest
              ? 'Atual'
              : `Histórico - ${formatGenerationDate(generationMeta?.generated_at ?? '')}`}
          </Badge>
          <span className="text-xs text-muted-foreground">Coluna {columnLabel}</span>
        </div>

        {/* Column B gets its own generation selector */}
        {columnLabel === 'B' && (
          <Select
            value={compareGenerationId ?? 'latest'}
            onValueChange={handleCompareGenerationChange}
            disabled={compareLoading}
          >
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Mais recente (atual)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Mais recente (atual)</SelectItem>
              {generations.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {formatGenerationLabel(g)} ({g.insight_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Insight cards */}
        {columnFiltered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum insight nesta geração</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {columnFiltered.map((insight) => {
              const config = insightTypeConfig[insight.insight_type as keyof typeof insightTypeConfig];
              const Icon = config?.icon || Sparkles;

              return (
                <Card key={insight.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${config?.bgColor}`}>
                          <Icon className={`h-5 w-5 ${config?.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{insight.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {insight.summary}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline">{config?.label}</Badge>
                            <Badge variant="outline">
                              Confiança: {(insight.confidence_score * 100).toFixed(0)}%
                            </Badge>
                            {insight.recommendations?.length > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {getDoneCount(insight.id, insight.recommendations.length)}/{insight.recommendations.length} concluídas
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteInsight(insight.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Findings */}
                    {insight.detailed_analysis?.mainFindings?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Principais Descobertas
                        </h4>
                        <ul className="space-y-1 ml-6">
                          {insight.detailed_analysis.mainFindings.map((finding, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground list-disc">
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Trends */}
                    {insight.detailed_analysis?.trends?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Tendências
                        </h4>
                        <ul className="space-y-1 ml-6">
                          {insight.detailed_analysis.trends.map((trend, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground list-disc">
                              {trend}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Opportunities */}
                    {insight.detailed_analysis?.opportunities?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                          <Sparkles className="h-4 w-4" />
                          Oportunidades
                        </h4>
                        <ul className="space-y-1 ml-6">
                          {insight.detailed_analysis.opportunities.map((opp, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground list-disc">
                              {opp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Risks */}
                    {insight.detailed_analysis?.risks?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          Riscos
                        </h4>
                        <ul className="space-y-1 ml-6">
                          {insight.detailed_analysis.risks.map((risk, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground list-disc">
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendations */}
                    {insight.recommendations?.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Recomendações</h4>
                        <div className="space-y-3">
                          {insight.recommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="border rounded-lg p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-medium flex-1">{rec.title}</h5>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Badge
                                    variant="outline"
                                    className={getPriorityColor(rec.priority)}
                                  >
                                    {rec.priority === 'high'
                                      ? 'Alta'
                                      : rec.priority === 'medium'
                                      ? 'Média'
                                      : 'Baixa'}
                                  </Badge>
                                  <Select
                                    value={getStatus(insight.id, idx)}
                                    onValueChange={(val) => updateStatus(insight.id, idx, val as ActionStatus)}
                                  >
                                    <SelectTrigger className="w-[140px] h-7 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pendente</SelectItem>
                                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                                      <SelectItem value="done">Concluída</SelectItem>
                                      <SelectItem value="ignored">Ignorada</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rec.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <strong>Impacto:</strong> {rec.impact}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando insights...</p>
        </div>
      </div>
    );
  }

  // Paywall for non-Ultimate users
  if (upgradeRequired) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Sparkles className="h-20 w-20 text-primary" />
                  <Lock className="h-8 w-8 text-muted-foreground absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
                </div>
              </div>
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Crown className="h-8 w-8 text-yellow-500" />
                Insights com IA
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Recurso exclusivo do plano Ultimate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Com Insights IA você terá:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Análise de Padrões de Vendas</strong>
                      <p className="text-sm text-muted-foreground">Identifique tendências e sazonalidades</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Previsão de Estoque Inteligente</strong>
                      <p className="text-sm text-muted-foreground">Nunca mais fique sem produtos importantes</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShoppingCart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Recomendações de Produtos</strong>
                      <p className="text-sm text-muted-foreground">Saiba quais produtos promover ou descontinuar</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Detecção de Anomalias</strong>
                      <p className="text-sm text-muted-foreground">Identifique problemas antes que se tornem críticos</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Sugestões de Precificação</strong>
                      <p className="text-sm text-muted-foreground">Otimize seus preços para maximizar lucros</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Análise de Performance Completa</strong>
                      <p className="text-sm text-muted-foreground">KPIs e métricas detalhadas</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-yellow-600">Análise para Dropshipping</strong>
                      <p className="text-sm text-muted-foreground">Insights focados em dropshipping e fornecedores</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Desbloqueie todo o potencial da IA para seu e-commerce
                </p>
                <Link href="/settings">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    <Crown className="h-5 w-5" />
                    Fazer Upgrade para Ultimate
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Cancele a qualquer momento
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 flex-wrap">
              <Sparkles className="h-8 w-8 text-primary" />
              Insights com IA
              <Badge variant="outline" className="gap-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                Ultimate
              </Badge>
              {generations.length > 0 && (
                <Badge variant={selectedGenerationId === null ? 'default' : 'secondary'}>
                  {selectedGenerationId === null
                    ? 'Atual'
                    : `Histórico - ${formatGenerationDate(
                        generations.find((g) => g.id === selectedGenerationId)?.generated_at ?? ''
                      )}`}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Análises inteligentes baseadas nos seus dados de e-commerce
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {!canGenerate && nextAvailable && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Próxima geração: {getTimeUntilNext()}</span>
              </div>
            )}
            {generations.length > 0 && (
              <Select
                value={selectedGenerationId ?? 'latest'}
                onValueChange={handleGenerationChange}
                disabled={generationsLoading || compareMode}
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Mais recente (atual)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Mais recente (atual)</SelectItem>
                  {generations.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {formatGenerationLabel(g)} ({g.insight_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Compare mode buttons (Plan 10-03) */}
            {selectedGenerationId !== null && !compareMode && (
              <Button variant="outline" onClick={enterCompareMode}>
                Comparar
              </Button>
            )}
            {compareMode && (
              <Button variant="ghost" onClick={exitCompareMode}>
                Sair da comparação
              </Button>
            )}
            <Button
              onClick={generateInsights}
              disabled={!canGenerate || generating}
              size="lg"
              className="gap-2"
            >
              <Sparkles className={generating ? 'animate-spin' : ''} />
              {generating ? 'Gerando...' : 'Gerar Insights'}
            </Button>
          </div>
        </div>

        {/* Card "O que fazer hoje" — always visible, against primary column A insights only */}
        {insights.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                O que fazer hoje
              </CardTitle>
              <CardDescription>
                {todayActions.length > 0
                  ? 'Top 3 recomendações de alta prioridade pendentes'
                  : 'Tudo em dia! Nenhuma recomendação pendente no momento.'}
              </CardDescription>
            </CardHeader>
            {todayActions.length > 0 && (
              <CardContent>
                <div className="space-y-3">
                  {todayActions.map((item) => (
                    <div
                      key={`${item.insightId}:${item.recIndex}`}
                      className="flex items-start justify-between gap-3 border rounded-lg p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.rec.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.rec.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          De: {item.insightTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant="outline"
                          className={getPriorityColor(item.rec.priority)}
                        >
                          {item.rec.priority === 'high' ? 'Alta' : item.rec.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                        <Select
                          value={getStatus(item.insightId, item.recIndex)}
                          onValueChange={(val) => updateStatus(item.insightId, item.recIndex, val as ActionStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="in_progress">Em Progresso</SelectItem>
                            <SelectItem value="done">Concluída</SelectItem>
                            <SelectItem value="ignored">Ignorada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Stats Cards — always against primary column A insights */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(
                    (insights.reduce((sum, i) => sum + (i.confidence_score || 0), 0) /
                      insights.length) *
                    100
                  ).toFixed(0)}
                  %
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Recomendações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.reduce(
                    (sum, i) => sum + (i.recommendations?.length || 0),
                    0
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.reduce(
                    (sum, i) =>
                      sum +
                      (i.recommendations?.filter((r) => r.priority === 'high').length ||
                        0),
                    0
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {Object.entries(insightTypeConfig).map(([key, config]) => (
              <TabsTrigger key={key} value={key} className="gap-1">
                <config.icon className="h-3 w-3" />
                <span className="hidden lg:inline">{config.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Insights List — compare mode shows 2 columns, single mode shows existing inline render */}
        {compareMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderInsightColumn(insights, selectedGenerationId, generationsLoading, 'A')}
            {renderInsightColumn(compareInsights, compareGenerationId, compareLoading, 'B')}
          </div>
        ) : (
          filteredInsights.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum insight ainda</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Clique em "Gerar Insights" para criar análises inteligentes dos seus dados
                </p>
                {canGenerate && (
                  <Button onClick={generateInsights} disabled={generating}>
                    <Sparkles className="mr-2" />
                    Gerar Primeiro Insight
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={`space-y-6 ${generationsLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {filteredInsights.map((insight) => {
                const config = insightTypeConfig[insight.insight_type as keyof typeof insightTypeConfig];
                const Icon = config?.icon || Sparkles;

                return (
                  <Card key={insight.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${config?.bgColor}`}>
                            <Icon className={`h-5 w-5 ${config?.color}`} />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl">{insight.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {insight.summary}
                            </CardDescription>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge variant="outline">{config?.label}</Badge>
                              <Badge variant="outline">
                                Confiança: {(insight.confidence_score * 100).toFixed(0)}%
                              </Badge>
                              {insight.recommendations?.length > 0 && (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  {getDoneCount(insight.id, insight.recommendations.length)}/{insight.recommendations.length} concluídas
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInsight(insight.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Main Findings */}
                      {insight.detailed_analysis?.mainFindings?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Principais Descobertas
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {insight.detailed_analysis.mainFindings.map((finding, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Trends */}
                      {insight.detailed_analysis?.trends?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Tendências
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {insight.detailed_analysis.trends.map((trend, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">
                                {trend}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Opportunities */}
                      {insight.detailed_analysis?.opportunities?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-600">
                            <Sparkles className="h-4 w-4" />
                            Oportunidades
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {insight.detailed_analysis.opportunities.map((opp, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risks */}
                      {insight.detailed_analysis?.risks?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Riscos
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {insight.detailed_analysis.risks.map((risk, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground list-disc">
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {insight.recommendations?.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Recomendações</h4>
                          <div className="space-y-3">
                            {insight.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className="border rounded-lg p-4 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="font-medium flex-1">{rec.title}</h5>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={getPriorityColor(rec.priority)}
                                    >
                                      {rec.priority === 'high'
                                        ? 'Alta'
                                        : rec.priority === 'medium'
                                        ? 'Média'
                                        : 'Baixa'}
                                    </Badge>
                                    <Select
                                      value={getStatus(insight.id, idx)}
                                      onValueChange={(val) => updateStatus(insight.id, idx, val as ActionStatus)}
                                    >
                                      <SelectTrigger className="w-[140px] h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                                        <SelectItem value="done">Concluída</SelectItem>
                                        <SelectItem value="ignored">Ignorada</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {rec.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  <strong>Impacto:</strong> {rec.impact}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

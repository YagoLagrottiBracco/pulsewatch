import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

export interface InsightData {
  orders: any[];
  products: any[];
  alerts: any[];
  stores: any[];
  userProfile: any;
}

export interface GeneratedInsight {
  type: string;
  title: string;
  summary: string;
  detailedAnalysis: any;
  recommendations: any[];
  confidenceScore: number;
  dataAnalyzed: any;
}

export class AIInsightsService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async generateInsights(data: InsightData): Promise<GeneratedInsight[]> {
    const insights: GeneratedInsight[] = [];
    const isUltimate = data.userProfile?.subscription_tier === 'ultimate';

    // Prepare data summary for AI
    const dataSummary = this.prepareDataSummary(data);

    // Generate different types of insights
    const insightTypes = isUltimate
      ? [
          'sales_patterns',
          'stock_forecast',
          'product_recommendations',
          'anomaly_detection',
          'pricing_suggestions',
          'performance_analysis',
          'dropshipping_analysis',
        ]
      : [
          'sales_patterns',
          'stock_forecast',
          'product_recommendations',
          'anomaly_detection',
        ];

    for (const type of insightTypes) {
      try {
        const insight = await this.generateInsightByType(type, dataSummary, isUltimate);
        if (insight) {
          insights.push(insight);
        }
      } catch (error) {
        console.error(`Error generating insight type ${type}:`, error);
      }
    }

    return insights;
  }

  private prepareDataSummary(data: InsightData): string {
    const summary = {
      totalOrders: data.orders.length,
      totalProducts: data.products.length,
      totalAlerts: data.alerts.length,
      totalStores: data.stores.length,
      
      // Orders analysis
      ordersLast7Days: data.orders.filter(o => {
        const orderDate = new Date(o.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return orderDate > weekAgo;
      }).length,
      
      ordersLast30Days: data.orders.filter(o => {
        const orderDate = new Date(o.created_at);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return orderDate > monthAgo;
      }).length,
      
      // Revenue
      totalRevenue: data.orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0),
      averageOrderValue: data.orders.length > 0 
        ? data.orders.reduce((sum, o) => sum + (parseFloat(o.total_price) || 0), 0) / data.orders.length 
        : 0,
      
      // Products
      lowStockProducts: data.products.filter(p => (p.stock_quantity || 0) < 10).length,
      outOfStockProducts: data.products.filter(p => (p.stock_quantity || 0) === 0).length,
      
      // Top products by orders
      topProducts: this.getTopProducts(data.orders, data.products, 5),
      
      // Alert patterns
      alertsByType: this.groupAlertsByType(data.alerts),
      
      // Store platforms
      storePlatforms: data.stores.map(s => s.platform),
      
      // Recent alerts
      recentAlerts: data.alerts.slice(0, 10).map(a => ({
        type: a.alert_type,
        severity: a.severity,
        message: a.message,
      })),
    };

    return JSON.stringify(summary, null, 2);
  }

  private getTopProducts(orders: any[], products: any[], limit: number): any[] {
    const productOrderCount: { [key: string]: number } = {};
    
    // Count orders per product (simplified - in real scenario you'd have order items)
    orders.forEach(order => {
      if (order.product_id) {
        productOrderCount[order.product_id] = (productOrderCount[order.product_id] || 0) + 1;
      }
    });

    return Object.entries(productOrderCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId, count]) => {
        const product = products.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Unknown',
          orderCount: count,
          price: product?.price,
          stock: product?.stock_quantity,
        };
      });
  }

  private groupAlertsByType(alerts: any[]): { [key: string]: number } {
    return alerts.reduce((acc, alert) => {
      acc[alert.alert_type] = (acc[alert.alert_type] || 0) + 1;
      return acc;
    }, {});
  }

  private async generateInsightByType(
    type: string,
    dataSummary: string,
    isUltimate: boolean
  ): Promise<GeneratedInsight | null> {
    const prompts: { [key: string]: string } = {
      sales_patterns: `Analise os padrões de vendas abaixo e forneça insights acionáveis. Identifique tendências, sazonalidade, dias/horários de pico, e oportunidades de crescimento.`,
      
      stock_forecast: `Com base nos dados de estoque e vendas, preveja necessidades futuras de estoque. Identifique produtos que precisam de reposição urgente e aqueles com estoque excessivo.`,
      
      product_recommendations: `Analise o desempenho dos produtos e recomende ações específicas: quais produtos promover, quais descontinuar, e oportunidades de upsell/cross-sell.`,
      
      anomaly_detection: `Identifique anomalias e comportamentos incomuns nos dados: picos ou quedas súbitas em vendas, problemas de estoque, alertas recorrentes, ou padrões suspeitos.`,
      
      pricing_suggestions: `Analise a estratégia de precificação atual e sugira otimizações. Considere valor médio de pedido, produtos mais/menos vendidos, e oportunidades de ajuste de preços.`,
      
      performance_analysis: `Faça uma análise completa de performance: métricas-chave (KPIs), comparação com períodos anteriores, pontos fortes e fracos, e áreas de melhoria.`,
      
      dropshipping_analysis: `ANÁLISE FOCADA EM DROPSHIPPING: Identifique produtos ideais para dropshipping (alta margem, baixo estoque necessário), fornecedores potenciais, nichos lucrativos, e estratégias de precificação competitiva. Analise tempos de entrega e satisfação do cliente.`,
    };

    const prompt = `${prompts[type] || prompts.sales_patterns}

DADOS DO E-COMMERCE:
${dataSummary}

IMPORTANTE: Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem \`\`\`json, apenas o JSON puro):
{
  "title": "Título curto e objetivo do insight",
  "summary": "Resumo executivo em 2-3 frases",
  "detailedAnalysis": {
    "mainFindings": ["descoberta 1", "descoberta 2", "descoberta 3"],
    "trends": ["tendência 1", "tendência 2"],
    "risks": ["risco 1", "risco 2"],
    "opportunities": ["oportunidade 1", "oportunidade 2"]
  },
  "recommendations": [
    {
      "title": "Recomendação 1",
      "description": "Descrição detalhada",
      "priority": "high|medium|low",
      "impact": "Impacto esperado"
    }
  ],
  "confidenceScore": 0.85
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedResponse = JSON.parse(cleanedText);

      return {
        type,
        title: parsedResponse.title,
        summary: parsedResponse.summary,
        detailedAnalysis: parsedResponse.detailedAnalysis,
        recommendations: parsedResponse.recommendations || [],
        confidenceScore: parsedResponse.confidenceScore || 0.75,
        dataAnalyzed: {
          generatedAt: new Date().toISOString(),
          dataPoints: dataSummary.length,
          isUltimate,
        },
      };
    } catch (error) {
      console.error(`Failed to generate ${type} insight:`, error);
      return null;
    }
  }
}

export const aiInsightsService = new AIInsightsService();

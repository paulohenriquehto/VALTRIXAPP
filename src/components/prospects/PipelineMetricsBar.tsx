import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, DollarSign, Target, Percent } from 'lucide-react';
import { useProspectsStore } from '@/stores/prospectsStore';
import { formatCurrency, formatCompactCurrency } from '@/types/prospects';

export function PipelineMetricsBar() {
  const { metrics, stages, isLoading } = useProspectsStore();

  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total em Pipeline',
      value: formatCompactCurrency(metrics.totalValue),
      subvalue: `${metrics.totalProspects} prospects`,
      icon: <DollarSign className="h-4 w-4" />,
      color: 'text-blue-600',
    },
    {
      title: 'Valor Ponderado',
      value: formatCompactCurrency(metrics.weightedValue),
      subvalue: 'Probabilidade ponderada',
      icon: <Target className="h-4 w-4" />,
      color: 'text-purple-600',
    },
    {
      title: 'Ticket Medio',
      value: formatCompactCurrency(metrics.avgDealSize),
      subvalue: 'Por prospect',
      icon: <TrendingUp className="h-4 w-4" />,
      color: 'text-green-600',
    },
    {
      title: 'Taxa de Conversao',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      subvalue: `${metrics.byStatus.won || 0} ganhos`,
      icon: <Percent className="h-4 w-4" />,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-4 mb-4">
      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.title}</p>
                <p className="text-xl font-bold mt-1">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.subvalue}</p>
              </div>
              <div className={`p-2 rounded-full bg-muted ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Stage breakdown */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stage) => {
          const stageMetric = metrics.byStage.find((s) => s.stageId === stage.id);
          return (
            <Badge
              key={stage.id}
              variant="outline"
              className="flex-shrink-0 gap-2 py-1.5 px-3"
              style={{ borderColor: stage.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="font-medium">{stage.name}</span>
              <span className="text-muted-foreground">
                {stageMetric?.prospectCount || 0}
              </span>
              {stageMetric && stageMetric.totalValue > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({formatCompactCurrency(stageMetric.totalValue)})
                </span>
              )}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

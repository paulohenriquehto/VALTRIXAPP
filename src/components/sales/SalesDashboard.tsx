import React from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Phone,
  Mail,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  BarChart3,
} from 'lucide-react';
import { KPIGrid, ResponsiveGrid } from '@/components/ui/responsive-grid';
import { SalesFunnelChart } from './SalesFunnelChart';
import { SalesActivityChart } from './SalesActivityChart';
import { FUNNEL_COLORS, SERVICE_LABELS, SERVICE_COLORS } from '@/types/sales';

export const SalesDashboard: React.FC = () => {
  const { summary, funnelData, chartData, activeGoal } = useSalesStore();

  // KPI Card Component
  const KPICard = ({
    title,
    value,
    description,
    icon: Icon,
    color,
    trend,
  }: {
    title: string;
    value: number | string;
    description: string;
    icon: React.ElementType;
    color: string;
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <KPIGrid>
        <KPICard
          title="Contatos Enviados"
          value={summary?.totals.contacts || 0}
          description={`${summary?.averages.contacts_per_day || 0}/dia`}
          icon={Mail}
          color="bg-blue-500/10 text-blue-500"
          trend={summary?.trends?.contacts_trend ? (summary.trends.contacts_trend > 0 ? 'up' : 'down') : 'stable'}
        />
        <KPICard
          title="Ligacoes"
          value={summary?.totals.calls || 0}
          description={`${summary?.averages.calls_per_day || 0}/dia`}
          icon={Phone}
          color="bg-green-500/10 text-green-500"
        />
        <KPICard
          title="Reunioes"
          value={summary?.totals.meetings || 0}
          description={`${summary?.period || '30 dias'}`}
          icon={Users}
          color="bg-purple-500/10 text-purple-500"
        />
        <KPICard
          title="Negocios Fechados"
          value={summary?.totals.deals || 0}
          description={`R$ ${(summary?.totals.revenue || 0).toLocaleString('pt-BR')}`}
          icon={DollarSign}
          color="bg-emerald-500/10 text-emerald-500"
        />
      </KPIGrid>

      {/* Taxa de Conversao e Meta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Conversao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl font-bold">
                {(summary?.averages.conversion_rate || 0).toFixed(1)}%
              </span>
              <Badge variant={
                (summary?.averages.conversion_rate || 0) > 5 ? 'default' :
                (summary?.averages.conversion_rate || 0) > 2 ? 'secondary' : 'destructive'
              }>
                {(summary?.averages.conversion_rate || 0) > 5 ? 'Excelente' :
                 (summary?.averages.conversion_rate || 0) > 2 ? 'Bom' : 'Precisa melhorar'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              De {summary?.totals.contacts || 0} contatos, {summary?.totals.deals || 0} viraram clientes
            </p>
          </CardContent>
        </Card>

        {activeGoal && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Meta Ativa
              </CardTitle>
              <CardDescription>{activeGoal.title || 'Meta de Vendas'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Contatos</span>
                    <span>{summary?.totals.contacts || 0}/{activeGoal.contacts_target}</span>
                  </div>
                  <Progress
                    value={Math.min(100, ((summary?.totals.contacts || 0) / activeGoal.contacts_target) * 100)}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Negocios</span>
                    <span>{summary?.totals.deals || 0}/{activeGoal.deals_target}</span>
                  </div>
                  <Progress
                    value={Math.min(100, ((summary?.totals.deals || 0) / activeGoal.deals_target) * 100)}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Funil de Vendas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Funil de Vendas</CardTitle>
          <CardDescription>Visualizacao do pipeline comercial</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesFunnelChart data={funnelData} />
        </CardContent>
      </Card>

      {/* Grafico de Atividades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Atividades por Dia</CardTitle>
          <CardDescription>Historico de atividades comerciais</CardDescription>
        </CardHeader>
        <CardContent>
          <SalesActivityChart data={chartData} />
        </CardContent>
      </Card>

      {/* Vendas por Servico */}
      {summary?.byService && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendas por Servico</CardTitle>
            <CardDescription>Distribuicao por tipo de servico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.byService).map(([service, count]) => (
                <div
                  key={service}
                  className="text-center p-4 rounded-lg border"
                  style={{ borderColor: SERVICE_COLORS[service as keyof typeof SERVICE_COLORS] + '40' }}
                >
                  <p
                    className="text-2xl font-bold"
                    style={{ color: SERVICE_COLORS[service as keyof typeof SERVICE_COLORS] }}
                  >
                    {count}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {SERVICE_LABELS[service as keyof typeof SERVICE_LABELS]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

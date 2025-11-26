import React, { useMemo, useEffect } from 'react';
import { useDashboardStats, useTasks, useClients, useAuth } from '../stores/appStore';
import { TaskService, ClientService } from '../services';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  UserMinus,
  AlertTriangle,
  Target,
  Percent,
  CalendarClock,
  BarChart3
} from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/ui/page-header';
import { KPIGrid, ResponsiveGrid } from '@/components/ui/responsive-grid';
import { AIDashboardWidget } from '@/components/ai';

const Dashboard: React.FC = () => {
  const stats = useDashboardStats();
  const { tasks, setTasks } = useTasks();
  const { clients, setClients, getMRRMetrics } = useClients();
  const { user } = useAuth();

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [tasksData, clientsData] = await Promise.all([
        TaskService.getAll(user.id),
        ClientService.getAll(user.id)
      ]);
      setTasks(tasksData);
      setClients(clientsData);
    } catch (error: any) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  // Calcular métricas de negócio reais
  const businessMetrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Métricas financeiras reais
    const financialMetrics = getMRRMetrics();

    // Tarefas dos últimos 30 dias
    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);

    // Dinheiro na mesa (tarefas vencidas não completadas)
    const overdueTasks = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    }).length;
    const lostRevenue = overdueTasks * 75; // Estimativa de perda por atraso

    // Taxa de crescimento (novos vs mês anterior)
    const growthRate = financialMetrics.activeClients >
      0
      ? (financialMetrics.newThisMonth / financialMetrics.activeClients) * 100
      : 0;

    // ROI real (baseado em custos de aquisição reais dos clientes)
    // Dados vêm de financialMetrics que já calcula avgROI, totalAcquisitionCost, realProfit
    const roi = financialMetrics.avgROI || 0; // ROI médio dos clientes recorrentes
    const totalAcquisitionCost = financialMetrics.totalAcquisitionCost || 0;
    const realProfit = financialMetrics.realProfit || 0;

    // Churn Rate
    const churnRate = financialMetrics.totalClients > 0
      ? (financialMetrics.churnedThisMonth / financialMetrics.totalClients) * 100
      : 0;

    // Tarefas em risco (próximas de vencer em 7 dias)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tasksAtRisk = tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= sevenDaysFromNow;
    }).length;

    return {
      mrr: financialMetrics.totalMRR,
      mrrGrowth: growthRate, // Usando growthRate como proxy para crescimento de MRR por enquanto
      churnRate,
      lostRevenue,
      growthRate,
      activeClients: financialMetrics.activeClients,
      roi, // ROI médio real baseado em CAC
      totalAcquisitionCost, // CAC total investido
      realProfit, // Lucro real (receita - CAC)
      tasksAtRisk,
      conversionRate: stats.completionRate,
      // Previsões de receita
      upcomingRevenue7Days: financialMetrics.upcomingRevenue7Days,
      todayRevenue: financialMetrics.todayRevenue,
      // Valores pendentes
      paymentsPending: financialMetrics.paymentsPending,
      paymentsOverdue: financialMetrics.paymentsOverdue,
      freelanceRevenuePending: financialMetrics.freelanceMetrics.revenuePending,
    };
  }, [stats, tasks, clients, getMRRMetrics]);

  // Componente de Card de Métrica
  const MetricCard = ({
    title,
    value,
    description,
    trend,
    trendValue,
    icon: Icon,
    format = 'number'
  }: {
    title: string;
    value: number;
    description: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: number;
    icon: any;
    format?: 'currency' | 'percentage' | 'number';
  }) => {
    const formatValue = () => {
      if (format === 'currency') {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (format === 'percentage') {
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString('pt-BR');
    };

    // Determinar cor do badge baseado na tendência
    const getBadgeColor = () => {
      if (!trend || trendValue === undefined) return '';

      if (trend === 'up') {
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      } else if (trend === 'down') {
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      } else {
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      }
    };

    const getTrendIcon = () => {
      if (trend === 'up') return <TrendingUp className="h-3 w-3" />;
      if (trend === 'down') return <TrendingDown className="h-3 w-3" />;
      return <span className="h-3 w-3">→</span>;
    };

    return (
      <Card className="hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-muted/30 to-background">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-3 sm:p-4 sm:pb-2">
          <CardDescription className="text-xs sm:text-sm font-medium truncate pr-2">
            {title}
          </CardDescription>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">
            {formatValue()}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            {trend && trendValue !== undefined && (
              <Badge
                variant="outline"
                className={`gap-0.5 sm:gap-1 text-xs ${getBadgeColor()}`}
              >
                {getTrendIcon()}
                {Math.abs(trendValue).toFixed(1)}%
              </Badge>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageContainer className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Dashboard de Negócio"
        description="Visão geral das métricas mais importantes da operação"
      />

      {/* AI Manager Widget */}
      <AIDashboardWidget />

      {/* Métricas Principais - Linha 1 */}
      <KPIGrid>
        <MetricCard
          title="MRR - Receita Recorrente"
          value={businessMetrics.mrr}
          description="vs mês anterior"
          trend={
            businessMetrics.mrrGrowth > 2 ? 'up' :
              businessMetrics.mrrGrowth < -2 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.mrrGrowth}
          icon={DollarSign}
          format="currency"
        />

        <MetricCard
          title="Taxa de Crescimento"
          value={businessMetrics.growthRate}
          description="últimos 30 dias"
          trend={
            businessMetrics.growthRate > 5 ? 'up' :
              businessMetrics.growthRate < -5 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.growthRate}
          icon={BarChart3}
          format="percentage"
        />

        <MetricCard
          title="Churn Rate"
          value={businessMetrics.churnRate}
          description="clientes saindo"
          trend={
            businessMetrics.churnRate < 3 ? 'up' :
              businessMetrics.churnRate > 7 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.churnRate}
          icon={UserMinus}
          format="percentage"
        />

        <MetricCard
          title="Dinheiro na Mesa"
          value={businessMetrics.lostRevenue}
          description="oportunidades perdidas"
          trend={
            businessMetrics.lostRevenue < 500 ? 'up' :
              businessMetrics.lostRevenue > 1500 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.lostRevenue > 0 ? (businessMetrics.lostRevenue / 100) : 0}
          icon={AlertTriangle}
          format="currency"
        />
      </KPIGrid>

      {/* Métricas Secundárias - Linha 2 */}
      <KPIGrid>
        <MetricCard
          title="Taxa de Conversão"
          value={businessMetrics.conversionRate}
          description="tarefas completadas"
          trend={
            businessMetrics.conversionRate >= 70 ? 'up' :
              businessMetrics.conversionRate < 50 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.conversionRate}
          icon={Target}
          format="percentage"
        />

        <MetricCard
          title="Clientes Ativos"
          value={businessMetrics.activeClients}
          description="em andamento"
          icon={Users}
          format="number"
        />

        <MetricCard
          title="ROI Médio"
          value={businessMetrics.roi}
          description="retorno sobre investimento real"
          trend={
            businessMetrics.roi > 300 ? 'up' :
              businessMetrics.roi < 100 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.roi}
          icon={Percent}
          format="percentage"
        />

        <MetricCard
          title="Tarefas em Risco"
          value={businessMetrics.tasksAtRisk}
          description="próximas de vencer (7 dias)"
          trend={
            businessMetrics.tasksAtRisk <= 3 ? 'up' :
              businessMetrics.tasksAtRisk > 7 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.tasksAtRisk > 0 ? businessMetrics.tasksAtRisk * 10 : 0}
          icon={CalendarClock}
          format="number"
        />
      </KPIGrid>

      {/* Métricas de Previsão e Valores Pendentes - Linha 3 */}
      <KPIGrid>
        <MetricCard
          title="Receita Hoje"
          value={businessMetrics.todayRevenue}
          description="vencimentos de hoje"
          trend={
            businessMetrics.todayRevenue > 1000 ? 'up' :
              businessMetrics.todayRevenue > 0 ? 'stable' : 'down'
          }
          trendValue={businessMetrics.todayRevenue > 0 ? (businessMetrics.todayRevenue / businessMetrics.mrr) * 100 : 0}
          icon={DollarSign}
          format="currency"
        />

        <MetricCard
          title="Previsão 7 Dias"
          value={businessMetrics.upcomingRevenue7Days}
          description="receita esperada próximos 7 dias"
          trend={
            businessMetrics.upcomingRevenue7Days > 5000 ? 'up' :
              businessMetrics.upcomingRevenue7Days > 2000 ? 'stable' : 'down'
          }
          trendValue={businessMetrics.upcomingRevenue7Days > 0 ? (businessMetrics.upcomingRevenue7Days / businessMetrics.mrr) * 100 : 0}
          icon={TrendingUp}
          format="currency"
        />

        <MetricCard
          title="Pendente Recorrente"
          value={businessMetrics.paymentsPending}
          description="pagamentos a receber (MRR)"
          trend={
            businessMetrics.paymentsPending < 1000 ? 'up' :
              businessMetrics.paymentsPending > 5000 ? 'down' : 'stable'
          }
          trendValue={businessMetrics.paymentsPending > 0 ? (businessMetrics.paymentsPending / businessMetrics.mrr) * 100 : 0}
          icon={AlertTriangle}
          format="currency"
        />

        <MetricCard
          title="Pendente Freelance"
          value={businessMetrics.freelanceRevenuePending}
          description="projetos ativos a receber"
          trend={
            businessMetrics.freelanceRevenuePending > 10000 ? 'up' :
              businessMetrics.freelanceRevenuePending > 5000 ? 'stable' : 'down'
          }
          trendValue={businessMetrics.freelanceRevenuePending > 0 ? 10 : 0}
          icon={AlertTriangle}
          format="currency"
        />
      </KPIGrid>

      {/* Insights e Alertas */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Insights de Negócio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          <ResponsiveGrid preset="two">
            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                {businessMetrics.churnRate > 5 ? (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                )}
                Taxa de Churn
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.churnRate > 5
                  ? `⚠️ Churn de ${businessMetrics.churnRate.toFixed(1)}% alto. Foque em retenção.`
                  : `✅ Churn de ${businessMetrics.churnRate.toFixed(1)}% saudável.`}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                {businessMetrics.lostRevenue > 1000 ? (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                )}
                Oportunidades Perdidas
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.lostRevenue > 1000
                  ? `💸 R$ ${businessMetrics.lostRevenue.toFixed(2)} na mesa!`
                  : `✅ Boa gestão de prazos!`}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                {businessMetrics.tasksAtRisk > 5 ? (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                )}
                Tarefas em Risco
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.tasksAtRisk > 5
                  ? `⏰ ${businessMetrics.tasksAtRisk} tarefas vencem em 7 dias.`
                  : `✅ ${businessMetrics.tasksAtRisk} tarefas próximas do prazo.`}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                {businessMetrics.roi >= 300 ? (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                ) : businessMetrics.roi >= 100 ? (
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                )}
                ROI Real
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.roi >= 300
                  ? `🚀 ROI ${businessMetrics.roi.toFixed(0)}% excelente!`
                  : businessMetrics.roi >= 100
                  ? `📈 ROI ${businessMetrics.roi.toFixed(0)}% bom.`
                  : businessMetrics.roi > 0
                  ? `⚠️ ROI ${businessMetrics.roi.toFixed(0)}% precisa melhorar.`
                  : `💡 Sem dados de ROI.`}
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                {businessMetrics.upcomingRevenue7Days > businessMetrics.mrr * 0.5 ? (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                ) : businessMetrics.upcomingRevenue7Days > businessMetrics.mrr * 0.2 ? (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 shrink-0" />
                )}
                Previsão 7 Dias
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.upcomingRevenue7Days > businessMetrics.mrr * 0.5
                  ? `💰 R$ ${businessMetrics.upcomingRevenue7Days.toFixed(2)} previstos!`
                  : businessMetrics.upcomingRevenue7Days > businessMetrics.mrr * 0.2
                  ? `📊 R$ ${businessMetrics.upcomingRevenue7Days.toFixed(2)} esperados.`
                  : businessMetrics.upcomingRevenue7Days > 0
                  ? `⚠️ R$ ${businessMetrics.upcomingRevenue7Days.toFixed(2)} previstos.`
                  : `💡 Sem vencimentos próximos.`}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                {businessMetrics.paymentsPending + businessMetrics.freelanceRevenuePending < 5000 ? (
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                )}
                Valores Pendentes
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {businessMetrics.paymentsPending + businessMetrics.freelanceRevenuePending < 5000
                  ? `✅ R$ ${(businessMetrics.paymentsPending + businessMetrics.freelanceRevenuePending).toFixed(2)} pendentes. Boa gestão!`
                  : `⚠️ R$ ${(businessMetrics.paymentsPending + businessMetrics.freelanceRevenuePending).toFixed(2)} pendentes. Monitore cobranças.`}
              </p>
            </div>
          </ResponsiveGrid>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default Dashboard;
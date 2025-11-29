import React, { useState, useMemo, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Users,
  Target,
  BarChart3,
  AlertCircle,
  Banknote,
  Percent,
  Briefcase,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useAuth, useTeam, useTasks, useClients } from '../stores/appStore';
import type { AnalyticsPeriod, DateRange, KPICardData } from '../types';
import type { PipelineMetrics, Prospect, PipelineStage } from '../types/prospects';
import { calculateOverallMetrics, periodToDateRange } from '../utils/analytics';
import { ProspectService } from '../services/prospectService';
import KPICard from '../components/KPICard';
import RevenueChart from '../components/RevenueChart';
import TasksDistributionChart from '../components/TasksDistributionChart';
import ProductivityBarChart from '../components/ProductivityBarChart';
import ClientsGrowthChart from '../components/ClientsGrowthChart';
import ProductivityRanking from '../components/ProductivityRanking';
import PeriodFilter from '../components/PeriodFilter';
import ExportButton from '../components/ExportButton';
import ProspectsFunnelChart from '../components/ProspectsFunnelChart';
import ProspectsDistributionChart from '../components/ProspectsDistributionChart';
import ProspectsTimelineChart from '../components/ProspectsTimelineChart';

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const { teamMembers } = useTeam();
  const { tasks } = useTasks();
  const { clients, payments, getMRRMetrics } = useClients();
  const [period, setPeriod] = useState<AnalyticsPeriod>('this_month');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [prospectMetrics, setProspectMetrics] = useState<PipelineMetrics | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);

  // Carregar dados de prospects
  useEffect(() => {
    if (user) {
      loadProspectData();
    }
  }, [user]);

  const loadProspectData = async () => {
    if (!user) return;
    try {
      const [metricsData, prospectsData, stagesData] = await Promise.all([
        ProspectService.getPipelineMetrics(user.id),
        ProspectService.getProspects(user.id, { statuses: ['open', 'won', 'lost'] }),
        ProspectService.getStagesWithMetrics(user.id)
      ]);
      setProspectMetrics(metricsData);
      setProspects(prospectsData);
      setStages(stagesData);
    } catch (error) {
      console.error('Erro ao carregar dados de prospects:', error);
    }
  };

  // Dados vêm do Supabase via store

  // Calcula métricas usando dados reais do Supabase
  const metrics = useMemo(() => {
    const dateRange = period === 'custom' && customDateRange ? customDateRange : periodToDateRange(period);
    return calculateOverallMetrics(
      clients,
      payments,
      tasks,
      teamMembers,
      period,
      dateRange
    );
  }, [period, customDateRange, clients, payments, tasks, teamMembers]);

  // Métricas de ROI reais do MRR
  const mrrMetrics = useMemo(() => getMRRMetrics(), [clients, getMRRMetrics]);

  // Prepara KPI Cards
  const kpiCards: KPICardData[] = [
    {
      id: 'revenue',
      title: 'Receita Total (MRR)',
      value: metrics.financial.mrr,
      unit: 'currency',
      trend: {
        value: Math.abs(metrics.financial.revenueGrowth),
        direction: metrics.financial.revenueGrowth > 0 ? 'up' : metrics.financial.revenueGrowth < 0 ? 'down' : 'stable',
        isPositive: metrics.financial.revenueGrowth > 0,
      },
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-green-100 dark:bg-green-900/30',
      description: `ARR: R$ ${(metrics.financial.arr / 1000).toFixed(0)}k`,
    },
    {
      id: 'clients',
      title: 'Clientes Ativos',
      value: metrics.financial.activeClients,
      unit: 'number',
      trend: {
        value: metrics.financial.newClients > 0 ? ((metrics.financial.newClients / metrics.financial.activeClients) * 100) : 0,
        direction: metrics.financial.newClients > 0 ? 'up' : 'stable',
        isPositive: true,
      },
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      description: `+${metrics.financial.newClients} novos no período`,
    },
    {
      id: 'tasks',
      title: 'Taxa de Conclusão',
      value: metrics.tasks.completionRate,
      unit: 'percent',
      trend: {
        value: 5.2,
        direction: 'up',
        isPositive: true,
      },
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      description: `${metrics.tasks.completedTasks}/${metrics.tasks.totalTasks} tarefas`,
    },
    {
      id: 'productivity',
      title: 'Score de Produtividade',
      value: metrics.teamProductivity.avgProductivityScore,
      unit: 'number',
      trend: {
        value: 3.1,
        direction: 'up',
        isPositive: true,
      },
      icon: <Target className="h-5 w-5" />,
      color: 'bg-orange-100 dark:bg-orange-900/30',
      description: `${metrics.teamProductivity.activeMembers} membros ativos`,
    },
    {
      id: 'payment-success',
      title: 'Taxa de Sucesso',
      value: metrics.financial.paymentSuccessRate,
      unit: 'percent',
      trend: {
        value: 2.5,
        direction: 'up',
        isPositive: true,
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-teal-100 dark:bg-teal-900/30',
      description: `${metrics.financial.paidInvoices} pagamentos recebidos`,
    },
    {
      id: 'roi-average',
      title: 'ROI Médio',
      value: mrrMetrics.avgROI || 0,
      unit: 'percent',
      trend: {
        value: mrrMetrics.avgROI > 300 ? ((mrrMetrics.avgROI - 300) / 300) * 100 : 0,
        direction: mrrMetrics.avgROI > 300 ? 'up' : mrrMetrics.avgROI >= 100 ? 'stable' : 'down',
        isPositive: mrrMetrics.avgROI >= 100,
      },
      icon: <Percent className="h-5 w-5" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Retorno sobre investimento',
    },
    {
      id: 'total-cac',
      title: 'CAC Total',
      value: mrrMetrics.totalAcquisitionCost || 0,
      unit: 'currency',
      trend: {
        value: 0,
        direction: 'stable',
        isPositive: true,
      },
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Custo total de aquisição',
    },
    {
      id: 'real-profit',
      title: 'Lucro Real',
      value: mrrMetrics.realProfit || 0,
      unit: 'currency',
      trend: {
        value: mrrMetrics.realProfit > 0 ? ((mrrMetrics.realProfit / (mrrMetrics.totalAcquisitionCost || 1)) * 100) : 0,
        direction: mrrMetrics.realProfit > mrrMetrics.totalAcquisitionCost ? 'up' : 'down',
        isPositive: mrrMetrics.realProfit > 0,
      },
      icon: <Banknote className="h-5 w-5" />,
      color: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Receita menos CAC',
    },
    {
      id: 'today-revenue',
      title: 'Receita Hoje',
      value: mrrMetrics.todayRevenue || 0,
      unit: 'currency',
      trend: {
        value: mrrMetrics.todayRevenue > 0 ? ((mrrMetrics.todayRevenue / mrrMetrics.totalMRR) * 100) : 0,
        direction: mrrMetrics.todayRevenue > 1000 ? 'up' : mrrMetrics.todayRevenue > 0 ? 'stable' : 'down',
        isPositive: mrrMetrics.todayRevenue > 0,
      },
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Vencimentos de hoje',
    },
    {
      id: 'upcoming-7-days',
      title: 'Previsão 7 Dias',
      value: mrrMetrics.upcomingRevenue7Days || 0,
      unit: 'currency',
      trend: {
        value: mrrMetrics.upcomingRevenue7Days > 0 ? ((mrrMetrics.upcomingRevenue7Days / mrrMetrics.totalMRR) * 100) : 0,
        direction: mrrMetrics.upcomingRevenue7Days > 5000 ? 'up' : mrrMetrics.upcomingRevenue7Days > 2000 ? 'stable' : 'down',
        isPositive: mrrMetrics.upcomingRevenue7Days > 0,
      },
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-cyan-100 dark:bg-cyan-900/30',
      description: 'Receita esperada próximos 7 dias',
    },
    {
      id: 'pending-recurring',
      title: 'Pendente Recorrente',
      value: mrrMetrics.paymentsPending || 0,
      unit: 'currency',
      trend: {
        value: mrrMetrics.paymentsPending > 0 ? ((mrrMetrics.paymentsPending / mrrMetrics.totalMRR) * 100) : 0,
        direction: mrrMetrics.paymentsPending < 1000 ? 'up' : mrrMetrics.paymentsPending > 5000 ? 'down' : 'stable',
        isPositive: mrrMetrics.paymentsPending < 5000,
      },
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'bg-yellow-100 dark:bg-yellow-900/30',
      description: 'Pagamentos a receber (MRR)',
    },
    {
      id: 'pending-freelance',
      title: 'Pendente Freelance',
      value: mrrMetrics.freelanceMetrics.revenuePending || 0,
      unit: 'currency',
      trend: {
        value: mrrMetrics.freelanceMetrics.revenuePending > 0 ? 10 : 0,
        direction: mrrMetrics.freelanceMetrics.revenuePending > 10000 ? 'up' : mrrMetrics.freelanceMetrics.revenuePending > 5000 ? 'stable' : 'down',
        isPositive: mrrMetrics.freelanceMetrics.revenuePending > 0,
      },
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'bg-amber-100 dark:bg-amber-900/30',
      description: 'Projetos ativos a receber',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Visão completa de métricas financeiras, tarefas e produtividade
          </p>
        </div>
        <ExportButton metrics={metrics} />
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          customDateRange={customDateRange}
          onCustomDateRangeChange={setCustomDateRange}
          showCustomDate={true}
        />
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <KPICard key={card.id} data={card} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="mr-2 h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="mr-2 h-4 w-4" />
            Equipe
          </TabsTrigger>
        </TabsList>

        {/* Aba Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueChart data={metrics.financial.revenueByMonth} />
            <TasksDistributionChart data={metrics.tasks.tasksByStatus} />
            <ClientsGrowthChart data={metrics.financial.clientsGrowthByMonth} />
            <ProductivityBarChart
              data={metrics.teamProductivity.productivityByDepartment}
              title="Produtividade por Departamento"
            />
          </div>

          {/* Secao Pipeline de Vendas */}
          {prospectMetrics && (
            <>
              <div className="flex items-center gap-2 mt-6 mb-4">
                <Briefcase className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Pipeline de Vendas</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ProspectsFunnelChart
                  data={prospectMetrics.byStage}
                  title="Funil de Vendas"
                />
                <ProspectsDistributionChart
                  byStage={prospectMetrics.byStage}
                  byPriority={prospectMetrics.byPriority}
                  title="Distribuicao de Prospects"
                />
                <ProspectsTimelineChart
                  prospects={prospects}
                  title="Evolucao do Pipeline"
                />
              </div>
            </>
          )}
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Receita Total
              </div>
              <div className="text-3xl font-bold">
                R$ {(metrics.financial.totalRevenue / 1000).toFixed(1)}k
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Ticket Médio
              </div>
              <div className="text-3xl font-bold">
                R$ {(metrics.financial.avgRevenuePerClient / 1000).toFixed(1)}k
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Faturas Vencidas
              </div>
              <div className="text-3xl font-bold flex items-center gap-2">
                {metrics.financial.overdueInvoices}
                {metrics.financial.overdueInvoices > 0 && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueChart data={metrics.financial.revenueByMonth} variant="line" />
            <ClientsGrowthChart data={metrics.financial.clientsGrowthByMonth} />
          </div>
        </TabsContent>

        {/* Aba Tarefas */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Total
              </div>
              <div className="text-3xl font-bold">{metrics.tasks.totalTasks}</div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Concluídas
              </div>
              <div className="text-3xl font-bold text-green-600">
                {metrics.tasks.completedTasks}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Em Progresso
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {metrics.tasks.inProgressTasks}
              </div>
            </Card>
            <Card className="p-6">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Atrasadas
              </div>
              <div className="text-3xl font-bold text-red-600">
                {metrics.tasks.overdueTasks}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TasksDistributionChart data={metrics.tasks.tasksByStatus} />
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Por Prioridade</h3>
              <div className="space-y-3">
                {Object.entries(metrics.tasks.tasksByPriority).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{priority}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${priority === 'urgent'
                              ? 'bg-red-500'
                              : priority === 'high'
                                ? 'bg-orange-500'
                                : priority === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                          style={{
                            width: `${(count / metrics.tasks.totalTasks) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Equipe */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductivityBarChart
              data={metrics.teamProductivity.productivityByDepartment}
              title="Produtividade por Departamento"
            />
            <ProductivityBarChart
              data={metrics.teamProductivity.productivityByRole}
              title="Produtividade por Cargo"
              variant="role"
            />
          </div>

          <ProductivityRanking
            members={metrics.teamProductivity.topPerformers}
            title="Top 10 Produtividade"
            maxItems={10}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;

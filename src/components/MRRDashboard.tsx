import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, AlertCircle, UserPlus, UserMinus, Zap, Briefcase, CheckCircle, Banknote } from 'lucide-react';
import type { MRRMetrics } from '../types';

interface MRRDashboardProps {
  metrics: MRRMetrics;
}

const MRRDashboard: React.FC<MRRDashboardProps> = ({ metrics }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const dashboardCards = [
    {
      title: 'MRR Total',
      value: formatCurrency(metrics.totalMRR),
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Receita Mensal Recorrente',
    },
    {
      title: 'Clientes Ativos',
      value: metrics.activeClients.toString(),
      icon: Users,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: `${metrics.totalClients} total`,
    },
    {
      title: 'ARR Projetado',
      value: formatCurrency(metrics.projectedAnnualRevenue),
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Receita Anual Projetada',
    },
    {
      title: 'Receita Média',
      value: formatCurrency(metrics.avgRevenuePerClient),
      icon: DollarSign,
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
      description: 'Por cliente ativo',
    },
    {
      title: 'Pagamentos Pendentes',
      value: formatCurrency(metrics.paymentsPending),
      icon: AlertCircle,
      iconColor: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      description: 'A receber',
    },
    {
      title: 'Pagamentos Atrasados',
      value: formatCurrency(metrics.paymentsOverdue),
      icon: AlertCircle,
      iconColor: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Vencidos',
    },
    {
      title: 'Novos este mês',
      value: metrics.newThisMonth.toString(),
      icon: UserPlus,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Clientes adicionados',
    },
    {
      title: 'Churn este mês',
      value: metrics.churnedThisMonth.toString(),
      icon: UserMinus,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'Cancelamentos',
    },
    {
      title: 'ROI Médio',
      value: metrics.avgROI > 0 ? `${metrics.avgROI.toFixed(0)}%` : 'N/A',
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Retorno sobre Investimento',
    },
    {
      title: 'Custo de Aquisição Total',
      value: formatCurrency(metrics.totalAcquisitionCost),
      icon: DollarSign,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'CAC acumulado (tráfego, indicações)',
    },
    {
      title: 'Lucro Real',
      value: formatCurrency(metrics.realProfit),
      icon: Banknote,
      iconColor: 'text-emerald-700',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Receita Total - CAC Total',
    },
  ];

  const freelanceCards = [
    {
      title: 'Receita Recebida',
      value: formatCurrency(metrics.freelanceMetrics.revenuePaid),
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      description: 'Dinheiro em caixa (100% pago)',
    },
    {
      title: 'Receita Pendente',
      value: formatCurrency(metrics.freelanceMetrics.revenuePending),
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      description: 'A receber (projetos ativos)',
    },
    {
      title: 'Projetos Ativos',
      value: metrics.freelanceMetrics.activeFreelance.toString(),
      icon: Briefcase,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Em andamento',
    },
    {
      title: 'Projetos Concluídos',
      value: metrics.freelanceMetrics.completedFreelance.toString(),
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      description: 'Finalizados com sucesso',
    },
    {
      title: 'Valor Médio/Projeto',
      value: formatCurrency(metrics.freelanceMetrics.avgProjectValue),
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      description: 'Ticket médio',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Seção MRR - Clientes Recorrentes */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Dashboard MRR - Clientes Recorrentes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardCards.map((card, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Seção Freelance - Serviços Únicos */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          Dashboard Freelance - Serviços Únicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {freelanceCards.map((card, index) => (
            <Card key={`freelance-${index}`} className="p-6 border-l-4 border-amber-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <h3 className="text-2xl font-bold mt-2">{card.value}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Insights Freelance */}
        <Card className="mt-4 border-l-4 border-l-amber-500">
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Insights - Projetos Freelance
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {metrics.freelanceMetrics.revenuePending > 10000 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : metrics.freelanceMetrics.revenuePending > 5000 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                  Receita Pendente
                </h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.freelanceMetrics.revenuePending > 10000
                    ? `💰 R$ ${metrics.freelanceMetrics.revenuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em projetos ativos! Ótima carteira de clientes.`
                    : metrics.freelanceMetrics.revenuePending > 5000
                    ? `📊 R$ ${metrics.freelanceMetrics.revenuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber. Projetos em andamento moderados.`
                    : metrics.freelanceMetrics.revenuePending > 0
                    ? `⚠️ Apenas R$ ${metrics.freelanceMetrics.revenuePending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes. Considere prospectar novos projetos.`
                    : `💡 Nenhum projeto ativo. Foque em captação de novos clientes freelance.`}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {metrics.freelanceMetrics.activeFreelance > 5 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : metrics.freelanceMetrics.activeFreelance > 2 ? (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  Projetos Ativos
                </h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.freelanceMetrics.activeFreelance > 5
                    ? `🚀 ${metrics.freelanceMetrics.activeFreelance} projetos em andamento! Capacidade bem utilizada.`
                    : metrics.freelanceMetrics.activeFreelance > 2
                    ? `✅ ${metrics.freelanceMetrics.activeFreelance} projetos ativos. Carga de trabalho saudável.`
                    : metrics.freelanceMetrics.activeFreelance > 0
                    ? `⏰ Apenas ${metrics.freelanceMetrics.activeFreelance} projeto(s) ativo(s). Há capacidade para mais.`
                    : `💡 Nenhum projeto ativo. Busque novas oportunidades de serviços únicos.`}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {metrics.freelanceMetrics.avgProjectValue > 5000 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : metrics.freelanceMetrics.avgProjectValue > 2000 ? (
                    <Briefcase className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  Ticket Médio
                </h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.freelanceMetrics.avgProjectValue > 5000
                    ? `💎 R$ ${metrics.freelanceMetrics.avgProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por projeto! Excelente posicionamento de preço.`
                    : metrics.freelanceMetrics.avgProjectValue > 2000
                    ? `📈 R$ ${metrics.freelanceMetrics.avgProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de ticket médio. Valor adequado para freelance.`
                    : metrics.freelanceMetrics.avgProjectValue > 0
                    ? `⚠️ Ticket médio de R$ ${metrics.freelanceMetrics.avgProjectValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Considere aumentar preços ou agregar mais valor.`
                    : `💡 Sem dados de ticket médio. Adicione projetos para análise.`}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {metrics.freelanceMetrics.completedFreelance > 10 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : metrics.freelanceMetrics.completedFreelance > 5 ? (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Briefcase className="h-4 w-4 text-yellow-500" />
                  )}
                  Histórico de Entregas
                </h4>
                <p className="text-sm text-muted-foreground">
                  {metrics.freelanceMetrics.completedFreelance > 10
                    ? `🏆 ${metrics.freelanceMetrics.completedFreelance} projetos concluídos! Portfólio sólido para apresentar a novos clientes.`
                    : metrics.freelanceMetrics.completedFreelance > 5
                    ? `✅ ${metrics.freelanceMetrics.completedFreelance} entregas realizadas. Continue construindo seu histórico.`
                    : metrics.freelanceMetrics.completedFreelance > 0
                    ? `📊 ${metrics.freelanceMetrics.completedFreelance} projeto(s) concluído(s). Invista em cases de sucesso para captação.`
                    : `💡 Nenhum projeto concluído ainda. Primeiros projetos são fundamentais para construir portfólio.`}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MRRDashboard;

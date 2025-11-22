import React from 'react';
import { Card } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, AlertCircle, UserPlus, UserMinus } from 'lucide-react';
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
  ];

  return (
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
  );
};

export default MRRDashboard;

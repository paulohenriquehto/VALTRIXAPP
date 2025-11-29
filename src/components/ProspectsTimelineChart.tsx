import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { Prospect } from '../types/prospects';
import { formatCompactCurrency } from '../types/prospects';

interface ProspectsTimelineChartProps {
  prospects: Prospect[];
  title?: string;
  height?: number;
  months?: number;
}

interface MonthData {
  month: string;
  label: string;
  created: number;
  won: number;
  lost: number;
  totalValue: number;
}

const ProspectsTimelineChart: React.FC<ProspectsTimelineChartProps> = ({
  prospects,
  title = 'Evolucao do Pipeline',
  height = 300,
  months = 6,
}) => {
  const timelineData = useMemo(() => {
    const now = new Date();
    const data: MonthData[] = [];

    // Gerar últimos N meses
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

      data.push({
        month: monthKey,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        created: 0,
        won: 0,
        lost: 0,
        totalValue: 0,
      });
    }

    // Contar prospects por mês
    prospects.forEach((prospect) => {
      const createdDate = new Date(prospect.createdAt);
      const createdMonthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

      const monthData = data.find((d) => d.month === createdMonthKey);
      if (monthData) {
        monthData.created += 1;
        monthData.totalValue += prospect.expectedValue || 0;
      }

      // Contar ganhos
      if (prospect.status === 'won' && prospect.convertedAt) {
        const convertedDate = new Date(prospect.convertedAt);
        const convertedMonthKey = `${convertedDate.getFullYear()}-${String(convertedDate.getMonth() + 1).padStart(2, '0')}`;
        const wonMonthData = data.find((d) => d.month === convertedMonthKey);
        if (wonMonthData) {
          wonMonthData.won += 1;
        }
      }

      // Contar perdidos (usando updatedAt como proxy para data de perda)
      if (prospect.status === 'lost') {
        const lostDate = new Date(prospect.updatedAt);
        const lostMonthKey = `${lostDate.getFullYear()}-${String(lostDate.getMonth() + 1).padStart(2, '0')}`;
        const lostMonthData = data.find((d) => d.month === lostMonthKey);
        if (lostMonthData) {
          lostMonthData.lost += 1;
        }
      }
    });

    return data;
  }, [prospects, months]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
          {payload[0]?.payload?.totalValue > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Valor: {formatCompactCurrency(payload[0].payload.totalValue)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasData = timelineData.some((d) => d.created > 0 || d.won > 0 || d.lost > 0);

  if (!hasData) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado de evolucao disponivel
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={timelineData}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="label"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            stroke="currentColor"
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            stroke="currentColor"
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="created"
            name="Criados"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorCreated)"
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="won"
            name="Ganhos"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#colorWon)"
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="lost"
            name="Perdidos"
            stroke="#EF4444"
            strokeWidth={2}
            fill="url(#colorLost)"
            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ProspectsTimelineChart;

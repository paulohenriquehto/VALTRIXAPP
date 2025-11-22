import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { TrendData } from '../types';
import { formatCurrency } from '../utils/analytics';

interface RevenueChartProps {
  data: TrendData[];
  variant?: 'line' | 'area';
  title?: string;
  height?: number;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  variant = 'area',
  title = 'Receita Mensal',
  height = 300,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.label}</p>
          <p className="text-sm font-semibold" style={{ color: '#00A2FF' }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;
  const DataComponent = variant === 'area' ? Area : Line;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00A2FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00A2FF" stopOpacity={0} />
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
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <DataComponent
            type="monotone"
            dataKey="value"
            name="Receita"
            stroke="#00A2FF"
            strokeWidth={2}
            fill={variant === 'area' ? 'url(#colorRevenue)' : undefined}
            dot={{ fill: '#00A2FF', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#00A2FF' }}
          />
        </ChartComponent>
      </ResponsiveContainer>
    </Card>
  );
};

export default RevenueChart;

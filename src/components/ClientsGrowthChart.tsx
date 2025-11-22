import React from 'react';
import {
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

interface ClientsGrowthChartProps {
  data: TrendData[];
  title?: string;
  height?: number;
}

const ClientsGrowthChart: React.FC<ClientsGrowthChartProps> = ({
  data,
  title = 'Crescimento de Clientes',
  height = 300,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.label}</p>
          <p className="text-sm font-semibold" style={{ color: '#CBA35C' }}>
            {payload[0].value} novos clientes
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#CBA35C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#CBA35C" stopOpacity={0} />
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
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="value"
            name="Novos Clientes"
            stroke="#CBA35C"
            strokeWidth={2}
            fill="url(#colorClients)"
            dot={{ fill: '#CBA35C', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#CBA35C' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ClientsGrowthChart;

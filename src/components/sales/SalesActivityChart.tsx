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
import type { SalesChartData } from '@/types/sales';

interface SalesActivityChartProps {
  data: SalesChartData[];
}

export const SalesActivityChart: React.FC<SalesActivityChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  // Get last 14 days for better visualization
  const chartData = data.slice(-14).map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 backdrop-blur-sm p-3 border rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-semibold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate totals
  const totalContacts = chartData.reduce((sum, d) => sum + d.contacts, 0);
  const totalCalls = chartData.reduce((sum, d) => sum + d.calls, 0);
  const totalMeetings = chartData.reduce((sum, d) => sum + d.meetings, 0);

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            className="fill-muted-foreground"
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="contacts"
            name="Contatos"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorContacts)"
          />
          <Area
            type="monotone"
            dataKey="calls"
            name="Ligacoes"
            stroke="#22C55E"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCalls)"
          />
          <Area
            type="monotone"
            dataKey="meetings"
            name="Reunioes"
            stroke="#A855F7"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorMeetings)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-500">{totalContacts}</p>
          <p className="text-xs text-muted-foreground">Total Contatos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{totalCalls}</p>
          <p className="text-xs text-muted-foreground">Total Ligacoes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-500">{totalMeetings}</p>
          <p className="text-xs text-muted-foreground">Total Reunioes</p>
        </div>
      </div>
    </div>
  );
};

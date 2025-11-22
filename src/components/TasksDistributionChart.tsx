import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';

interface TasksDistributionChartProps {
  data: {
    pending: number;
    in_progress: number;
    completed: number;
    archived: number;
  };
  title?: string;
  height?: number;
}

const COLORS = {
  pending: '#CBA35C', // Valtrix Gold
  in_progress: '#00A2FF', // Neon Blue Pulse
  completed: '#10b981', // Green (sucesso)
  archived: '#6b7280', // Gray
};

const LABELS = {
  pending: 'Pendentes',
  in_progress: 'Em Progresso',
  completed: 'Concluídas',
  archived: 'Arquivadas',
};

const TasksDistributionChart: React.FC<TasksDistributionChartProps> = ({
  data,
  title = 'Distribuição de Tarefas',
  height = 300,
}) => {
  const chartData = Object.entries(data).map(([key, value]) => ({
    name: LABELS[key as keyof typeof LABELS],
    value,
    color: COLORS[key as keyof typeof COLORS],
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{data.name}</p>
          <p className="text-sm font-semibold" style={{ color: data.payload.color }}>
            {data.value} tarefas
          </p>
          <p className="text-xs text-muted-foreground">
            {((data.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / chartData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0);
    return `${percent}%`;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default TasksDistributionChart;

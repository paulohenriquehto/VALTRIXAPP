import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';

interface ProductivityData {
  department?: string;
  role?: string;
  label: string;
  members: number;
  tasksCompleted: number;
  avgScore: number;
}

interface ProductivityBarChartProps {
  data: ProductivityData[];
  title?: string;
  height?: number;
  variant?: 'department' | 'role';
}

const ProductivityBarChart: React.FC<ProductivityBarChartProps> = ({
  data,
  title = 'Produtividade por Departamento',
  height = 300,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium mb-1">{data.label}</p>
          <p className="text-sm text-muted-foreground">Membros: {data.members}</p>
          <p className="text-sm text-muted-foreground">Tarefas: {data.tasksCompleted}</p>
          <p className="text-sm font-semibold" style={{ color: '#00A2FF' }}>
            Score: {data.avgScore}
          </p>
        </div>
      );
    }
    return null;
  };

  // Cores gradientes baseadas no score - Paleta VALTRIXAPP
  const getColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green (mantido para sucesso)
    if (score >= 60) return '#00A2FF'; // Neon Blue Pulse
    if (score >= 40) return '#CBA35C'; // Valtrix Gold
    return '#ef4444'; // Red (mantido para alerta)
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="label"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            stroke="currentColor"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            stroke="currentColor"
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="avgScore" name="Score Médio" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry.avgScore)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ProductivityBarChart;

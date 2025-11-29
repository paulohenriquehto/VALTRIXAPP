import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChartIcon, BarChart3 } from 'lucide-react';
import type { StageMetrics, ProspectPriority } from '../types/prospects';
import { PriorityLabels, formatCompactCurrency } from '../types/prospects';

interface ProspectsDistributionChartProps {
  byStage: StageMetrics[];
  byPriority: Record<ProspectPriority, number>;
  title?: string;
  height?: number;
}

const PRIORITY_COLORS: Record<ProspectPriority, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  urgent: '#EF4444',
};

type ViewMode = 'stage' | 'priority';
type ChartType = 'pie' | 'bar';

const ProspectsDistributionChart: React.FC<ProspectsDistributionChartProps> = ({
  byStage,
  byPriority,
  title = 'Distribuicao de Prospects',
  height = 300,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('stage');
  const [chartType, setChartType] = useState<ChartType>('pie');

  // Preparar dados por stage
  const stageData = byStage
    .sort((a, b) => a.position - b.position)
    .map((stage) => ({
      name: stage.stageName,
      value: stage.prospectCount,
      totalValue: stage.totalValue,
      color: stage.color,
    }));

  // Preparar dados por prioridade
  const priorityData = Object.entries(byPriority).map(([key, value]) => ({
    name: PriorityLabels[key as ProspectPriority],
    value,
    color: PRIORITY_COLORS[key as ProspectPriority],
  }));

  const chartData = viewMode === 'stage' ? stageData : priorityData;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = chartData.reduce((sum, d) => sum + d.value, 0);
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{data.value}</span> prospects ({percent}%)
          </p>
          {data.totalValue !== undefined && (
            <p className="text-xs text-muted-foreground">
              {formatCompactCurrency(data.totalValue)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const total = chartData.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return '';
    const percent = ((entry.value / total) * 100).toFixed(0);
    return entry.value > 0 ? `${percent}%` : '';
  };

  if (chartData.every((d) => d.value === 0)) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum prospect cadastrado
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex gap-2">
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'stage' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('stage')}
              className="h-7 text-xs"
            >
              Por Stage
            </Button>
            <Button
              variant={viewMode === 'priority' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('priority')}
              className="h-7 text-xs"
            >
              Por Prioridade
            </Button>
          </div>
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <Button
              variant={chartType === 'pie' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setChartType('pie')}
              className="h-7 px-2"
            >
              <PieChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="h-7 px-2"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'pie' ? (
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
        ) : (
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};

export default ProspectsDistributionChart;

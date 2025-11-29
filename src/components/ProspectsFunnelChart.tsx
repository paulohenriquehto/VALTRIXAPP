import React from 'react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import type { StageMetrics } from '../types/prospects';
import { formatCompactCurrency } from '../types/prospects';

interface ProspectsFunnelChartProps {
  data: StageMetrics[];
  title?: string;
  height?: number;
  showValue?: boolean;
}

const ProspectsFunnelChart: React.FC<ProspectsFunnelChartProps> = ({
  data,
  title = 'Funil de Vendas',
  height = 300,
  showValue = true,
}) => {
  // Ordenar por posição do stage
  const sortedData = [...data].sort((a, b) => a.position - b.position);

  // Preparar dados para o funil
  const funnelData = sortedData.map((stage) => ({
    name: stage.stageName,
    value: stage.prospectCount,
    totalValue: stage.totalValue,
    weightedValue: stage.weightedValue,
    color: stage.color,
    fill: stage.color,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-valtrix-steel p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {data.name}
          </p>
          <p className="text-sm">
            <span className="font-semibold">{data.value}</span> prospects
          </p>
          {showValue && (
            <>
              <p className="text-sm text-muted-foreground">
                Total: {formatCompactCurrency(data.totalValue)}
              </p>
              <p className="text-sm text-muted-foreground">
                Ponderado: {formatCompactCurrency(data.weightedValue)}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  if (funnelData.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Nenhum dado de pipeline disponível
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <FunnelChart>
          <Tooltip content={<CustomTooltip />} />
          <Funnel
            dataKey="value"
            data={funnelData}
            isAnimationActive
          >
            {funnelData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              position="right"
              fill="#888"
              stroke="none"
              dataKey="name"
              className="text-xs"
            />
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              dataKey="value"
              className="text-sm font-bold"
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default ProspectsFunnelChart;

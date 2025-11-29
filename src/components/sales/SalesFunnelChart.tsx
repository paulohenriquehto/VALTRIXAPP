import React from 'react';
import type { SalesFunnelStage } from '@/types/sales';

interface SalesFunnelChartProps {
  data: SalesFunnelStage[];
}

export const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const width = 1000;
  const height = 280;
  const padding = 40;
  const labelHeight = 30;
  const valueHeight = 30;
  const funnelHeight = height - labelHeight - valueHeight - padding;

  // Encontrar valor maximo para escala
  const maxValue = Math.max(...data.map(d => d.count), 1);

  // Calcular largura de cada secao
  const sectionWidth = (width - padding * 2) / data.length;

  // Calcular alturas baseadas nos valores
  const getHeight = (value: number) => {
    // Minimo de 30px, maximo de funnelHeight
    return Math.max((value / maxValue) * funnelHeight, 30);
  };

  // Gerar path SVG com curvas bezier
  const generatePath = () => {
    const points: { x: number; topY: number; bottomY: number }[] = [];
    const centerY = labelHeight + funnelHeight / 2;

    data.forEach((stage, i) => {
      const x = padding + i * sectionWidth + sectionWidth / 2;
      const h = getHeight(stage.count);
      points.push({
        x,
        topY: centerY - h / 2,
        bottomY: centerY + h / 2,
      });
    });

    if (points.length === 0) return '';

    // Inicio do path (borda esquerda da primeira secao)
    const startX = padding;
    const firstPoint = points[0];

    // Path superior (esquerda para direita)
    let pathTop = `M${startX},${firstPoint.topY}`;

    for (let i = 0; i < points.length; i++) {
      const curr = points[i];
      const next = points[i + 1];

      if (next) {
        // Curva bezier para o proximo ponto
        const cp1X = curr.x + sectionWidth * 0.3;
        const cp2X = next.x - sectionWidth * 0.3;
        pathTop += ` C${cp1X},${curr.topY} ${cp2X},${next.topY} ${next.x},${next.topY}`;
      } else {
        // Ultimo ponto - linha reta ate a borda direita
        pathTop += ` L${width - padding},${curr.topY}`;
      }
    }

    // Path inferior (direita para esquerda)
    const lastPoint = points[points.length - 1];
    let pathBottom = ` L${width - padding},${lastPoint.bottomY}`;

    for (let i = points.length - 1; i >= 0; i--) {
      const curr = points[i];
      const prev = points[i - 1];

      if (prev) {
        // Curva bezier para o ponto anterior
        const cp1X = curr.x - sectionWidth * 0.3;
        const cp2X = prev.x + sectionWidth * 0.3;
        pathBottom += ` C${cp1X},${curr.bottomY} ${cp2X},${prev.bottomY} ${prev.x},${prev.bottomY}`;
      } else {
        // Primeiro ponto - linha reta ate a borda esquerda
        pathBottom += ` L${startX},${curr.bottomY}`;
      }
    }

    return pathTop + pathBottom + ' Z';
  };

  // Conversao geral
  const overallConversion = data[0]?.count > 0
    ? ((data[data.length - 1]?.count || 0) / data[0].count * 100).toFixed(1)
    : '0';

  const centerY = labelHeight + funnelHeight / 2;

  return (
    <div className="space-y-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#005AE3" />
            <stop offset="100%" stopColor="#BA2C73" />
          </linearGradient>
        </defs>

        {/* Funil */}
        <path
          d={generatePath()}
          fill="url(#funnelGradient)"
          opacity={0.95}
        />

        {/* Labels e valores */}
        {data.map((stage, i) => {
          const x = padding + i * sectionWidth + sectionWidth / 2;

          return (
            <g key={stage.stage}>
              {/* Nome da etapa (topo) */}
              <text
                x={x}
                y={16}
                textAnchor="middle"
                fill="currentColor"
                className="fill-muted-foreground"
                fontSize="13"
                fontWeight="500"
              >
                {stage.label}
              </text>

              {/* Percentual (centro) */}
              <text
                x={x}
                y={centerY + 6}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="16"
                fontWeight="700"
              >
                {stage.conversion_rate}%
              </text>

              {/* Valor absoluto (baixo) */}
              <text
                x={x}
                y={height - 8}
                textAnchor="middle"
                fill="currentColor"
                className="fill-muted-foreground"
                fontSize="14"
              >
                {stage.count}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Conversao geral */}
      <div className="pt-2 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Conversao Geral</span>
          <span className="text-lg font-bold">{overallConversion}%</span>
        </div>
      </div>
    </div>
  );
};

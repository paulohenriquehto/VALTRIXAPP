import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KPICardData } from '../types';
import { formatCurrency, formatPercent, formatNumber, formatTime } from '../utils/analytics';

interface KPICardProps {
  data: KPICardData;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ data, className }) => {
  const { title, value, unit, trend, icon, color, description } = data;

  // Formata o valor baseado na unidade
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;

    switch (unit) {
      case 'currency':
        return formatCurrency(val);
      case 'percent':
        return formatPercent(val);
      case 'time':
        return formatTime(val);
      case 'number':
      default:
        return formatNumber(val);
    }
  };

  // Ícone e cor da tendência
  const getTrendIcon = () => {
    if (!trend) return null;

    const iconClass = 'h-4 w-4';

    switch (trend.direction) {
      case 'up':
        return <ArrowUp className={iconClass} />;
      case 'down':
        return <ArrowDown className={iconClass} />;
      case 'stable':
      default:
        return <Minus className={iconClass} />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';

    if (trend.direction === 'stable') {
      return 'text-gray-500 dark:text-gray-400';
    }

    return trend.isPositive
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  // Cor do ícone principal
  const iconColor = color || 'bg-blue-100 dark:bg-blue-900/30';
  const iconTextColor = color?.replace('bg-', 'text-').replace('100', '600').replace('900/30', '400') || 'text-blue-600 dark:text-blue-400';

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">{formatValue(value)}</h3>
          </div>

          {/* Tendência */}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{formatPercent(trend.value, 1)}</span>
              <span className="text-xs text-muted-foreground ml-1">vs período anterior</span>
            </div>
          )}

          {/* Descrição */}
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>

        {/* Ícone */}
        {icon && (
          <div className={cn('p-3 rounded-lg', iconColor)}>
            <div className={iconTextColor}>{icon}</div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KPICard;

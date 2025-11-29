import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';
import type { GoalStatus } from '@/types/goals';

interface ColoredProgressProps
  extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  value: number;
  status: GoalStatus;
}

const statusColors: Record<GoalStatus, string> = {
  behind: 'bg-red-500',
  on_track: 'bg-yellow-500',
  ahead: 'bg-green-500',
  achieved: 'bg-emerald-500',
};

const statusBgColors: Record<GoalStatus, string> = {
  behind: 'bg-red-100',
  on_track: 'bg-yellow-100',
  ahead: 'bg-green-100',
  achieved: 'bg-emerald-100',
};

export function ColoredProgress({
  className,
  value,
  status,
  ...props
}: ColoredProgressProps) {
  // Cap value at 100 for display, but allow status to be 'achieved'
  const displayValue = Math.min(value, 100);

  return (
    <ProgressPrimitive.Root
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full',
        statusBgColors[status],
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 transition-all duration-500 ease-out',
          statusColors[status]
        )}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

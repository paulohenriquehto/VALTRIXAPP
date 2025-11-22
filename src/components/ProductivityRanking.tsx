import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemberProductivity } from '../types';
import { formatPercent } from '../utils/analytics';

interface ProductivityRankingProps {
  members: MemberProductivity[];
  title?: string;
  maxItems?: number;
  variant?: 'top' | 'all';
}

const ProductivityRanking: React.FC<ProductivityRankingProps> = ({
  members,
  title = 'Ranking de Produtividade',
  maxItems = 10,
}) => {
  const displayMembers = members.slice(0, maxItems);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 40)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </div>

      <div className="space-y-3">
        {displayMembers.map((member) => (
          <div
            key={member.memberId}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border',
              member.rank <= 3 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8">
              {member.rank <= 3 ? (
                <Trophy className={cn('h-5 w-5', getRankColor(member.rank))} />
              ) : (
                <span className="text-sm font-semibold text-muted-foreground">
                  #{member.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatarUrl} alt={member.memberName} />
              <AvatarFallback>{getInitials(member.memberName)}</AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{member.memberName}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground">{member.tasksCompleted} tarefas</p>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-muted-foreground">
                  {formatPercent(member.completionRate, 0)} concluídas
                </p>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2">
              <Badge className={getScoreColor(member.productivityScore)}>
                {member.productivityScore}
              </Badge>

              {/* Performance vs Average */}
              {member.performanceVsAvg !== 0 && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    member.performanceVsAvg > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {member.performanceVsAvg > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercent(Math.abs(member.performanceVsAvg), 0)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {displayMembers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhum membro para exibir</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductivityRanking;

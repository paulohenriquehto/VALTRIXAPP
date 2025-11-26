import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { useAIChat } from '@/stores/aiChatStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function AIDashboardWidget() {
  const {
    dailyBriefing,
    insights,
    unreadInsights,
    loadDailyBriefing,
    loadInsights,
    toggleOpen,
    markInsightAsRead,
  } = useAIChat();

  useEffect(() => {
    loadDailyBriefing();
    loadInsights();
  }, [loadDailyBriefing, loadInsights]);

  // Prioridade do insight
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alta
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Média
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Baixa
          </Badge>
        );
    }
  };

  // Loading state
  if (!dailyBriefing && insights.length === 0) {
    return (
      <Card className="border-l-4 border-l-amber-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-blue-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            AI Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-blue-500">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <span>AI Manager</span>
            {unreadInsights > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {unreadInsights} novo{unreadInsights > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardTitle>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              loadDailyBriefing();
              loadInsights();
            }}
            title="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleOpen}>
            Ver mais <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Briefing Diário */}
        {dailyBriefing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Resumo do Dia
              </h4>
              {getPriorityBadge(dailyBriefing.priority)}
            </div>
            <div className="text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="mb-1.5 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-1.5 space-y-0.5">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                }}
              >
                {dailyBriefing.content.length > 300
                  ? dailyBriefing.content.substring(0, 300) + '...'
                  : dailyBriefing.content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* Insights recentes */}
        {insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              Insights Recentes
            </h4>
            <div className="space-y-2">
              {insights.slice(0, 3).map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'p-2.5 rounded-lg border transition-colors cursor-pointer',
                    !insight.isRead
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                      : 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    if (!insight.isRead) {
                      markInsightAsRead(insight.id);
                    }
                    toggleOpen();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-2">{insight.content}</p>
                    {!insight.isRead && (
                      <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getPriorityBadge(insight.priority)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(insight.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!dailyBriefing && insights.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum insight disponível ainda.</p>
            <p className="text-xs mt-1">
              O AI está analisando seus dados para gerar recomendações.
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={toggleOpen}
          >
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Abrir Chat
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={() => {
              toggleOpen();
              // Depois de abrir, o usuário pode pedir análise
            }}
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Pedir Análise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

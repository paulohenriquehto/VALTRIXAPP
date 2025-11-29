import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/appStore';
import { useSalesStore } from '@/stores/salesStore';
import { aiManagerService } from '@/services/aiManagerService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  Flame,
  Lightbulb,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const SalesCoachTab: React.FC = () => {
  const { user } = useAuth();
  const { summary, streaks, gamification, todayActivity, activeGoal } = useSalesStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingContentRef = useRef('');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Initial greeting message
  useEffect(() => {
    const prospectingStreak = streaks.find(s => s.streak_type === 'daily_prospecting');
    const currentStreak = prospectingStreak?.current_count || 0;

    let greeting = 'Ola! Sou seu Coach de Vendas da ValtrixApp. ';

    if (currentStreak > 0) {
      greeting += `Voce esta em um streak de ${currentStreak} dias! `;
    }

    if (todayActivity) {
      const totalToday = (todayActivity.contacts_sent || 0) + (todayActivity.calls_made || 0);
      if (totalToday > 0) {
        greeting += `Hoje voce ja fez ${totalToday} atividades de prospeccao. Otimo trabalho! `;
      } else {
        greeting += 'Ainda nao registrou atividades hoje. Que tal comecar agora? ';
      }
    }

    greeting += '\n\nComo posso ajudar voce hoje?';

    setMessages([{
      id: '1',
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }]);
  }, [streaks, todayActivity]);

  const handleSend = useCallback(async (quickQuery?: string) => {
    const query = quickQuery || input.trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = query;
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    streamingContentRef.current = '';

    // Build system prompt with sales context
    const prospectingStreak = streaks.find(s => s.streak_type === 'daily_prospecting');
    const systemPrompt = `Voce e um coach de vendas especializado em prospeccao B2B da ValtrixApp.

Contexto do usuario:
- Streak atual: ${prospectingStreak?.current_count || 0} dias consecutivos
- Contatos hoje: ${todayActivity?.contacts_sent || 0}
- Ligacoes hoje: ${todayActivity?.calls_made || 0}
- Reunioes hoje: ${todayActivity?.meetings_held || 0}
- Propostas hoje: ${todayActivity?.proposals_sent || 0}
${summary ? `
Resumo dos ultimos ${summary.period}:
- Total de contatos: ${summary.totals.contacts}
- Total de ligacoes: ${summary.totals.calls}
- Total de reunioes: ${summary.totals.meetings}
- Deals fechados: ${summary.totals.deals}
- Taxa de conversao: ${summary.averages.conversion_rate}%
` : ''}
${activeGoal ? `
Meta ativa:
- Contatos/dia: ${activeGoal.contacts_target}
- Ligacoes/dia: ${activeGoal.calls_target}
- Reunioes/semana: ${activeGoal.meetings_target}
` : ''}
${gamification ? `
Nivel: ${gamification.current_level} | XP: ${gamification.xp_current}/${gamification.xp_to_next_level}
` : ''}

Seja motivador, direto e baseie suas sugestoes em dados.
Responda sempre em portugues brasileiro.
Foque em acoes praticas e resultados mensuraveis.`;

    // Build messages array for API
    const messagesToSend = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.filter(m => m.role !== 'assistant' || !m.content.startsWith('Ola!')).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: messageContent },
    ];

    try {
      await aiManagerService.streamChat(messagesToSend, {
        onContent: (chunk) => {
          streamingContentRef.current += chunk;
          setStreamingContent(streamingContentRef.current);
        },
        onDone: () => {
          const finalContent = streamingContentRef.current;
          if (finalContent) {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: finalContent,
              timestamp: new Date(),
            }]);
          }
          setStreamingContent('');
          streamingContentRef.current = '';
          setIsLoading(false);
          inputRef.current?.focus();
        },
        onError: (error) => {
          console.error('Error calling AI:', error);
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em alguns instantes.',
            timestamp: new Date(),
          }]);
          setStreamingContent('');
          streamingContentRef.current = '';
          setIsLoading(false);
          inputRef.current?.focus();
        },
        onToolResult: () => {}, // Coach nao usa tools
      });
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro inesperado. Tente novamente.',
        timestamp: new Date(),
      }]);
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages, streaks, todayActivity, summary, activeGoal, gamification]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  // Quick action suggestions
  const quickActions = [
    { label: 'Minhas metas', icon: Target, query: 'Quais sao minhas metas de vendas?' },
    { label: 'Como estou indo?', icon: TrendingUp, query: 'Como esta minha performance de vendas?' },
    { label: 'Meu streak', icon: Flame, query: 'Como esta meu streak de prospeccao?' },
    { label: 'Dicas do dia', icon: Lightbulb, query: 'Me da dicas para melhorar minha prospeccao hoje' },
  ];

  return (
    <div className="space-y-4">
      {/* Chat Header */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Coach de Vendas IA
            </CardTitle>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by AI
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => handleQuickAction(action.query)}
            disabled={isLoading}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Chat Messages */}
      <Card className="h-[400px] flex flex-col overflow-hidden">
        <div
          className="flex-1 p-4 overflow-y-auto custom-scrollbar"
          ref={scrollRef}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 min-w-0 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 overflow-hidden ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">{message.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {message.timestamp.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 min-w-0">
                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3 max-w-[80%] overflow-hidden">
                  {streamingContent ? (
                    <p className="text-sm whitespace-pre-wrap break-words overflow-hidden">{streamingContent}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Input Area - Fora do Card */}
      <Card>
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Context Info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            O Coach de Vendas tem acesso aos seus dados de prospeccao, metas e conquistas
            para fornecer orientacoes personalizadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

import { useRef, useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  Send,
  User,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  MessageSquarePlus,
  X,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAIChat } from '@/stores/aiChatStore';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function AIChatDialog() {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');

  const {
    messages,
    isLoading,
    isOpen,
    error,
    streamingContent,
    toggleOpen,
    sendMessage,
    clearMessages,
    clearError,
    startNewConversation,
  } = useAIChat();

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Focus no input quando abrir
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sugestões rápidas
  const quickSuggestions = [
    { label: 'Resumo do dia', message: 'Me dê um resumo do meu dia: tarefas, clientes e métricas importantes.' },
    { label: 'Tarefas atrasadas', message: 'Quais tarefas estão atrasadas? O que preciso priorizar?' },
    { label: 'Fluxo de caixa', message: 'Como está meu fluxo de caixa hoje? Algum pagamento pendente?' },
    { label: 'Criar tarefa', message: 'Preciso criar uma nova tarefa para...' },
  ];

  const ChatContent = (
    <div className="flex flex-col h-full">
      {/* Área de Mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'flex-row-reverse' : ''
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback
                  className={cn(
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-amber-500 to-blue-500 text-white'
                      : 'bg-primary text-primary-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <Sparkles className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  'max-w-[85%] p-3 rounded-2xl',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-tr-md'
                    : 'bg-muted rounded-tl-md'
                )}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="mb-2 last:mb-0">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-4 mb-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-4 mb-2">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        code: ({ children }) => (
                          <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Streaming content */}
          {isLoading && streamingContent && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-blue-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[85%] p-3 rounded-2xl bg-muted rounded-tl-md">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingContent && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-blue-500 text-white">
                  <Sparkles className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 p-3">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Sugestões rápidas (apenas se não há mensagens além da welcome) */}
        {messages.length === 1 && messages[0].id === 'welcome' && (
          <div className="mt-6 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              Sugestões rápidas:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => {
                    setInput(suggestion.message);
                    textareaRef.current?.focus();
                  }}
                >
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Erro */}
      {error && (
        <Alert variant="destructive" className="mx-4 mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const HeaderContent = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-blue-500">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="font-semibold">Valtrix AI</h2>
          <p className="text-xs text-muted-foreground">Seu gerente virtual</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={startNewConversation}
          title="Nova conversa"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={clearMessages}
          title="Limpar mensagens"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Mobile: Sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={toggleOpen}>
        <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle asChild>{HeaderContent}</SheetTitle>
          </SheetHeader>
          {ChatContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={isOpen} onOpenChange={toggleOpen}>
      <DialogContent className="sm:max-w-lg h-[600px] max-h-[80vh] p-0 flex flex-col gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle asChild>{HeaderContent}</DialogTitle>
        </DialogHeader>
        {ChatContent}
      </DialogContent>
    </Dialog>
  );
}

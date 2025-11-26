import { Sparkles } from 'lucide-react';
import { DockIcon } from '@/components/ui/dock';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAIChat } from '@/stores/aiChatStore';
import { cn } from '@/lib/utils';

export function AIDockButton() {
  const { toggleOpen, unreadInsights, isOpen } = useAIChat();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={toggleOpen} className="relative">
            <DockIcon
              isActive={isOpen}
              className={cn(
                'relative group',
                isOpen && 'bg-gradient-to-br from-amber-500/20 to-blue-500/20'
              )}
            >
              <Sparkles
                className={cn(
                  'w-5 h-5 transition-all',
                  isOpen && 'scale-110 text-amber-500'
                )}
              />
              {/* Indicador de insights não lidos */}
              {unreadInsights > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                </span>
              )}
            </DockIcon>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          <p className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            AI Manager
            {unreadInsights > 0 && (
              <span className="ml-1 text-xs text-amber-500">
                ({unreadInsights} novos)
              </span>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

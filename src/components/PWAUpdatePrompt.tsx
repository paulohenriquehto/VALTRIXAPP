import React, { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X, Wifi, WifiOff } from 'lucide-react';

export const PWAUpdatePrompt: React.FC = () => {
  const { isUpdateAvailable, isOfflineReady, isOnline, update, dismissUpdate } = usePWA();
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);

  // Show offline notice when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      const timer = setTimeout(() => setShowOfflineNotice(false), 5000);
      return () => clearTimeout(timer);
    } else {
      // Show online notice when coming back online
      if (showOfflineNotice) {
        setShowOnlineNotice(true);
        const timer = setTimeout(() => setShowOnlineNotice(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnline, showOfflineNotice]);

  // Show offline ready notice once
  useEffect(() => {
    if (isOfflineReady) {
      const hasSeenNotice = localStorage.getItem('pwa-offline-ready-seen');
      if (!hasSeenNotice) {
        const timer = setTimeout(() => {
          localStorage.setItem('pwa-offline-ready-seen', 'true');
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [isOfflineReady]);

  if (!isUpdateAvailable && !showOfflineNotice && !showOnlineNotice && !isOfflineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Update Available Notice */}
      {isUpdateAvailable && (
        <Card className="p-4 shadow-lg border-primary/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-sm">Atualização Disponível</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Uma nova versão do VALTRIXAPP está disponível.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={update} className="h-8 text-xs">
                  Atualizar Agora
                </Button>
                <Button size="sm" variant="ghost" onClick={dismissUpdate} className="h-8 text-xs">
                  Mais Tarde
                </Button>
              </div>
            </div>
            <button
              onClick={dismissUpdate}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Offline Ready Notice */}
      {isOfflineReady && !localStorage.getItem('pwa-offline-ready-seen') && (
        <Card className="p-4 shadow-lg border-green-500/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <Wifi className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Pronto para Offline</h3>
              <p className="text-xs text-muted-foreground mt-1">
                O app está pronto para funcionar sem conexão.
              </p>
            </div>
            <button
              onClick={() => localStorage.setItem('pwa-offline-ready-seen', 'true')}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Offline Notice */}
      {showOfflineNotice && (
        <Card className="p-4 shadow-lg border-orange-500/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-orange-500/10">
              <WifiOff className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Modo Offline</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Você está sem conexão. Algumas funcionalidades podem estar limitadas.
              </p>
            </div>
            <button
              onClick={() => setShowOfflineNotice(false)}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Online Notice */}
      {showOnlineNotice && (
        <Card className="p-4 shadow-lg border-green-500/50 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-green-500/10">
              <Wifi className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">Conexão Restaurada</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Você está online novamente.
              </p>
            </div>
            <button
              onClick={() => setShowOnlineNotice(false)}
              className="p-1 hover:bg-accent rounded-sm transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};

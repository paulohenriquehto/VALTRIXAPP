import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
  isOnline: boolean;
  updateSW: (() => Promise<void>) | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isUpdateAvailable: false,
    isOfflineReady: false,
    isOnline: navigator.onLine,
    updateSW: null,
  });

  useEffect(() => {
    // Listen for PWA update available event
    const handleUpdateAvailable = (event: Event) => {
      const customEvent = event as CustomEvent;
      setState(prev => ({
        ...prev,
        isUpdateAvailable: true,
        updateSW: customEvent.detail.updateSW,
      }));
    };

    // Listen for PWA offline ready event
    const handleOfflineReady = () => {
      setState(prev => ({
        ...prev,
        isOfflineReady: true,
      }));
    };

    // Listen for online/offline status changes
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-offline-ready', handleOfflineReady);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-offline-ready', handleOfflineReady);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const update = useCallback(async () => {
    if (state.updateSW) {
      await state.updateSW();
      setState(prev => ({
        ...prev,
        isUpdateAvailable: false,
        updateSW: null,
      }));
    }
  }, [state.updateSW]);

  const dismissUpdate = useCallback(() => {
    setState(prev => ({
      ...prev,
      isUpdateAvailable: false,
      updateSW: null,
    }));
  }, []);

  return {
    ...state,
    update,
    dismissUpdate,
  };
}

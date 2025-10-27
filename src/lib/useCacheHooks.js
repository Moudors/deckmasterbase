// Hook React para monitorar e gerenciar cache
import { useState, useEffect } from 'react';

export function useCacheStatus() {
  const [status, setStatus] = useState({
    storageUsed: 0,
    storageQuota: 0,
    percentUsed: 0,
    warning: false,
    pendingSync: 0,
    reactQueryQueries: 0,
  });

  useEffect(() => {
    const updateStatus = async () => {
      try {
        // Verifica uso de storage
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          const usage = estimate.usage || 0;
          const quota = estimate.quota || 0;
          const percentUsed = ((usage / quota) * 100).toFixed(2);

          // Conta queries do React Query
          let queryCount = 0;
          if (window.queryClient) {
            const queryCache = window.queryClient.getQueryCache();
            queryCount = queryCache.getAll().length;
          }

          // Conta operações pendentes
          let pendingCount = 0;
          if (window.offlineSyncManager) {
            pendingCount = window.offlineSyncManager.getPendingCount();
          }

          setStatus({
            storageUsed: usage,
            storageQuota: quota,
            percentUsed: parseFloat(percentUsed),
            warning: parseFloat(percentUsed) > 80,
            pendingSync: pendingCount,
            reactQueryQueries: queryCount,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status do cache:', error);
      }
    };

    // Atualiza imediatamente
    updateStatus();

    // Atualiza a cada 30 segundos
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

// Hook para forçar limpeza de cache
export function useCacheClear() {
  const [isClearing, setIsClearing] = useState(false);

  const clearCache = async () => {
    setIsClearing(true);
    try {
      if (window.cacheManager) {
        await window.cacheManager.forceClean();
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return { clearCache, isClearing };
}

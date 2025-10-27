// Componente de debug para monitorar cache e storage
import React, { useState } from 'react';
import { useCacheStatus, useCacheClear } from '../../lib/useCacheHooks';

export function CacheDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const status = useCacheStatus();
  const { clearCache, isClearing } = useCacheClear();

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm z-50"
        title="Abrir painel de debug do cache"
      >
        <span className="flex items-center gap-2">
          <span>📊</span>
          {status.warning && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-2xl max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Cache & Storage</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Storage Usage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-gray-300">Storage:</span>
            <span className="font-mono">
              {formatBytes(status.storageUsed)} / {formatBytes(status.storageQuota)}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all ${
                status.warning ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(status.percentUsed, 100)}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">
            {status.percentUsed.toFixed(1)}% usado
          </div>
          {status.warning && (
            <div className="text-red-400 text-xs mt-1">
              ⚠️ Storage quase cheio!
            </div>
          )}
        </div>

        {/* React Query Queries */}
        <div className="flex justify-between border-t border-gray-700 pt-2">
          <span className="text-gray-300">Queries em cache:</span>
          <span className="font-mono">{status.reactQueryQueries}</span>
        </div>

        {/* Pending Sync */}
        <div className="flex justify-between">
          <span className="text-gray-300">Operações pendentes:</span>
          <span className="font-mono">
            {status.pendingSync}
            {status.pendingSync > 0 && (
              <span className="ml-2 text-yellow-400">⏳</span>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-700 pt-3 space-y-2">
          <button
            onClick={async () => {
              if (window.cacheManager) {
                const info = await window.cacheManager.checkUsage();
                console.log('📊 Storage Usage:', info);
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded transition-colors"
          >
            🔍 Log Status Detalhado
          </button>

          <button
            onClick={clearCache}
            disabled={isClearing}
            className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? '🧹 Limpando...' : '🧹 Limpar Cache'}
          </button>

          <button
            onClick={() => {
              if (window.offlineSyncManager) {
                window.offlineSyncManager.logQueueInfo();
              }
            }}
            className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded transition-colors"
          >
            📦 Ver Fila Offline
          </button>
        </div>

        <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
          💡 Dica: Use o console do navegador (F12) para mais detalhes
        </div>
      </div>
    </div>
  );
}

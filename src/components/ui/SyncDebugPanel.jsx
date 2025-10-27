/**
 * 🔍 SYNC DEBUG PANEL
 * ===================
 * Painel de debug para monitorar sincronização offline
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Database, 
  Cloud, 
  CloudOff,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Download
} from 'lucide-react';
import syncManager from '@/lib/syncManager';
import unifiedStorage from '@/lib/unifiedStorage';

export function SyncDebugPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Carrega status
  const loadStatus = async () => {
    try {
      const syncStatus = await syncManager.getStatus();
      setStatus(syncStatus);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Auto-refresh a cada 5 segundos
  useEffect(() => {
    loadStatus();

    if (autoRefresh) {
      const interval = setInterval(loadStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Sincroniza manualmente
  const handleSyncNow = async () => {
    setLoading(true);
    try {
      await syncManager.syncNow();
      await loadStatus();
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
    setLoading(false);
  };

  // Pull do Firebase
  const handlePull = async () => {
    setLoading(true);
    try {
      const userId = status?.stats?.userId || 'user123'; // TODO: pegar do auth
      await syncManager.pullFromFirebase(userId);
      await loadStatus();
    } catch (error) {
      console.error('Erro ao fazer pull:', error);
    }
    setLoading(false);
  };

  // Limpa tudo
  const handleClearAll = async () => {
    if (!window.confirm('⚠️ Isso vai APAGAR TODOS os dados locais. Confirmar?')) {
      return;
    }

    setLoading(true);
    try {
      await unifiedStorage.clearAll();
      await loadStatus();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
    setLoading(false);
  };

  if (!status) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-400">Carregando status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Sincronização Offline</h3>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle auto-refresh */}
            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs"
            >
              {autoRefresh ? 'Auto ✓' : 'Manual'}
            </Button>

            {/* Refresh manual */}
            <Button
              size="sm"
              variant="outline"
              onClick={loadStatus}
              disabled={loading}
              className="border-gray-600 hover:bg-gray-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Status de Conectividade */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50">
          {status.isOnline ? (
            <>
              <Cloud className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Online</p>
                <p className="text-xs text-gray-400">Conectado ao Firebase</p>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Conectado
              </Badge>
            </>
          ) : (
            <>
              <CloudOff className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Offline</p>
                <p className="text-xs text-gray-400">Modo local ativado</p>
              </div>
              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                Desconectado
              </Badge>
            </>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Decks Locais</span>
            </div>
            <p className="text-2xl font-bold text-white">{status.stats.totalDecks}</p>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Cartas</span>
            </div>
            <p className="text-2xl font-bold text-white">{status.stats.totalCards}</p>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-gray-400">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-white">{status.pendingOperations}</p>
          </div>
        </div>

        {/* Status de Sincronização */}
        {status.isSyncing && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-400">Sincronizando...</p>
              <p className="text-xs text-blue-300">Aguarde a conclusão</p>
            </div>
          </div>
        )}

        {/* Operações Pendentes */}
        {status.pendingOperations > 0 && !status.isSyncing && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span className="text-sm font-medium text-orange-400">
                  {status.pendingOperations} operação(ões) aguardando sincronização
                </span>
              </div>
            </div>
            <p className="text-xs text-orange-300">
              {status.isOnline 
                ? 'Sincronização automática em andamento...' 
                : 'Aguardando conexão para sincronizar'}
            </p>
          </div>
        )}

        {/* Log Recente */}
        {status.recentLogs && status.recentLogs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Últimas Atividades</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {status.recentLogs.map((log, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-2 rounded bg-gray-900/30 text-xs"
                >
                  {log.itemsFailed > 0 ? (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-300">
                      {log.itemsSynced} sincronizado(s)
                      {log.itemsFailed > 0 && `, ${log.itemsFailed} falhou(aram)`}
                    </p>
                    <p className="text-gray-500">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={handleSyncNow}
            disabled={loading || !status.isOnline || status.pendingOperations === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Agora
          </Button>

          <Button
            onClick={handlePull}
            disabled={loading || !status.isOnline}
            variant="outline"
            className="flex-1 border-gray-600 hover:bg-gray-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Pull Firebase
          </Button>

          <Button
            onClick={handleClearAll}
            disabled={loading}
            variant="destructive"
            className="px-4"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/30">
          <p className="text-xs text-blue-400">
            💡 <strong>Dica:</strong> Dados são salvos localmente primeiro. 
            Sincronização acontece automaticamente a cada 30 segundos quando online.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default SyncDebugPanel;

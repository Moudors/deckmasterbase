/**
 * 🔍 IMAGE CACHE DEBUG PANEL
 * ==========================
 * Painel para monitorar e gerenciar cache de imagens
 * 
 * RECURSOS:
 * - 📊 Estatísticas de uso (total, tamanho)
 * - 🧹 Limpeza de cache antigo
 * - 🗑️ Limpar tudo (reset completo)
 * - ⏱️ Atualização em tempo real
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { getCacheStats, cleanupOldCache, clearAllCache } from '@/lib/imageCache';

export function ImageCacheDebugPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Carrega estatísticas ao montar
  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const data = await getCacheStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
    setLoading(false);
  }

  async function handleCleanup() {
    setLoading(true);
    setMessage('');
    try {
      const deletedCount = await cleanupOldCache();
      setMessage(`✅ ${deletedCount} imagens antigas removidas`);
      await loadStats();
    } catch (error) {
      setMessage('❌ Erro ao limpar cache');
      console.error(error);
    }
    setLoading(false);
  }

  async function handleClearAll() {
    if (!window.confirm('⚠️ Isso vai remover TODAS as imagens do cache. Confirmar?')) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await clearAllCache();
      setMessage('✅ Cache limpo completamente');
      await loadStats();
    } catch (error) {
      setMessage('❌ Erro ao limpar cache');
      console.error(error);
    }
    setLoading(false);
  }

  if (!stats) {
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-400">Carregando estatísticas...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Cache de Imagens</h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadStats}
            disabled={loading}
            className="border-gray-600 hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-gray-400">Total de Imagens</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="bg-gray-900/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Tamanho Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalSizeMB} MB</p>
          </div>
        </div>

        {/* Timestamps */}
        {stats.oldestTimestamp && (
          <div className="bg-gray-900/50 p-4 rounded-lg">
            <p className="text-sm text-gray-400">
              Imagem mais antiga:{' '}
              <span className="text-white">
                {new Date(stats.oldestTimestamp).toLocaleDateString('pt-BR')}
              </span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Imagem mais recente:{' '}
              <span className="text-white">
                {new Date(stats.newestTimestamp).toLocaleDateString('pt-BR')}
              </span>
            </p>
          </div>
        )}

        {/* Mensagem de feedback */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.startsWith('✅') 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {message}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-2">
          <Button
            onClick={handleCleanup}
            disabled={loading}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Antigas (30+ dias)
          </Button>

          <Button
            onClick={handleClearAll}
            disabled={loading}
            variant="destructive"
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 p-3 rounded-lg">
          <p className="text-xs text-blue-400">
            💡 Imagens são armazenadas localmente no seu dispositivo. 
            Cache expira automaticamente após 30 dias sem uso.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default ImageCacheDebugPanel;

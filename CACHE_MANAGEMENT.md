# Gerenciamento de Cache e Quota - DeckMaster

## 📋 Problemas Resolvidos

Esta implementação resolve os seguintes problemas:
- ❌ Cache do React Query crescendo indefinidamente (era 24h, agora 10min)
- ❌ Fila offline ocupando muito espaço (era 500 itens/50MB, agora 100 itens/10MB)
- ❌ LocalStorage atingindo quota máxima
- ❌ IndexedDB crescendo sem controle
- ❌ Operações antigas ficando na fila para sempre

## 🚀 O que foi implementado

### 1. Sistema de Gerenciamento Automático de Cache (`cacheManager.js`)
- Limpeza automática executada 1x por dia
- Remove automaticamente itens com mais de 7 dias
- Limita cache do React Query
- Limita fila offline
- Monitora uso de storage

### 2. Configuração Otimizada do React Query
Mudanças em `src/index.tsx`:
```javascript
// ANTES (problemático)
staleTime: Infinity      // Cache nunca expirava
gcTime: 24 * 60 * 60 * 1000  // 24 horas

// DEPOIS (otimizado)
staleTime: 5 * 60 * 1000   // 5 minutos
gcTime: 10 * 60 * 1000     // 10 minutos
```

### 3. Limites da Fila Offline Reduzidos
Mudanças em `src/lib/offlineSync.js`:
```javascript
// ANTES (excessivo)
MAX_QUEUE_SIZE: 500
MAX_STORAGE_SIZE: 50MB

// DEPOIS (controlado)
MAX_QUEUE_SIZE: 100
MAX_STORAGE_SIZE: 10MB
MAX_QUEUE_AGE: 7 dias (novo)
```

### 4. Limpeza Periódica Automática
- **A cada 1 hora**: Remove itens antigos da fila offline
- **A cada 1 dia**: Executa limpeza completa do cache
- **Automático ao iniciar**: Verifica e limpa se necessário

### 5. Painel de Debug Visual
- Localização: Canto inferior direito (botão 📊)
- Mostra em tempo real:
  - Uso de storage (MB usado / MB total)
  - Número de queries em cache
  - Operações pendentes na fila offline
  - Alertas quando storage > 80%

## 🛠️ Ferramentas no Console do Navegador

Abra o console (F12) e use:

```javascript
// Verificar uso de storage
window.cacheManager.checkUsage()

// Forçar limpeza completa
window.cacheManager.forceClean()

// Ver informações do cache
window.cacheManager.getInfo()

// Ver fila offline
window.offlineSyncManager.logQueueInfo()
```

## 📊 Como Usar

### Durante o Desenvolvimento

1. **Painel de Debug**: Clique no botão 📊 no canto inferior direito
2. **Monitorar**: Veja uso de storage em tempo real
3. **Limpar**: Use o botão "🧹 Limpar Cache" se necessário

### Se Tiver Problemas de Quota

#### Opção 1: Usar o Script PowerShell
```powershell
cd scripts
.\clear-cache.ps1
```
Siga as instruções para limpar o cache manualmente.

#### Opção 2: Limpar Direto no Console
```javascript
// Limpar LocalStorage (mantém autenticação)
const keysToKeep = ['firebase:authUser', 'firebase:host'];
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && !keysToKeep.some(k => key.includes(k))) {
    localStorage.removeItem(key);
  }
}

// Limpar IndexedDB
indexedDB.deleteDatabase('deckmaster_db');

// Limpar React Query
window.queryClient.clear();

// Recarregar
location.reload();
```

## 🎯 Benefícios

### Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Cache React Query | 24 horas | 10 minutos |
| Fila Offline | 500 itens | 100 itens |
| Storage Máximo | 50 MB | 10 MB |
| Limpeza | Manual | Automática (1x/dia) |
| Idade Máxima | Infinito | 7 dias |
| Monitoramento | Nenhum | Painel Visual |

### Performance
- ✅ Menos memória usada
- ✅ Queries mais atualizadas
- ✅ Menos requisições desnecessárias
- ✅ Storage sempre dentro do limite
- ✅ Sincronização mais eficiente

### Experiência do Usuário
- ✅ Sem erros de quota excedida
- ✅ App mais responsivo
- ✅ Dados sempre atualizados
- ✅ Feedback visual do estado do cache
- ✅ Operações offline confiáveis

## 🔧 Configurações Ajustáveis

Se precisar ajustar os limites, edite estas constantes:

### Em `src/lib/cacheManager.js`:
```javascript
MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000  // 7 dias
MAX_CACHE_ITEMS: 100
```

### Em `src/lib/offlineSync.js`:
```javascript
MAX_QUEUE_SIZE: 100
MAX_STORAGE_SIZE: 10 * 1024 * 1024  // 10MB
MAX_QUEUE_AGE: 7 * 24 * 60 * 60 * 1000  // 7 dias
```

### Em `src/index.tsx`:
```javascript
staleTime: 5 * 60 * 1000   // Quando considera cache "velho"
gcTime: 10 * 60 * 1000     // Quando remove do cache
```

## ⚠️ Notas Importantes

1. **Seus dados estão seguros**: A limpeza de cache NÃO afeta seus decks salvos no Firebase
2. **Autenticação preservada**: O sistema mantém seus dados de login
3. **Limpeza automática**: Você não precisa fazer nada manualmente
4. **Apenas desenvolvimento**: O painel de debug só aparece em modo dev

## 🐛 Troubleshooting

### "QuotaExceededError" ainda aparece
1. Use `window.cacheManager.forceClean()`
2. Ou execute o script `scripts/clear-cache.ps1`
3. Recarregue a página

### Painel de debug não aparece
- O painel só aparece em modo desenvolvimento
- Certifique-se que `NODE_ENV === 'development'`

### Fila offline crescendo muito
- Verifique sua conexão com internet
- Use `window.offlineSyncManager.logQueueInfo()` para ver detalhes
- Forçar sincronização: `window.offlineSyncManager.trySync()`

## 📚 Arquivos Modificados/Criados

- ✅ `src/lib/cacheManager.js` (novo)
- ✅ `src/lib/useCacheHooks.js` (novo)
- ✅ `src/components/ui/CacheDebugPanel.jsx` (novo)
- ✅ `src/global.d.ts` (atualizado)
- ✅ `src/index.tsx` (otimizado)
- ✅ `src/lib/offlineSync.js` (otimizado)
- ✅ `src/App.tsx` (adicionado painel de debug)
- ✅ `scripts/clear-cache.ps1` (novo)

## 🎓 Como Funciona

1. **Ao iniciar o app**: `cacheManager` verifica última limpeza
2. **Se passou 1 dia**: Executa limpeza automática
3. **A cada 1 hora**: Remove itens antigos da fila
4. **A cada operação**: Valida limites antes de salvar
5. **Em tempo real**: Painel mostra uso de storage
6. **Quando necessário**: Usuário pode forçar limpeza

---

💡 **Dica**: Mantenha o painel de debug aberto durante o desenvolvimento para monitorar o cache!

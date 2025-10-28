# DIAGNÓSTICO: Deck não aparece na Home

## Problema Reportado
Usuário criou um deck que está no Supabase, mas não aparece na Home.

## Checklist de Diagnóstico

### ✅ 1. Verificar Logs da Home
```javascript
// Logs adicionados na Home.jsx linha ~78
console.log("🏠 HOME DEBUG:", {
  isLoading,
  decksError, 
  decks,
  hasDecks,
  user
});
```
**Ação**: Abrir DevTools (F12) e verificar esses logs

### ✅ 2. Botões de Debug Adicionados
- 🔄 **Reload Decks**: Força refetch do useDecks
- 🗑️ **Limpar Cache**: Invalida cache do React Query

**Ação**: Tentar esses botões na interface

### ✅ 3. Possíveis Causas

#### A. Problema de Autenticação
```javascript
// Se user for null ou user.id incorreto
if (!user || !user.id) {
  // Query não executa ou busca com ID errado
}
```

#### B. Cache Stale/Corrompido  
```javascript
// Cache pode estar desatualizado
queryClient.invalidateQueries(['decks']);
```

#### C. RLS Policy Bloqueando
```sql
-- Verificar no Supabase Dashboard
SELECT * FROM decks WHERE owner_id = 'USER_ID_AQUI';
```

#### D. Timing Issue
```javascript
// useDecks executa antes do user estar pronto
enabled: !!user?.id // Deve aguardar auth
```

### ✅ 4. Testes Específicos

#### Teste 1: Logs do Console
1. Abrir DevTools (F12)
2. Ir para Console  
3. Verificar logs "🏠 HOME DEBUG"
4. Verificar se há erros em vermelho

#### Teste 2: Network Tab
1. Abrir DevTools (F12) 
2. Ir para Network
3. Filtrar por "supabase"
4. Recarregar página
5. Verificar se query de decks executa
6. Ver response da query

#### Teste 3: Supabase Dashboard
1. Ir para supabase.com
2. Abrir projeto
3. Ir para Table Editor
4. Verificar tabela "decks"
5. Confirmar se deck existe
6. Verificar owner_id

### ✅ 5. Soluções Rápidas

#### Solução 1: Force Refresh
```javascript
// Usar botão "🔄 Reload Decks" na interface
```

#### Solução 2: Clear Cache
```javascript  
// Usar botão "🗑️ Limpar Cache" na interface
```

#### Solução 3: Logout/Login
```javascript
// Limpar auth state e fazer login novamente
```

#### Solução 4: Hard Refresh
```
Ctrl+Shift+R (ou Cmd+Shift+R no Mac)
```

### ✅ 6. Se Nada Funcionar

#### Verificar useDecks Query
```javascript
// Em useUnifiedDecks.js, verificar se:
enabled: true // Está habilitado
```

#### Verificar connectivityManager
```javascript
// Se connectivity.canSaveData for false
// Query pode não executar
```

### ✅ 7. Logs Esperados (Sucesso)

```
🏠 HOME DEBUG: {
  isLoading: false,
  decksError: null,
  decks: { length: 1, items: [{ id: "deck_123", name: "Meu Deck" }] },
  hasDecks: true,
  user: { id: "user_123", email: "user@email.com" }
}
```

### ✅ 8. Logs de Problema (Falha)

```
🏠 HOME DEBUG: {
  isLoading: false,
  decksError: "Error message here",
  decks: null OR { length: 0, items: [] },
  hasDecks: false, 
  user: null OR { id: "wrong_id", email: "..." }
}
```

## Próximos Passos
1. **Verificar logs no console** 
2. **Usar botões de debug**
3. **Reportar o que aparece nos logs**
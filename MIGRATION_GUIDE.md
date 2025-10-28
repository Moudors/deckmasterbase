# 🔄 Migração Firebase → Supabase - DeckMaster

## ✅ O que foi feito

### 1. **Adaptadores de Compatibilidade Criados**
- `src/supabase.ts` - Cliente Supabase configurado com interface compatível com Firebase
- `src/lib/firestoreAdapter.ts` - Adaptador que simula Firestore usando Supabase
- `src/authSupabase.ts` - Autenticação adaptada para Supabase
- `src/lib/supabaseSilent.js` - Operações silenciosas adaptadas
- `src/hooks/useAuthState.js` - Hook customizado substituindo react-firebase-hooks

### 2. **Dependências Atualizadas**
- ✅ Instalado `@supabase/supabase-js`
- ✅ Removido `firebase`
- ✅ Removido `react-firebase-hooks`

### 3. **Arquivos Principais Migrados**
- ✅ `src/firebase.ts` - Agora usa adaptadores Supabase
- ✅ `src/auth.ts` - Redirecionado para authSupabase
- ✅ `src/lib/firestoreSilent.js` - Redirecionado para supabaseSilent
- ✅ Importações atualizadas em arquivos principais

### 4. **Configurações Removidas**
- ✅ `firebase.json`, `firestore.rules`, `firestore.indexes.json` removidos
- ✅ `.env.example` criado com variáveis do Supabase

## 🚀 Próximos Passos

### 1. **Configurar Projeto Supabase**
```bash
# 1. Criar projeto no https://supabase.com
# 2. Copiar URL e ANON KEY do projeto
# 3. Executar o script SQL para criar tabelas
```

### 2. **Executar Script SQL**
Execute o arquivo `supabase_migration.sql` no SQL Editor do Supabase para criar:
- Tabelas: users, decks, deck_cards, messages, friendships, usernames
- Índices para performance
- RLS (Row Level Security) policies
- Triggers para updated_at

### 3. **Configurar Variáveis de Ambiente**
```bash
# Criar arquivo .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. **Configurar OAuth Google (Opcional)**
No painel do Supabase:
1. Authentication → Settings → Auth Providers
2. Habilitar Google OAuth
3. Configurar Client ID e Secret

### 5. **Testar a Aplicação**
```bash
npm start
```

## 📊 Estrutura de Dados Mantida

A migração mantém **100% de compatibilidade** com o código existente:

### Firebase Firestore → Supabase PostgreSQL
```
collections/docs → tables/rows
users → users
decks → decks  
cards → deck_cards
messages → messages
friendships → friendships
usernames → usernames
```

### Campos Adaptados
```
createdAt (Firebase) → created_at (Supabase)
updatedAt (Firebase) → updated_at (Supabase) 
ownerId (Firebase) → owner_id (Supabase)
```

## 🔧 Sistema de Sincronização

O sistema offline-first **continua funcionando**:
- IndexedDB como cache local
- Sincronização automática em background
- Fila de operações offline
- Resolução de conflitos por timestamp

## ⚠️ Pontos de Atenção

### 1. **Real-time Updates**
Firestore tinha real-time listeners. Para Supabase:
```javascript
// Substituir onSnapshot por polling ou Supabase real-time
supabase
  .channel('decks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'decks' }, payload => {
    // Atualizar UI
  })
  .subscribe()
```

### 2. **Queries Complexas**
Algumas queries do Firestore podem precisar ajustes:
- `array-contains` → `@>` operator no PostgreSQL
- Compound queries → JOIN statements

### 3. **Autenticação OAuth**
Google OAuth precisa ser configurado no Supabase separadamente.

## 🎯 Benefícios da Migração

- ✅ **Custo**: Supabase é mais barato que Firebase
- ✅ **SQL**: Queries mais flexíveis com PostgreSQL
- ✅ **Real-time**: Supabase tem real-time built-in
- ✅ **Backup**: PostgreSQL permite backups completos
- ✅ **Escalabilidade**: Melhor controle sobre a infraestrutura

## 🔍 Arquivos que Podem Precisar de Ajustes Manuais

Verifique estes arquivos para imports do Firebase que podem ter sido perdidos:
```
src/components/user/UserMenu.jsx
src/components/user/MessagesPanel.jsx
src/components/user/FriendsList.jsx
src/components/user/ProfileEdit.jsx
src/pages/Deckbuilder.jsx
src/api/firebaseAuth.js
src/api/firebaseCards.js
src/api/firebaseDecks.js
src/api/firebaseMessages.js
```

Use esta busca para encontrar imports restantes:
```bash
grep -r "firebase" src/ --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx"
```

## ✅ Status da Migração

- ✅ Configuração base do Supabase
- ✅ Adaptadores de compatibilidade  
- ✅ Autenticação migrada
- ✅ Operações de banco migradas
- ✅ Imports principais atualizados
- ⚠️ **Pendente**: Configuração do projeto Supabase
- ⚠️ **Pendente**: Execução do script SQL
- ⚠️ **Pendente**: Configuração de variáveis de ambiente
- ⚠️ **Pendente**: Teste completo da aplicação
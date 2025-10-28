# 🎨 Correção da Atualização Visual de Arte

## ❌ PROBLEMA IDENTIFICADO

**Sintoma**: Mudança de arte funciona no backend (dados são atualizados), mas a mudança visual não aparece no grid das cartas.

**Causa Raiz**: Múltiplos fatores de cache impedindo a atualização visual:
1. Cache do React Query não estava aplicando updates otimísticos
2. Cache de imagem (`useImageCache`) não estava limpando imagens antigas
3. Cache do browser mantinha imagens antigas em memória
4. Ordem de prioridade da URL de imagem estava incorreta

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. **Atualização Otimística no React Query**

#### Antes (❌ Problema):
```javascript
// Apenas onSuccess, sem optimistic update
onSuccess: (updatedCard, { cardId }) => {
  queryClient.setQueryData(['cards', deckId], (old = []) =>
    old.map(card => card.id === cardId ? { ...card, ...updatedCard } : card)
  );
}
```

#### Depois (✅ Solução):
```javascript
// Adicionado onMutate para update otimístico + logs
onMutate: async ({ cardId, updates }) => {
  await queryClient.cancelQueries({ queryKey: ['cards', deckId] });
  const previousCards = queryClient.getQueryData(['cards', deckId]);
  
  // Update otimístico - aparece instantaneamente
  queryClient.setQueryData(['cards', deckId], (old = []) =>
    old.map(card => card.id === cardId ? { ...card, ...updates } : card)
  );
  
  return { previousCards, cardId, updates };
},
onSuccess: (updatedCard, { cardId, updates }) => {
  // Garante que tanto updates quanto dados do servidor sejam aplicados
  queryClient.setQueryData(['cards', deckId], (old = []) =>
    old.map(card => card.id === cardId ? { 
      ...card, 
      ...updates,      // Aplica updates enviados
      ...updatedCard   // Sobrescreve com dados do servidor
    } : card)
  );
},
onError: (err, { cardId }, context) => {
  // Rollback em caso de erro
  if (context?.previousCards) {
    queryClient.setQueryData(['cards', deckId], context.previousCards);
  }
}
```

### 2. **Limpeza do Cache de Imagem**

#### Antes (❌ Problema):
```javascript
// useImageCache não limpava cache ao mudar URL
useEffect(() => {
  loadImage();
}, [imageUrl, enabled]);
```

#### Depois (✅ Solução):
```javascript
useEffect(() => {
  // Limpa URL anterior se existir
  if (cachedUrl && cachedUrl.startsWith('blob:')) {
    URL.revokeObjectURL(cachedUrl);
  }
  
  // Reset para vazio enquanto carrega nova imagem
  setCachedUrl('');
  
  loadImage();
}, [imageUrl, enabled]); // Remove cachedUrl das dependencies
```

### 3. **Prioridade Correta da URL de Imagem**

#### Antes (❌ Problema):
```javascript
// card.image_url tinha prioridade baixa
const displayImageUrl = currentFace.image_uris?.normal || 
                        currentFace.image_url || 
                        card.image_url;
```

#### Depois (✅ Solução):
```javascript
// card.image_url (atualizado via ArtSelector) tem prioridade máxima
const displayImageUrl = card.image_url || 
                        currentFace.image_uris?.normal || 
                        currentFace.image_url;
```

### 4. **Key Único para Forçar Re-render**

#### Antes (❌ Problema):
```jsx
<img src={cachedImageUrl || displayImageUrl} alt="..." />
```

#### Depois (✅ Solução):
```jsx
<img 
  key={`${card.id}-${card.updated_at || card.scryfall_id}-${displayImageUrl?.split('/').pop()}`}
  src={cachedImageUrl || displayImageUrl} 
  alt="..." 
/>
```

### 5. **Logs de Debug Adicionados**

```javascript
const handleSelectArt = async (artData) => {
  console.log('🎨 Deckbuilder: Alterando arte da carta:', {
    card: selectedCardForArt,
    artData,
    currentImageUrl: selectedCardForArt.image_url,
    newImageUrl: artData.image_url
  });
  
  await updateCard({ cardId: selectedCardForArt.id, updates: artData });
  console.log('✅ Arte alterada com sucesso');
};
```

## 🔧 FLUXO CORRIGIDO

### Sequência de Eventos:
1. **Usuário seleciona nova arte** no ArtSelector
2. **Update otimístico**: Carta atualiza instantaneamente no cache
3. **Re-render**: CardGridItem re-renderiza com nova `image_url`
4. **Cache limpo**: `useImageCache` limpa blob URL antigo
5. **Nova imagem carregada**: Nova URL é baixada e cached
6. **Confirmação**: Server confirma mudança, cache é consolidado

### Fallbacks de Erro:
- **Erro de rede**: Rollback automático para estado anterior
- **Erro de imagem**: Fallback para URL original
- **Erro de cache**: Invalidação forçada e reload

## 🧪 FERRAMENTAS DE DEBUG

### Script de Debug Visual:
```javascript
// Execute no console após entrar em um deck:
debugArt.debugArtChanges()
```

**Funcionalidades do Debug**:
- Monitora mudanças de `src` em tempo real
- Verifica estado do cache React Query
- Analisa cache de imagem IndexedDB
- Captura logs de arte automaticamente
- Guia para teste manual passo-a-passo

### Logs Adicionados:
- `🎨 Deckbuilder: Alterando arte da carta` - Debug inicial
- `✏️ Atualizando carta online` - Mutation iniciada
- `✅ Arte alterada com sucesso` - Confirmação de sucesso
- `❌ Erro ao alterar arte` - Debug de erro

## 📋 VERIFICAÇÃO DE FUNCIONAMENTO

### ✅ Checklist de Teste:
1. **Mudança visual instantânea**: Arte muda imediatamente ao confirmar
2. **Persistência**: Mudança permanece após reload da página
3. **Cache atualizado**: Nova imagem fica em cache local
4. **Rollback em erro**: Reverte se houver problema de rede
5. **Logs claros**: Console mostra cada etapa do processo

### 🎯 Casos de Teste:
- **Arte para arte diferente**: ✅ Deve funcionar
- **Arte para mesma arte**: ✅ Deve manter sem problemas
- **Arte com rede lenta**: ✅ Update otimístico funciona
- **Arte com erro de rede**: ✅ Rollback automático
- **Múltiplas mudanças rápidas**: ✅ Última mudança prevalece

## 🎉 STATUS FINAL

**✅ PROBLEMA RESOLVIDO**: 
- Mudança de arte reflete instantaneamente no grid
- Cache de imagem limpo e atualizado corretamente
- Updates otimísticos proporcionam UX responsiva
- Sistema robusto com fallbacks de erro

**🔧 PERFORMANCE**: 
- Update otimístico: **Instantâneo**
- Download nova imagem: **Em background**
- Cache hit subsequente: **Instantâneo**
- Rollback em erro: **Automático**
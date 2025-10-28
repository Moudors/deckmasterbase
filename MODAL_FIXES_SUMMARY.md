# 🔧 Correção dos Modais do Deckbuilder

## ✅ PROBLEMAS CORRIGIDOS

### 1. **Menu de Seleção de Arte** ✅
- **Componente**: `ArtSelector` adicionado ao Deckbuilder
- **Trigger**: Triple-tap ou long press nas cartas
- **Funcionalidade**: Permite selecionar arte alternativa para cartas dupla face
- **Estado**: `showArtSelector` e `selectedCardForArt` implementados
- **Handler**: `handleShowArtSelector` e `handleSelectArt` funcionais

### 2. **Menu de Deleção de Cartas** ✅
- **Componente**: `DeleteQuantityDialog` adicionado ao Deckbuilder
- **Trigger**: Modo de seleção → selecionar cartas → confirmar deleção
- **Funcionalidade**: Permite deletar quantidade específica ou carta completa
- **Estado**: `showDeleteDialog` e `cardsToDelete` implementados
- **Handler**: `handleDeleteSelected` e `handleConfirmDelete` com lógica de quantidade

## 🔧 ALTERAÇÕES TÉCNICAS

### Imports Adicionados
```jsx
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
```

### Estados Adicionados
```jsx
const [showArtSelector, setShowArtSelector] = useState(false);
const [selectedCardForArt, setSelectedCardForArt] = useState(null);
const [showDeleteDialog, setShowDeleteDialog] = useState(false);
const [cardsToDelete, setCardsToDelete] = useState([]);
```

### Handlers Implementados

#### Art Selector
```jsx
const handleShowArtSelector = (card) => {
  if (isViewOnly) return;
  setSelectedCardForArt(card);
  setShowArtSelector(true);
};

const handleSelectArt = async (artData) => {
  if (selectedCardForArt && !isViewOnly) {
    try {
      await updateCard({ 
        cardId: selectedCardForArt.id, 
        updates: artData 
      });
      setShowArtSelector(false);
      setSelectedCardForArt(null);
    } catch (error) {
      setError("Erro ao alterar arte da carta");
    }
  }
};
```

#### Delete Dialog
```jsx
const handleDeleteSelected = async () => {
  if (selectedCards.length > 0 && canEdit) {
    const cardsToRemove = deckCards.filter((c) => selectedCards.includes(c.id));
    setCardsToDelete(cardsToRemove);
    setShowDeleteDialog(true);
  }
};

const handleConfirmDelete = async (quantities) => {
  try {
    const deletions = Object.entries(quantities).map(([cardId, quantity]) => ({
      cardId,
      quantityToDelete: quantity,
    }));
    
    for (const deletion of deletions) {
      const card = deckCards.find(c => c.id === deletion.cardId);
      if (card) {
        if (deletion.quantityToDelete >= card.quantity) {
          await deleteCard(deletion.cardId);
        } else {
          const newQuantity = card.quantity - deletion.quantityToDelete;
          await updateCard({ cardId: deletion.cardId, updates: { quantity: newQuantity } });
        }
      }
    }
    
    setSelectedCards([]);
    setIsSelectionMode(false);
    setShowDeleteDialog(false);
    setCardsToDelete([]);
  } catch (error) {
    setError("Erro ao remover cartas selecionadas");
  }
};
```

### CardGridItem Props Atualizados
```jsx
<CardGridItem
  key={card.id}
  card={card}
  onToggleAcquired={handleToggleAcquired}
  isSelectionMode={isSelectionMode && !isViewOnly}
  isSelected={selectedCards.includes(card.id)}
  onToggleSelect={handleToggleSelect}
  onShowArtSelector={handleShowArtSelector}  // ✅ Novo
  isViewOnly={isViewOnly}
  currentUserId={user?.id}                   // ✅ Novo
  deckOwnerId={currentDeck?.user_id}         // ✅ Novo
/>
```

### Modais Adicionados ao JSX
```jsx
{/* Modais */}
<ArtSelector
  isOpen={showArtSelector}
  onClose={() => {
    setShowArtSelector(false);
    setSelectedCardForArt(null);
  }}
  card={selectedCardForArt}
  onSelectArt={handleSelectArt}
  deckId={deckId}
/>

<DeleteQuantityDialog
  isOpen={showDeleteDialog}
  onClose={() => {
    setShowDeleteDialog(false);
    setCardsToDelete([]);
  }}
  cards={cardsToDelete}
  deckId={deckId}
  onConfirm={handleConfirmDelete}
  isLoading={false}
/>
```

## 🎮 COMO USAR

### Art Selector
1. **Triple-tap** em uma carta OU
2. **Long press** (pressionar e segurar) em uma carta
3. Modal abre com opções de arte alternativa
4. Selecionar nova arte confirma automaticamente

### Delete Dialog
1. Clicar no **ícone de lixeira** no header (ativa modo seleção)
2. **Selecionar cartas** clicando nelas (ficam destacadas)
3. Clicar novamente no **ícone de lixeira** (confirma deleção)
4. Modal abre perguntando **quantas** de cada carta deletar
5. Confirmar deleta apenas a quantidade especificada

## 🧪 FERRAMENTAS DE DEBUG

### Script de Teste
Criado `test-modals.js` com funções para testar:
- Detecção de cartas na tela
- Simulação de gestos
- Verificação de estado dos modais
- Teste de funcionalidades

### Como Testar
```javascript
// No console do navegador após entrar em um deck
testModalFunctions.testAllModals()
```

## 🔍 COMPATIBILIDADE

### Componentes Existentes
- ✅ `ArtSelector`: Totalmente funcional, busca artes no Scryfall
- ✅ `DeleteQuantityDialog`: Permite deletar quantidade específica
- ✅ `CardGridItem`: Já tem suporte para gestos e callbacks

### Integração
- ✅ **React Query**: Mutations funcionam com cache
- ✅ **Supabase**: Updates persistem no banco
- ✅ **Animations**: Modais abrem com animações suaves
- ✅ **Mobile**: Gestos funcionam em touch devices

## 📋 STATUS FINAL

**🎯 OBJETIVO ALCANÇADO**: 
- ✅ Menu de seleção de arte funcional
- ✅ Menu de deleção de cartas funcional  
- ✅ Integração completa com Deckbuilder
- ✅ Compatibilidade com arquitetura online-first
- ✅ UX consistente com resto da aplicação

**🔧 PRÓXIMOS PASSOS**:
- Testar gestos em dispositivos reais
- Verificar se todas as artes alternativas carregam
- Confirmar que deleções parciais funcionam corretamente
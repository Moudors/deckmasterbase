import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Trash2 } from "lucide-react";
import { useAuthState } from "../hooks/useAuthState";
import CardGridItem from "../components/deck/CardGridItem";
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
import ImportDeckModal from "../components/deck/ImportDeckModal";
import ExportDeckModal from "../components/deck/ExportDeckModal";
import DeckSettingsMenu from "../components/deck/DeckSettingsMenu";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useConnectivity } from "../lib/connectivityManager";
import { useDecks, useDeckCards } from "../lib/useUnifiedDecks";
import { Input } from "../components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { deckCardOperations } from "../lib/supabaseOperations";

const Collection = () => {
  const navigate = useNavigate();
  const [user] = useAuthState();
  const { isOnline, canSaveData } = useConnectivity();
  const queryClient = useQueryClient();
  
  // Buscar o deck "Coleção de cartas" do usuário
  const { decks = [], isLoading: decksLoading } = useDecks();
  const collectionDeck = useMemo(() => 
    decks?.find(deck => deck.format === "Coleção de cartas"), 
    [decks]
  );
  
  const deckId = collectionDeck?.id;
  
  const { 
    cards: deckCards = [], 
    isLoading: cardsLoading,
    addCard,
    updateCard,
    deleteCard,
    canEdit 
  } = useDeckCards(deckId);

  // Estados
  const [showArtSelector, setShowArtSelector] = useState(false);
  const [selectedCardForArt, setSelectedCardForArt] = useState(null);
  const [error, setError] = useState(null);
  
  // Estados para deletar cartas
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardsToDelete, setCardsToDelete] = useState([]);
  
  // Estados para import/export
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Estados da SearchBar
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // 🔄 Estado do modo filtro (swipe)
  const [isFilterMode, setIsFilterMode] = useState(false);
  
  // Refs
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Verifica se usuário tem permissão
  const isViewOnly = !canEdit;

  // Debug: Log do estado dos decks
  useEffect(() => {
    console.log("📚 Collection - Estado dos decks:", {
      decksLoading,
      decksCount: decks?.length,
      collectionDeck: collectionDeck ? { id: collectionDeck.id, name: collectionDeck.name, format: collectionDeck.format } : null,
      allDecks: decks?.map(d => ({ id: d.id, name: d.name, format: d.format }))
    });
  }, [decks, decksLoading, collectionDeck]);

  // Redireciona se não encontrar a coleção (mas só após o carregamento terminar)
  useEffect(() => {
    // Aguarda mais tempo para dar tempo do cache atualizar após criação
    const timer = setTimeout(() => {
      console.log("📚 Collection - Verificando redirecionamento:", { decksLoading, collectionDeck: !!collectionDeck });
      if (!decksLoading && !collectionDeck) {
        console.log("⚠️ Collection - Nenhuma coleção encontrada, redirecionando...");
        navigate("/", { 
          state: { 
            message: "Você precisa criar uma Coleção de cartas primeiro.",
            type: "warning"
          } 
        });
      }
    }, 3000); // Aumentado para 3 segundos
    
    return () => clearTimeout(timer);
  }, [decksLoading, collectionDeck, navigate]);

  // Handler para seleção de arte
  const handleShowArtSelector = (card) => {
    if (isViewOnly) return;
    setSelectedCardForArt(card);
    setShowArtSelector(true);
  };

  const handleImportDeck = async (cards) => {
    console.log("📥 [IMPORT COLLECTION] Iniciando importação de", cards.length, "cartas");
    
    if (!addCard || !updateCard) {
      console.error("❌ [IMPORT] Funções addCard/updateCard não disponíveis!");
      alert("Erro: Não foi possível adicionar cartas. Tente recarregar a página.");
      return;
    }
    
    const existingCardsMap = new Map();
    (deckCards || []).forEach(card => {
      existingCardsMap.set(card.scryfall_id, card);
    });
    
    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < cards.length; i++) {
      const cardData = cards[i];
      
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardData.name)}`
        );
        
        if (response.ok) {
          const cardInfo = await response.json();
          const existingCard = existingCardsMap.get(cardInfo.id);
          
          if (existingCard) {
            const newQuantity = existingCard.quantity + cardData.quantity;
            updateCard({
              cardId: existingCard.id,
              updates: { quantity: newQuantity }
            });
            existingCard.quantity = newQuantity;
            updatedCount++;
          } else {
            addCard({
              scryfall_id: cardInfo.id,
              card_name: cardInfo.name,
              image_url: cardInfo.image_uris?.normal || cardInfo.card_faces?.[0]?.image_uris?.normal || "",
              mana_cost: cardInfo.mana_cost || "",
              type_line: cardInfo.type_line || "",
              oracle_text: cardInfo.oracle_text || "",
              quantity: cardData.quantity,
              acquired: false,
              card_faces: cardInfo.card_faces || null,
              colors: cardInfo.colors || [],
              color_identity: cardInfo.color_identity || [],
              cmc: cardInfo.cmc || 0,
              rarity: cardInfo.rarity || "",
              set_code: cardInfo.set || "",
              collector_number: cardInfo.collector_number || "",
            });
            existingCardsMap.set(cardInfo.id, { id: null, scryfall_id: cardInfo.id, quantity: cardData.quantity });
            addedCount++;
          }
          await new Promise(resolve => setTimeout(resolve, 50));
        } else if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          i--;
          continue;
        } else {
          errorCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        errorCount++;
        console.error(`❌ [IMPORT] Erro ao processar ${cardData.name}:`, error);
      }
    }
    
    alert(`Importação concluída!\n➕ ${addedCount} cartas adicionadas\n📝 ${updatedCount} quantidades atualizadas${errorCount > 0 ? `\n⚠️ ${errorCount} erros` : ''}`);
  };

  const handleSelectArt = async (artData) => {
    let updates = { ...artData };
    if (selectedCardForArt.card_faces && Array.isArray(selectedCardForArt.card_faces)) {
      const newCardFaces = selectedCardForArt.card_faces.map(face => ({
        ...face,
        image_url: artData.image_url,
        image_uris: {
          ...face.image_uris,
          normal: artData.image_url
        }
      }));
      updates.card_faces = newCardFaces;
    }
    
    if (selectedCardForArt && !isViewOnly) {
      try {
        await updateCard({ cardId: selectedCardForArt.id, updates });
        setShowArtSelector(false);
        setSelectedCardForArt(null);
      } catch (error) {
        setError("Erro ao alterar arte da carta");
      }
    }
  };

  // Toggle transparência (adquirida/não adquirida)
  const handleToggleAcquired = async (card) => {
    if (isViewOnly) return;
    try {
      await updateCard({ 
        cardId: card.id, 
        updates: { acquired: !card.acquired } 
      });
    } catch (error) {
      console.error("Erro ao atualizar carta:", error);
    }
  };

  // Handlers para deletar cartas
  const handleToggleSelect = (cardId) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleDeleteSelected = async () => {
    console.log("🗑️ handleDeleteSelected chamado", { 
      selectedCardsCount: selectedCards.length, 
      canEdit,
      selectedCards 
    });
    
    if (selectedCards.length > 0 && canEdit) {
      const cardsToRemove = deckCards.filter((c) => selectedCards.includes(c.id));
      console.log("🗑️ Cartas a serem removidas:", cardsToRemove);
      setCardsToDelete(cardsToRemove);
      setShowDeleteDialog(true);
    } else {
      console.log("⚠️ Não pode deletar:", { 
        hasSelectedCards: selectedCards.length > 0, 
        canEdit 
      });
    }
  };

  const handleConfirmDelete = async (quantities) => {
    console.log("🗑️ handleConfirmDelete chamado", { quantities });
    
    try {
      const deletions = Object.entries(quantities).map(([cardId, quantity]) => ({
        cardId,
        quantityToDelete: quantity,
      }));
      
      console.log("🗑️ Deletions array:", deletions);
      
      for (const deletion of deletions) {
        const card = deckCards.find(c => c.id === deletion.cardId);
        console.log("🗑️ Processando carta:", { 
          cardId: deletion.cardId, 
          card: card ? { id: card.id, name: card.card_name, quantity: card.quantity } : null,
          quantityToDelete: deletion.quantityToDelete 
        });
        
        if (card) {
          if (deletion.quantityToDelete >= card.quantity) {
            // Deletar carta completamente
            console.log("🗑️ Deletando carta completamente:", card.id);
            await deleteCard(deletion.cardId);
          } else {
            // Reduzir quantidade
            const newQuantity = card.quantity - deletion.quantityToDelete;
            console.log("🗑️ Reduzindo quantidade:", { 
              oldQuantity: card.quantity, 
              newQuantity 
            });
            await updateCard({ cardId: deletion.cardId, updates: { quantity: newQuantity } });
          }
        }
      }
      
      console.log("✅ Deleções concluídas com sucesso");
      setSelectedCards([]);
      setIsSelectionMode(false);
      setShowDeleteDialog(false);
      setCardsToDelete([]);
    } catch (error) {
      console.error("❌ Erro ao remover cartas:", error);
      setError("Erro ao remover cartas selecionadas");
    }
  };

  // 🔄 Swipe na SearchBar para alternar modo filtro
  const handleSearchBarTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleSearchBarTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = Math.abs(touchEndX - touchStartX.current);
    const diffY = Math.abs(touchEndY - touchStartY.current);

    // Swipe horizontal (mais horizontal que vertical)
    if (diffX > 80 && diffX > diffY) {
      setIsFilterMode(prev => !prev);
      console.log('[DEBUG] Modo filtro alternado:', !isFilterMode);
    }
  };

  // Buscar sugestões (API ou filtro local)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      
      try {
        if (isFilterMode) {
          // 🔍 Modo filtro: busca apenas nas cartas da coleção
          const filtered = deckCards
            .filter(card => 
              card.card_name.toLowerCase().includes(query.toLowerCase())
            )
            .map(card => card.card_name)
            .slice(0, 10); // Limita a 10 resultados
          
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        } else {
          // 🌐 Modo busca: API Scryfall
          const response = await fetch(
            `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
          );
          const data = await response.json();
          setSuggestions(data.data || []);
          setShowSuggestions(true);
        }
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, isFilterMode, deckCards]);

  // Adicionar carta à coleção
  const handleAddCard = async (cardName) => {
    if (!deckId || isFilterMode) return; // Não adiciona em modo filtro
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      const cardData = await response.json();

      const imageUrl =
        cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal;

      const newCard = {
        deck_id: deckId,
        card_name: cardData.name,
        scryfall_id: cardData.id,
        image_url: imageUrl,
        mana_cost: cardData.mana_cost || "",
        type_line: cardData.type_line || "",
        acquired: false,
        quantity: 1,
        created_at: new Date(),
        card_faces: cardData.card_faces || null,
      };

      const currentCards = queryClient.getQueryData(["cards", deckId]) || [];
      const existing = currentCards.find((c) => c.scryfall_id === cardData.id);

      if (existing) {
        const nextQty = (existing.quantity || 1) + 1;
        queryClient.setQueryData(["cards", deckId], (old = []) =>
          old.map((c) => (c.id === existing.id ? { ...c, quantity: nextQty } : c))
        );

        try {
          await deckCardOperations.updateDeckCard(existing.id, { quantity: nextQty });
        } catch (err) {
          console.error("Erro ao incrementar:", err);
          queryClient.setQueryData(["cards", deckId], (old = []) =>
            old.map((c) => (c.id === existing.id ? { ...c, quantity: existing.quantity } : c))
          );
        }
      } else {
        const tempId = `tmp-${Date.now()}`;
        const tempCard = { id: tempId, ...newCard, __optimistic: true };
        queryClient.setQueryData(["cards", deckId], (old = []) => [tempCard, ...old]);

        try {
          const docId = await deckCardOperations.addCardToDeck(deckId, newCard);
          queryClient.setQueryData(["cards", deckId], (old = []) =>
            old.map((c) => (c && c.id === tempId ? { id: docId, ...newCard } : c))
          );
        } catch (err) {
          console.error("Erro ao adicionar:", err);
          queryClient.setQueryData(["cards", deckId], (old = []) => old.filter((c) => c.id !== tempId));
          alert("Erro ao adicionar carta: " + (err.message || "Tente novamente"));
        }
      }

      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Erro ao adicionar carta:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFilterMode) return; // Não adiciona em modo filtro
    
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleAddCard(suggestions[selectedIndex]);
    } else if (query.trim()) {
      handleAddCard(query.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (isFilterMode) {
      // Em modo filtro, apenas filtra visualmente
      setQuery(suggestion);
      setShowSuggestions(false);
    } else {
      handleAddCard(suggestion);
    }
  };

  // Filtrar cartas exibidas (quando em modo filtro com query)
  const displayedCards = useMemo(() => {
    if (!isFilterMode || !query.trim()) {
      return deckCards;
    }
    return deckCards.filter(card => 
      card.card_name.toLowerCase().includes(query.toLowerCase())
    );
  }, [deckCards, isFilterMode, query]);

  const totalCards = displayedCards.reduce((sum, card) => sum + (card.quantity || 1), 0);

  if (decksLoading || cardsLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!collectionDeck) {
    return null; // Redireciona via useEffect
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-lg font-bold text-white">Coleção de Cartas</h1>
          </div>
          <p className="text-sm text-gray-400">
            {totalCards} carta{totalCards !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Botão de lixeira */}
        {!isViewOnly && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (isSelectionMode && selectedCards.length > 0) {
                handleDeleteSelected();
              } else {
                setIsSelectionMode(!isSelectionMode);
                setSelectedCards([]);
              }
            }}
            className={`${
              isSelectionMode && selectedCards.length > 0
                ? "text-red-500 hover:text-red-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
        {isViewOnly && <div className="w-10" />}
      </div>

      {/* Alertas */}
      {!isOnline && (
        <Alert className="mx-4 mt-4 bg-yellow-500/10 border-yellow-500/50">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            Você está offline. As alterações serão sincronizadas quando voltar online.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mx-4 mt-4 bg-red-500/10 border-red-500/50">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* SearchBar com swipe */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-20 border-b border-gray-800 p-4 transition-colors duration-300 ${
          isFilterMode 
            ? 'bg-blue-900/40' // Azul acinzentado em modo filtro
            : 'bg-gray-900'
        }`}
        onTouchStart={handleSearchBarTouchStart}
        onTouchEnd={handleSearchBarTouchEnd}
      >
        <form onSubmit={handleSubmit} className="flex gap-2 relative" ref={searchRef}>
          <div className="relative flex-1">
            {isFilterMode ? (
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            )}
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isFilterMode ? "Filtrar na coleção..." : "Adicionar carta..."}
              className={`pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 transition-colors ${
                isFilterMode ? 'border-blue-600' : ''
              }`}
              disabled={isSearching || !canSaveData}
            />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
            )}
          </div>

          {!isFilterMode && (
            <Button
              type="submit"
              disabled={isSearching || !query.trim() || !canSaveData}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          )}
        </form>

        {/* Indicador de modo */}
        <p className="text-xs text-center mt-2 text-gray-400">
          {isFilterMode ? (
            <span className="text-blue-400">🔍 Modo Filtro - Deslize para voltar à busca</span>
          ) : (
            <span className="text-gray-400">🔄 Deslize para filtrar sua coleção</span>
          )}
        </p>

        {/* Sugestões */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-4 right-4 top-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-30"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-gray-700' : ''
                  } ${index === 0 ? 'rounded-t-lg' : ''} ${
                    index === suggestions.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                >
                  <span className="text-white">{suggestion}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Grid de Cartas */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {displayedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-lg">
              {isFilterMode && query.trim() 
                ? "Nenhuma carta encontrada com esse nome"
                : "Sua coleção está vazia"
              }
            </p>
            {!isFilterMode && (
              <p className="text-sm mt-2">Use a barra de busca para adicionar cartas</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 pb-20">
            <AnimatePresence>
              {displayedCards.map((card) => (
                <div key={card.id}>
                  <CardGridItem
                    card={card}
                    onToggleAcquired={handleToggleAcquired}
                    onShowArtSelector={handleShowArtSelector}
                    isViewOnly={isViewOnly}
                    currentUserId={user?.id}
                    deckOwnerId={collectionDeck?.user_id}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedCards.includes(card.id)}
                    onToggleSelect={() => handleToggleSelect(card.id)}
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Barra inferior de seleção */}
      {isSelectionMode && !isViewOnly && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-full px-6 py-3 shadow-2xl"
        >
          <p className="text-white font-medium">
            {selectedCards.length > 0
              ? `${selectedCards.length} carta${selectedCards.length > 1 ? 's' : ''} selecionada${selectedCards.length > 1 ? 's' : ''}`
              : "Selecione cartas para remover"}
          </p>
        </motion.div>
      )}

      {/* Modal de confirmação de deleção */}
      <DeleteQuantityDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setCardsToDelete([]);
        }}
        cards={cardsToDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de seleção de arte */}
      <ArtSelector
        isOpen={showArtSelector}
        onClose={() => {
          setShowArtSelector(false);
          setSelectedCardForArt(null);
        }}
        card={selectedCardForArt}
        onSelectArt={handleSelectArt}
        onAddCard={addCard}
        onUpdateCard={updateCard}
        deckId={deckId}
      />

      {/* Menu de configurações (Import/Export) */}
      <DeckSettingsMenu
        onImportClick={() => setShowImportModal(true)}
        onExportClick={() => setShowExportModal(true)}
      />

      {/* Modal de importação */}
      <ImportDeckModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportDeck}
      />

      {/* Modal de exportação */}
      <ExportDeckModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        deckName={collectionDeck?.name || "Coleção"}
        deckFormat="Coleção de cartas"
        cards={deckCards || []}
      />
    </div>
  );
};

export default Collection;

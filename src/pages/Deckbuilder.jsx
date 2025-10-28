import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Trash2 } from "lucide-react";
import { useAuthState } from "../hooks/useAuthState";
import SearchBar from "../components/deck/SearchBar";
import CardGridItem from "../components/deck/CardGridItem";
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useConnectivity } from "../lib/connectivityManager";
import { useDecks, useDeckCards } from "../lib/useUnifiedDecks";

const Deckbuilder = () => {
  const { id: deckId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState();
  
  // Estado para controlar o delay antes de mostrar "deck não encontrado"
  const [searchTimeout, setSearchTimeout] = useState(false);
  
  // Estado de conectividade
  const { isOnline, canSaveData } = useConnectivity();
  
  // Hook unificado para decks
  const { 
    decks = [], 
    isLoading: decksLoading, 
    error: decksError,
    updateDeck,
    refetch: refetchDecks
  } = useDecks();
  
  const { 
    cards: deckCards = [], 
    isLoading: cardsLoading, 
    error: cardsError,
    addCard,
    updateCard,
    deleteCard,
    canEdit 
  } = useDeckCards(deckId);
  
  // Estados locais
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showArtSelector, setShowArtSelector] = useState(false);
  const [selectedCardForArt, setSelectedCardForArt] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardsToDelete, setCardsToDelete] = useState([]);

  // Protege contra decks locais - sistema agora é online-first apenas
  useEffect(() => {
    if (deckId && deckId.startsWith("local_")) {
      navigate("/", { 
        state: { 
          message: "Sistema migrado: decks locais não são mais suportados. Use apenas decks online.",
          type: "warning"
        } 
      });
      return;
    }
  }, [deckId, navigate]);

  // Controla timeout para busca do deck
  useEffect(() => {
    if (!deckId || decksLoading) {
      setSearchTimeout(false);
      return;
    }

    console.log("🔍 Iniciando timer para busca do deck:", deckId);
    
    // Tenta refetch após 2 segundos se deck não foi encontrado
    const refetchTimer = setTimeout(async () => {
      if (!decks?.find(deck => deck.id === deckId)) {
        console.log("🔄 Deck não encontrado, tentando refetch...");
        try {
          await refetchDecks();
        } catch (error) {
          console.error("❌ Erro no refetch:", error);
        }
      }
    }, 2000);
    
    // Aguarda 5 segundos antes de mostrar "deck não encontrado"
    // Aumentado de 3 para 5 segundos para decks recém-criados
    const timeoutTimer = setTimeout(() => {
      console.log("⏰ Timeout atingido - deck ainda não encontrado");
      setSearchTimeout(true);
    }, 5000);

    return () => {
      console.log("🛑 Limpando timers de busca");
      clearTimeout(refetchTimer);
      clearTimeout(timeoutTimer);
    };
  }, [deckId, decksLoading, decks, refetchDecks]);

  // Busca o deck atual
  const currentDeck = useMemo(() => {
    console.log("🔍 Buscando deck:", deckId);
    console.log("📋 Decks disponíveis:", decks?.length || 0);
    console.log("📋 IDs dos decks:", decks?.map(d => d.id) || []);
    
    const foundDeck = decks?.find(deck => deck.id === deckId) || null;
    
    if (foundDeck) {
      console.log("✅ Deck encontrado:", foundDeck.name);
    } else {
      console.log("❌ Deck não encontrado na lista");
    }
    
    return foundDeck;
  }, [decks, deckId]);

  // Estados de carregamento e erro
  const isLoading = decksLoading || cardsLoading;
  const deckError = decksError || cardsError;

  // Determina se é visualização apenas
  const isViewOnly = !canEdit;

  // Adiciona carta do Advanced Search (controle de execução única)
  const hasAddedRef = React.useRef(false);
  useEffect(() => {
    if (location.state?.addCard && !hasAddedRef.current) {
      hasAddedRef.current = true;
      const addCardFromAdvancedSearch = async () => {
        if (!deckId || !canEdit) {
          navigate(location.pathname, { 
            state: { ...location.state, addCard: null }, 
            replace: true 
          });
          return;
        }
        const cardToAdd = location.state.addCard;
        try {
          // Buscar dados completos da carta no Scryfall
          const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardToAdd.name)}`
          );
          const cardData = await response.json();
          const imageUrl = cardData.image_uris?.normal || cardData.card_faces?.[0]?.image_uris?.normal;
          await addCard({
            scryfall_id: cardData.id,
            card_name: cardData.name,
            image_url: imageUrl,
            mana_cost: cardData.mana_cost || "",
            type_line: cardData.type_line || "",
            quantity: 1,
            acquired: false,
            card_faces: cardData.card_faces || null,
          });
          navigate(location.pathname, { 
            state: { ...location.state, addCard: null }, 
            replace: true 
          });
        } catch (error) {
          setError(error.message || "Erro ao adicionar carta");
          navigate(location.pathname, { 
            state: { ...location.state, addCard: null }, 
            replace: true 
          });
        }
      };
      addCardFromAdvancedSearch();
    }
    if (!location.state?.addCard) {
      hasAddedRef.current = false;
    }
  }, [location.state?.addCard, deckId, canEdit, addCard, navigate, location.pathname, location.state]);

  // Handlers para cartas do deck
  const handleToggleAcquired = async (card) => {
    if (!canEdit) {
      setError("Não é possível modificar cartas offline. Conecte-se à internet.");
      return;
    }

    try {
      await updateCard({ cardId: card.id, updates: { acquired: !card.acquired } });
    } catch (error) {
      console.error("❌ Erro ao alterar status:", error);
      setError(error.message || "Erro ao alterar status da carta");
    }
  };

  const handleQuantityChange = async (card, newQuantity) => {
    if (!canEdit) {
      setError("Não é possível modificar cartas offline. Conecte-se à internet.");
      return;
    }

    if (newQuantity <= 0) {
      await handleRemoveCard(card);
      return;
    }

    try {
      await updateCard({ cardId: card.id, updates: { quantity: newQuantity } });
    } catch (error) {
      console.error("❌ Erro ao alterar quantidade:", error);
      setError(error.message || "Erro ao alterar quantidade");
    }
  };

  const handleRemoveCard = async (card) => {
    if (!canEdit) {
      setError("Não é possível remover cartas offline. Conecte-se à internet.");
      return;
    }

    try {
      await deleteCard(card.id);
    } catch (error) {
      console.error("❌ Erro ao remover carta:", error);
      setError(error.message || "Erro ao remover carta");
    }
  };

  // Handlers para modo de seleção
  const handleToggleSelect = (cardId) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

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
            // Deletar carta completamente
            await deleteCard(deletion.cardId);
          } else {
            // Reduzir quantidade
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

  // Handler para seleção de arte
  const handleShowArtSelector = (card) => {
    if (isViewOnly) return;
    setSelectedCardForArt(card);
    setShowArtSelector(true);
  };

  const handleSelectArt = async (artData) => {
    if (selectedCardForArt && !isViewOnly) {
      // Se veio da busca avançada, não faz nada (adição já foi feita pelo fluxo principal)
      if (location.state?.addCard) {
        setShowArtSelector(false);
        setSelectedCardForArt(null);
        return;
      }
      // Fluxo normal: alterar arte de carta já existente
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

  // Handler para atualizar cover do deck
  const handleUpdateDeckCover = async (coverImageUrl) => {
    if (currentDeck && !isViewOnly) {
      try {
        await updateDeck({ 
          id: currentDeck.id, 
          data: { cover_image_url: coverImageUrl } 
        });
      } catch (error) {
        setError("Erro ao alterar cover do deck");
      }
    }
  };

  // Calcula total de cartas
  const totalCards = deckCards.reduce((sum, c) => sum + (c.quantity || 1), 0);

  // Mostra loading enquanto busca o deck ou ainda não passou o timeout
  if (isLoading || (!currentDeck && !searchTimeout)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-blue-400 mb-4">
            {isLoading ? "Carregando deck..." : "Procurando deck recém-criado..."}
          </p>
          <p className="text-gray-400 mb-4 text-sm">
            {!isLoading && "Aguarde alguns segundos para a sincronização"}
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (deckError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Erro ao carregar deck: {deckError}</p>
          <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  if (!currentDeck && searchTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-yellow-400 mb-4">Deck não encontrado</p>
          <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
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
              <h1 className="text-lg font-bold text-white">{currentDeck?.name}</h1>
              {isViewOnly && <Eye className="w-4 h-4 text-blue-400" />}
            </div>
            <p className="text-sm text-gray-400">
              {currentDeck?.format} • {totalCards} cartas
            </p>
          </div>

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
      </div>

      {/* Barra de busca */}
      {!isViewOnly && (
        <SearchBar deckId={deckId} isSearching={isSearching} setIsSearching={setIsSearching} />
      )}

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="px-4 pt-4">
          <Alert
            className={
              error.includes("sucesso")
                ? "bg-green-900/20 border-green-800"
                : "bg-red-900/20 border-red-800"
            }
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription
              className={error.includes("sucesso") ? "text-green-400" : "text-red-400"}
            >
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Grid de cartas */}
      <div className="p-4">
        {deckCards.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-lg mb-2">
              {isViewOnly
                ? "Este deck ainda não tem cartas"
                : "Nenhuma carta adicionada ainda"}
            </p>
            {!isViewOnly && (
              <p className="text-gray-500 text-sm">
                Use a barra de busca para adicionar cartas
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {deckCards.map((card) => (
                <CardGridItem
                  key={card.id}
                  card={card}
                  onToggleAcquired={handleToggleAcquired}
                  isSelectionMode={isSelectionMode && !isViewOnly}
                  isSelected={selectedCards.includes(card.id)}
                  onToggleSelect={handleToggleSelect}
                  onShowArtSelector={handleShowArtSelector}
                  isViewOnly={isViewOnly}
                  currentUserId={user?.id}
                  deckOwnerId={currentDeck?.user_id}
                />
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

      {/* Modais */}
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
    </div>
  );
};

export default Deckbuilder;
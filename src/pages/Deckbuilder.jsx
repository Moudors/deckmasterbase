import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Trash2 } from "lucide-react";
import { useAuthState } from "../hooks/useAuthState";
import SearchBar from "../components/deck/SearchBar";
import { useDoubleClickTransparency } from "../components/deck/DoubleClickTransparencyManager";
import CardGridItem from "../components/deck/CardGridItem";
import TradeConfirmDialog from "../components/deck/TradeConfirmDialog";
import BuyRequestModal from "../components/deck/BuyRequestModal";
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useConnectivity } from "../lib/connectivityManager";
import { useDecks, useDeckCards } from "../lib/useUnifiedDecks";

const Deckbuilder = () => {
  // Declaração única dos hooks e estados
  const { id: deckId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState();
  const { isOnline, canSaveData } = useConnectivity();
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
  const { refetch: refetchCards } = useDeckCards(deckId);
  const doubleClickTransparency = useDoubleClickTransparency(updateCard, refetchCards);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedCardForTrade, setSelectedCardForTrade] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showArtSelector, setShowArtSelector] = useState(false);
  const [selectedCardForArt, setSelectedCardForArt] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardsToDelete, setCardsToDelete] = useState([]);
  const [showBuyRequestModal, setShowBuyRequestModal] = useState(false);
  const [selectedCardForBuy, setSelectedCardForBuy] = useState(null);
  const [deckOwnerName, setDeckOwnerName] = useState("");

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
  const [remoteDeck, setRemoteDeck] = useState(null);
  useEffect(() => {
    if (!decks?.find(deck => deck.id === deckId)) {
      // Se não encontrar localmente, busca direto do banco
      import("../lib/supabaseOperations").then(({ deckOperations }) => {
        deckOperations.getDeck(deckId)
          .then(deck => {
            if (deck) {
              setRemoteDeck(deck);
              console.log("✅ Deck encontrado remotamente:", deck.name);
            } else {
              setRemoteDeck(null);
              console.log("❌ Deck não encontrado remotamente");
            }
          })
          .catch(err => {
            setRemoteDeck(null);
            console.error("❌ Erro ao buscar deck remotamente:", err);
          });
      });
    } else {
      setRemoteDeck(null);
    }
  }, [decks, deckId]);

  const currentDeck = useMemo(() => {
    const foundDeck = decks?.find(deck => deck.id === deckId) || remoteDeck;
    if (foundDeck) {
      console.log("✅ Deck encontrado:", foundDeck.name);
    } else {
      console.log("❌ Deck não encontrado na lista nem remotamente");
    }
    return foundDeck;
  }, [decks, deckId, remoteDeck]);

  // Estados de carregamento e erro
  const isLoading = decksLoading || cardsLoading;
  const deckError = decksError || cardsError;

  // Determina se é visualização apenas (bloqueia busca para decks de amigos)
  const isViewOnly = !canEdit || (currentDeck && user?.id !== currentDeck.owner_id);
  
  // Verifica se é um deck Trade de um amigo
  const isFriendTradeDeck = useMemo(() => {
    const result = isViewOnly && 
           currentDeck && 
           (currentDeck.format === "Trade" || currentDeck.format === "Trades");
    console.log("🔍 isFriendTradeDeck:", {
      result,
      isViewOnly,
      currentDeck: currentDeck?.deck_name,
      format: currentDeck?.format,
      ownerId: currentDeck?.owner_id,
      userId: user?.id
    });
    return result;
  }, [isViewOnly, currentDeck, user?.id]);

  // Buscar nome do dono do deck se for deck de amigo
  useEffect(() => {
    const fetchOwnerName = async () => {
      if (currentDeck?.owner_id && isViewOnly) {
        try {
          const { userOperations } = await import("../lib/supabaseOperations");
          const ownerData = await userOperations.getUser(currentDeck.owner_id);
          setDeckOwnerName(ownerData?.display_name || "Amigo");
        } catch (err) {
          console.error("Erro ao buscar nome do dono:", err);
          setDeckOwnerName("Amigo");
        }
      }
    };
    
    fetchOwnerName();
  }, [currentDeck?.owner_id, isViewOnly]);

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
    console.log('[DEBUG] handleShowArtSelector chamado', { card, isViewOnly });
    if (isViewOnly) {
      console.log('[DEBUG] Não abrindo modal - modo view only');
      return;
    }
    console.log('[DEBUG] Abrindo ArtSelector modal');
    setSelectedCardForArt(card);
    setShowArtSelector(true);
  };

  const handleSelectArt = async (artData) => {
      let updates = { ...artData };
      // Se for carta dupla face, atualiza image_url e image_uris.normal em ambas as faces
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
      // Log de debug para verificar updates enviados
      console.log('[DEBUG] handleSelectArt - updates:', updates);
    if (selectedCardForArt && !isViewOnly) {
      // Se veio da busca avançada, não faz nada (adição já foi feita pelo fluxo principal)
      if (location.state?.addCard) {
        setShowArtSelector(false);
        setSelectedCardForArt(null);
        return;
      }
      // Fluxo normal: alterar arte de carta já existente
      try {
        let updates = { ...artData };
        // Se for carta dupla face, atualiza image_url em ambas as faces
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
        await updateCard({ 
          cardId: selectedCardForArt.id, 
          updates
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
              {deckCards.map((card) => {
                console.log('[DEBUG] Renderizando card:', {
                  cardId: card.id,
                  is_transparent: card.is_transparent,
                  typeof: typeof card.is_transparent
                });
                const transparent = card.is_transparent === true || card.is_transparent === 'true';
                
                // Long press manual
                let pressTimer = null;
                let lastTap = 0;
                
                const handleTouchStart = (e) => {
                  // Cancelar timer anterior se existir
                  if (pressTimer) clearTimeout(pressTimer);
                  
                  // Iniciar timer de long press (500ms)
                  pressTimer = setTimeout(() => {
                    console.log("⏱️ Long press detectado!", {
                      isFriendTradeDeck,
                      cardName: card.card_name,
                      isViewOnly
                    });
                    if (isFriendTradeDeck) {
                      console.log("🛒 Abrindo BuyRequestModal via long press");
                      setSelectedCardForBuy(card);
                      setShowBuyRequestModal(true);
                    } else if (!isViewOnly) {
                      // Se não é deck de amigo e não é viewOnly, abre modal de arte
                      console.log("🎨 Abrindo ArtSelector via long press");
                      handleShowArtSelector(card);
                    }
                  }, 500); // 500ms = meio segundo
                };
                
                const handleTouchEnd = async (e) => {
                  // Cancelar long press se soltar antes de 500ms
                  if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                  }
                  
                  // Double tap detection (mantido para desktop)
                  const now = Date.now();
                  if (now - lastTap < 400) {
                    if (isFriendTradeDeck) {
                      setSelectedCardForBuy(card);
                      setShowBuyRequestModal(true);
                    } else if (isViewOnly && transparent) {
                      setSelectedCardForTrade(card);
                      setShowTradeDialog(true);
                    } else if (!isViewOnly) {
                      await doubleClickTransparency(card, deckCards);
                    }
                  }
                  lastTap = now;
                };
                
                const handleTouchCancel = () => {
                  // Cancelar long press se o toque for cancelado
                  if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                  }
                };
                
                return (
                  <div
                    key={card.id}
                    onDoubleClick={async () => {
                      console.log("🖱️ Duplo clique detectado!", {
                        isFriendTradeDeck,
                        cardName: card.card_name,
                        isViewOnly,
                        transparent
                      });
                      if (isFriendTradeDeck) {
                        console.log("🛒 Abrindo BuyRequestModal via double click");
                        setSelectedCardForBuy(card);
                        setShowBuyRequestModal(true);
                      } else if (isViewOnly && transparent) {
                        setSelectedCardForTrade(card);
                        setShowTradeDialog(true);
                      } else if (!isViewOnly) {
                        await doubleClickTransparency(card, deckCards);
                      }
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchCancel}
                    style={{ opacity: transparent ? 0.5 : 1, transition: "opacity 0.3s" }}
                  >
                    <CardGridItem
                      card={card}
                      isSelectionMode={isSelectionMode && !isViewOnly}
                      isSelected={selectedCards.includes(card.id)}
                      onToggleSelect={handleToggleSelect}
                      onShowArtSelector={handleShowArtSelector}
                      isViewOnly={isViewOnly}
                      currentUserId={user?.id}
                      deckOwnerId={currentDeck?.user_id}
                    />
                  </div>
                );
              })}
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
    {/* Modal de trade para deck do amigo */}
    {showTradeDialog && selectedCardForTrade && (
      <TradeConfirmDialog
        isOpen={showTradeDialog}
        onClose={() => setShowTradeDialog(false)}
        card={selectedCardForTrade}
        onConfirm={async () => {
            console.log('[TRADE DEBUG] user:', user);
            console.log('[TRADE DEBUG] user.user_metadata:', user?.user_metadata);
            console.log('[TRADE DEBUG] user.user_metadata.full_name:', user?.user_metadata?.full_name);
          // Envia mensagem na caixa de mensagem ao oferecer trade (permite duplicados)
          try {
            const recipientId = currentDeck?.owner_id;
            const messageText = `Oferta de trade: ${selectedCardForTrade.card_name}`;
            const messageData = {
              recipient_id: recipientId,
              sender_id: user?.id,
              card_id: selectedCardForTrade.id,
              card_name: selectedCardForTrade.card_name,
              type: 'trade_offer',
              text: messageText,
              created_at: new Date().toISOString()
            };
            const { messageOperations } = await import("../lib/supabaseOperations");
            // Corrigir campo para 'content' ao invés de 'text' e adicionar nome do remetente
            const messageDataFixed = { ...messageData };
            if (messageDataFixed.text) {
              messageDataFixed.content = messageDataFixed.text;
              delete messageDataFixed.text;
            }
                // Buscar display_name do usuário logado na tabela users
                let senderName = "";
                try {
                  const { userOperations } = await import("../lib/supabaseOperations");
                  const userDb = await userOperations.getUser(user.id);
                  senderName = userDb?.display_name || "";
                  console.log('[TRADE DEBUG] display_name do usuário:', senderName);
                } catch (err) {
                  console.error('[TRADE DEBUG] Erro ao buscar display_name:', err);
                }
                if (!messageDataFixed.sender_name) {
                  messageDataFixed.sender_name = senderName;
                }
            await messageOperations.sendMessage(messageDataFixed);
            setShowTradeDialog(false);
            setSelectedCardForTrade(null);
            setError("Mensagem de trade enviada com sucesso!");
          } catch (err) {
            console.error('[TRADE] Erro ao enviar mensagem:', err);
            setError("Erro ao enviar mensagem de trade: " + (err?.message || err));
          }
        }}
      />
    )}
    
    {/* Modal de interesse em comprar (deck Trade de amigo) */}
    <BuyRequestModal
      isOpen={showBuyRequestModal}
      onClose={() => {
        setShowBuyRequestModal(false);
        setSelectedCardForBuy(null);
      }}
      card={selectedCardForBuy}
      deckOwnerId={currentDeck?.owner_id}
      deckOwnerName={deckOwnerName || "Amigo"}
    />
  </div>
  );
};

export default Deckbuilder;
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Trash2, Settings } from "lucide-react";
import { useAuthState } from "../hooks/useAuthState";
import SearchBar from "../components/deck/SearchBar";
import { useDoubleClickTransparency } from "../components/deck/DoubleClickTransparencyManager";
import CardGridItem from "../components/deck/CardGridItem";
import TradeConfirmDialog from "../components/deck/TradeConfirmDialog";
import BuyRequestModal from "../components/deck/BuyRequestModal";
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
import DeckSettingsMenu from "../components/deck/DeckSettingsMenu";
import ImportDeckModal from "../components/deck/ImportDeckModal";
import ExportDeckModal from "../components/deck/ExportDeckModal";
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
  const doubleClickTransparency = useDoubleClickTransparency(updateCard);
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
  
  // ⚙️ Estados do menu de configurações
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const settingsButtonRef = useRef(null);
  
  // 🔄 MATCH REVERSO: Amigos que marcaram minhas cartas como wanted
  const [friendsWantingMyCards, setFriendsWantingMyCards] = useState(new Map()); // Map<scryfall_id, [{ userId, displayName }]>
  const [showReverseTradeModal, setShowReverseTradeModal] = useState(false);
  const [selectedCardForReverseTrade, setSelectedCardForReverseTrade] = useState(null);

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
    
    // Tenta refetch após 2 segundos se deck não foi encontrado
    const refetchTimer = setTimeout(async () => {
      if (!decks?.find(deck => deck.id === deckId)) {
        try {
          await refetchDecks();
        } catch (error) {
          // Silencioso - não polui console
        }
      }
    }, 2000);
    
    // Aguarda 5 segundos antes de mostrar "deck não encontrado"
    const timeoutTimer = setTimeout(() => {
      setSearchTimeout(true);
    }, 5000);

    return () => {
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
            setRemoteDeck(deck || null);
          })
          .catch(err => {
            setRemoteDeck(null);
          });
      });
    } else {
      setRemoteDeck(null);
    }
  }, [decks, deckId]);

  const currentDeck = useMemo(() => {
    return decks?.find(deck => deck.id === deckId) || remoteDeck;
  }, [decks, deckId, remoteDeck]);

  // Estados de carregamento e erro
  const isLoading = decksLoading || cardsLoading;
  const deckError = decksError || cardsError;

  // Determina se é visualização apenas (bloqueia busca para decks de amigos)
  const isViewOnly = !canEdit || (currentDeck && user?.id !== currentDeck.owner_id);
  
  // Verifica se é um deck Trade de um amigo
  const isFriendTradeDeck = useMemo(() => {
    return isViewOnly && 
           currentDeck && 
           (currentDeck.format === "Trade" || currentDeck.format === "Trades");
  }, [isViewOnly, currentDeck]);

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

  // 🔵 BUSCAR MATCHES REVERSOS: Cartas minhas com is_transparent que amigos têm no Trade
  useEffect(() => {
    const fetchReverseMatches = async () => {
      // Verificar se é MEU deck (não deck de amigo)
      const isMyDeck = currentDeck && user?.id && currentDeck.owner_id === user.id;
      
      // ⚠️ IMPORTANTE: Aguarda carregamento das cartas antes de buscar matches
      if (!user?.id || !isMyDeck || cardsLoading || !deckCards.length) {
        return;
      }

      try {
        const { supabase } = await import("../supabase");
        
        // 1. Pegar minhas cartas com is_transparent=true
        const myTransparentCards = deckCards.filter(card => card.is_transparent === true);
        
        if (myTransparentCards.length === 0) {
          setFriendsWantingMyCards(new Map());
          return;
        }
        
        const myTransparentScryfallIds = myTransparentCards.map(c => c.scryfall_id);

        // 2. Buscar amigos
        const { data: friendships, error: friendError } = await supabase
          .from('friendships')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (friendError) throw friendError;

        const friendIds = friendships.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        );
        
        if (friendIds.length === 0) {
          setFriendsWantingMyCards(new Map());
          return;
        }        // 3. Buscar decks Trade dos amigos (apenas decks para negociação)
        const { data: friendTradeDecks, error: decksError } = await supabase
          .from('decks')
          .select('id, owner_id, name, format')
          .in('owner_id', friendIds)
          .or('format.eq.Trade,format.eq.Trades');

        if (decksError) throw decksError;

        if (!friendTradeDecks || friendTradeDecks.length === 0) {
          console.log("⚠️ Nenhum deck Trade de amigos encontrado");
          setFriendsWantingMyCards(new Map());
          return;
        }

        const tradeDeckIds = friendTradeDecks.map(d => d.id);
        console.log(`🔁 Encontrei ${tradeDeckIds.length} decks Trade de amigos:`, 
          friendTradeDecks.map(d => ({ name: d.name, format: d.format }))
        );

        // 4. Buscar cartas nos decks Trade que fazem match com minhas transparentes
        const { data: matchingCards, error: cardsError } = await supabase
          .from('deck_cards')
          .select('id, card_name, scryfall_id, deck_id')
          .in('deck_id', tradeDeckIds)
          .in('scryfall_id', myTransparentScryfallIds);

        if (cardsError) throw cardsError;
        
        // 5. Buscar display_name dos donos dos decks
        const ownerIds = [...new Set(friendTradeDecks.map(d => d.owner_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, display_name')
          .in('id', ownerIds);

        if (usersError) throw usersError;

        // Criar map de owner_id -> display_name
        const userMap = new Map(usersData?.map(u => [u.id, u.display_name]) || []);

        // 6. Montar Map de matches
        const matchesMap = new Map();
        
        if (matchingCards && matchingCards.length > 0) {
          matchingCards.forEach(card => {
            // Encontrar o deck que contém esta carta
            const deck = friendTradeDecks.find(d => d.id === card.deck_id);
            if (!deck) return;

            const userId = deck.owner_id;
            const displayName = userMap.get(userId) || 'Amigo';
            
            if (!matchesMap.has(card.scryfall_id)) {
              matchesMap.set(card.scryfall_id, []);
            }
            
            matchesMap.get(card.scryfall_id).push({
              userId,
              displayName,
              deckId: card.deck_id
            });
          });
        }

        setFriendsWantingMyCards(matchesMap);

      } catch (err) {
        console.error("❌ Erro ao buscar matches reversos:", err);
      }
    };

    fetchReverseMatches();
  }, [user?.id, deckCards, currentDeck, cardsLoading]);

  // 🔍 DEBUG: Monitorar mudanças no Map de matches reversos
  useEffect(() => {
    console.log("🔵 STATE friendsWantingMyCards MUDOU!", {
      size: friendsWantingMyCards.size,
      keys: Array.from(friendsWantingMyCards.keys()),
      hasWashAway: friendsWantingMyCards.has('43411ade-be80-4535-8baa-7055e78496df'),
      timestamp: new Date().toISOString()
    });
  }, [friendsWantingMyCards]);

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

  // Handler para importar deck
  const handleImportDeck = async (cards) => {
    console.log("📥 Importando deck:", cards);
    
    for (const cardData of cards) {
      try {
        // Buscar carta na API do Scryfall
        const response = await fetch(
          `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardData.name)}`
        );
        
        if (response.ok) {
          const cardInfo = await response.json();
          
          // Adicionar carta ao deck
          await addCard({
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
          
          console.log(`✅ Adicionada: ${cardData.quantity}x ${cardInfo.name}`);
        } else {
          console.warn(`⚠️ Carta não encontrada: ${cardData.name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao adicionar ${cardData.name}:`, error);
      }
    }
    
    console.log("✅ Importação concluída!");
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
            <>
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
              
              <Button
                variant="ghost"
                size="icon"
                ref={settingsButtonRef}
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="text-gray-400 hover:text-white relative"
              >
                <Settings className="w-5 h-5" />
                
                {/* Menu dropdown */}
                <DeckSettingsMenu
                  isOpen={showSettingsMenu}
                  onClose={() => setShowSettingsMenu(false)}
                  onImportClick={() => setShowImportModal(true)}
                  onExportClick={() => setShowExportModal(true)}
                  anchorRef={settingsButtonRef}
                />
              </Button>
            </>
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
                  cardName: card.card_name,
                  scryfallId: card.scryfall_id,
                  is_transparent: card.is_transparent,
                  typeof: typeof card.is_transparent
                });
                
                // 🔵 DEBUG: Verificar se tem match reverso
                const hasMatch = friendsWantingMyCards.has(card.scryfall_id);
                const matchData = friendsWantingMyCards.get(card.scryfall_id);
                console.log('🔵 [DEBUG] Match reverso?', {
                  cardName: card.card_name,
                  scryfallId: card.scryfall_id,
                  hasMatch,
                  hasMatchType: typeof hasMatch,
                  matchData,
                  mapSize: friendsWantingMyCards.size,
                  allMatchKeys: Array.from(friendsWantingMyCards.keys()),
                  WILL_PASS_TO_COMPONENT: hasMatch
                });
                
                const transparent = card.is_transparent === true || card.is_transparent === 'true';
                
                // Long press manual
                let pressTimer = null;
                let lastTap = 0;
                
                const handleTouchStart = (e) => {
                  // Cancelar timer anterior se existir
                  if (pressTimer) clearTimeout(pressTimer);
                  
                  // Iniciar timer de long press (800ms)
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
                  }, 800); // 800ms para evitar conflito com duplo clique
                };
                
                const handleTouchEnd = async (e) => {
                  // Cancelar long press se soltar antes de 800ms
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
                    {console.log("🔵🔵🔵 PASSANDO PROP hasReverseMatch:", {
                      cardName: card.card_name,
                      value: friendsWantingMyCards.has(card.scryfall_id),
                      type: typeof friendsWantingMyCards.has(card.scryfall_id),
                      isSelectionMode,
                      shouldRender: friendsWantingMyCards.has(card.scryfall_id) && !isSelectionMode
                    })}
                    <CardGridItem
                      card={card}
                      isSelectionMode={isSelectionMode && !isViewOnly}
                      isSelected={selectedCards.includes(card.id)}
                      onToggleSelect={handleToggleSelect}
                      onShowArtSelector={handleShowArtSelector}
                      isViewOnly={isViewOnly}
                      currentUserId={user?.id}
                      deckOwnerId={currentDeck?.owner_id}
                      hasReverseMatch={friendsWantingMyCards.has(card.scryfall_id)}
                      onReverseMatchClick={() => {
                        console.log("🔵 Clique na bolinha azul - Match reverso", {
                          card: card.card_name,
                          scryfall_id: card.scryfall_id,
                          friends: friendsWantingMyCards.get(card.scryfall_id)
                        });
                        setSelectedCardForReverseTrade(card);
                        setShowReverseTradeModal(true);
                      }}
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
    
    {/* 🔵 Modal de Match Reverso (bolinha azul - quando amigo tem carta que marco como wanted) */}
    <BuyRequestModal
      isOpen={showReverseTradeModal}
      onClose={() => {
        setShowReverseTradeModal(false);
        setSelectedCardForReverseTrade(null);
      }}
      card={selectedCardForReverseTrade}
      deckOwnerId={
        selectedCardForReverseTrade && friendsWantingMyCards.has(selectedCardForReverseTrade.scryfall_id)
          ? friendsWantingMyCards.get(selectedCardForReverseTrade.scryfall_id)[0]?.userId
          : null
      }
      deckOwnerName={
        selectedCardForReverseTrade && friendsWantingMyCards.has(selectedCardForReverseTrade.scryfall_id)
          ? friendsWantingMyCards.get(selectedCardForReverseTrade.scryfall_id)[0]?.displayName
          : "Amigo"
      }
    />
    
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

    {/* Modal de importação de deck */}
    <ImportDeckModal
      isOpen={showImportModal}
      onClose={() => setShowImportModal(false)}
      onImport={handleImportDeck}
    />

    {/* Modal de exportação de deck */}
    <ExportDeckModal
      isOpen={showExportModal}
      onClose={() => setShowExportModal(false)}
      deckName={currentDeck?.name || "Deck"}
      deckFormat={currentDeck?.format || "Unknown"}
      cards={deckCards || []}
    />
  </div>
  );
};

export default Deckbuilder;

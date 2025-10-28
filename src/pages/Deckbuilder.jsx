import React, { useState, useEffect, useRef } from "react";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from "@/firebase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, Trash2, AlertCircle, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SearchBar from "../components/deck/SearchBar";
import CardGridItem from "../components/deck/CardGridItem";
import ArtSelector from "../components/deck/ArtSelector";
import DeleteQuantityDialog from "../components/deck/DeleteQuantityDialog";
import TradeConfirmDialog from "../components/deck/TradeConfirmDialog";
import { updateDocSilent, deleteDocSilent, batchDeleteSilent, addDocSilent } from "@/lib/firestoreSilent";
import { useDeck, useDeckCards } from "@/lib/useDeckHooks";
import { localDeckManager } from "@/lib/localDeckManager";

function DeckBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { id: deckId } = useParams();

  const urlParams = new URLSearchParams(window.location.search);
  const friendName = decodeURIComponent(urlParams.get("friendName") || "");
  const isViewOnly = urlParams.get("viewOnly") === "true";

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [showArtSelector, setShowArtSelector] = useState(false);
  const [selectedCardForArt, setSelectedCardForArt] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardsToDelete, setCardsToDelete] = useState([]);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [selectedCardForTrade, setSelectedCardForTrade] = useState(null);
  
  // ðŸ"' Ref para garantir que a carta só seja adicionada uma vez
  // Usa o ID da carta como chave para evitar duplicação mesmo com React.StrictMode
  const processedCardsRef = useRef(new Set());

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      return { email: "user@example.com", id: "uid123", full_name: "Usuario" };
    },
    staleTime: Infinity,
  });

  // 🎯 Usa hook inteligente que busca no Firebase OU IndexedDB
  const { data: deck } = useDeck(deckId);

  // 🎯 Usa hook inteligente para buscar cartas
  const { data: cards = [], isLoading } = useDeckCards(deckId);

  // ðŸŽ´ Adiciona carta automaticamente se vier da busca avançada
  useEffect(() => {
    const addCardFromAdvancedSearch = async () => {
      // Verifica se não há carta para adicionar
      if (!location.state?.addCard || !deckId) {
        return;
      }

      const cardToAdd = location.state.addCard;
      const cardKey = `${deckId}-${cardToAdd.id}`;
      
      // 🔒 PROTEÇÃO DUPLA contra duplicação (React.StrictMode)
      // 1. Verifica no Set local (memória)
      if (processedCardsRef.current.has(cardKey)) {
        console.log("⚠️ [MEMÓRIA] Carta já foi processada, ignorando duplicação");
        return;
      }

      // 2. Verifica no sessionStorage (persiste entre renders)
      const sessionKey = `card_added_${cardKey}`;
      if (sessionStorage.getItem(sessionKey)) {
        console.log("⚠️ [SESSION] Carta já foi processada, ignorando duplicação");
        processedCardsRef.current.add(cardKey);
        return;
      }

      // Aguarda as cartas serem carregadas
      if (isLoading) {
        return;
      }

      // 🔒 Marca como processado IMEDIATAMENTE em AMBOS
      processedCardsRef.current.add(cardKey);
      sessionStorage.setItem(sessionKey, Date.now().toString());
      
      console.log("ðŸŽ´ Adicionando carta da busca avançada:", cardToAdd.name);
      
      // Limpa o estado IMEDIATAMENTE de forma síncrona
      window.history.replaceState({}, '', location.pathname);

      // Verifica se a carta já existe no deck
      const existingCard = cards.find(c => c.scryfall_id === cardToAdd.id);

      if (existingCard) {
        console.log("âœ… Carta já existe, incrementando quantidade");
        // Incrementa quantidade
        const nextQty = (existingCard.quantity || 1) + 1;
        queryClient.setQueryData(["cards", deckId], (old = []) =>
          old.map((c) => (c.id === existingCard.id ? { ...c, quantity: nextQty } : c))
        );

        try {
          await updateDocSilent("cards", existingCard.id, { quantity: nextQty });
        } catch (err) {
          console.error("Erro ao incrementar quantidade:", err);
        }
      } else {
        console.log("âœ… Carta nova, adicionando ao deck");
        // Adiciona nova carta
        const tempId = `tmp-${Date.now()}`;
        const newCard = {
          deck_id: deckId,
          card_name: cardToAdd.name,
          scryfall_id: cardToAdd.id,
          image_url: cardToAdd.image_uris?.normal || cardToAdd.card_faces?.[0]?.image_uris?.normal || "",
          mana_cost: cardToAdd.mana_cost || "",
          type_line: cardToAdd.type_line || "",
          oracle_text: cardToAdd.oracle_text || "",
          acquired: false,
          quantity: 1,
          created_at: new Date(),
          card_faces: cardToAdd.card_faces || null,
        };

        // Adiciona otimisticamente
        const tempCard = { id: tempId, ...newCard, __optimistic: true };
        queryClient.setQueryData(["cards", deckId], (old = []) => [tempCard, ...old]);

        try {
          let docId;
          
          // ðŸŽ¯ Se Ã© deck local, salva localmente
          if (deckId && deckId.startsWith("local_")) {
            console.log("ðŸ’¾ Salvando carta LOCALMENTE...");
            docId = await localDeckManager.saveCardLocally(deckId, newCard);
            console.log("âœ… Carta salva localmente:", docId);
          } else {
            // Salva no Firebase
            docId = await addDocSilent("cards", newCard);
          }
          
          // Substitui o temporário pelo real
          queryClient.setQueryData(["cards", deckId], (old = []) =>
            old.map((c) => (c && c.id === tempId ? { id: docId, ...newCard } : c))
          );
          console.log("âœ… Carta adicionada com sucesso!");
        } catch (err) {
          console.error("Erro ao adicionar carta:", err);
          // Remove o temporário se falhar
          if (err.code !== "resource-exhausted") {
            queryClient.setQueryData(["cards", deckId], (old = []) => 
              old.filter((c) => c.id !== tempId)
            );
          }
        }
      }
    };

    addCardFromAdvancedSearch();
  }, [location.state?.addCard, deckId, isLoading]); // Dependências otimizadas

  // Reset do processedCards quando muda de deck
  useEffect(() => {
    processedCardsRef.current.clear();
    
    // Limpa sessionStorage de cartas antigas (mais de 1 hora)
    const now = Date.now();
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('card_added_')) {
        const timestamp = parseInt(sessionStorage.getItem(key) || '0');
        if (now - timestamp > 3600000) { // 1 hora
          sessionStorage.removeItem(key);
        }
      }
    });
  }, [deckId]);

  // ðŸ”§ Mutations
  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      // Usa função silenciosa que faz fallback para fila offline
      await updateDocSilent("cards", id, data);
      return { id, data };
    },
    onMutate: async ({ id, data }) => {
      // Cancelar refetches em andamento
      await queryClient.cancelQueries({ queryKey: ["cards", deckId] });
      
      // Snapshot do estado anterior para rollback
      const previousCards = queryClient.getQueryData(["cards", deckId]);
      
      // Atualização otimista
      queryClient.setQueryData(["cards", deckId], (old = []) =>
        old.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
      
      return { previousCards };
    },
    onError: (err, variables, context) => {
      // Rollback apenas para erros críticos (não quota/offline)
      if (err.code !== "resource-exhausted" && context?.previousCards) {
        queryClient.setQueryData(["cards", deckId], context.previousCards);
      }
    },
    onSuccess: ({ id, data }) => {
      // Sucesso silencioso - já está no cache otimista
      console.log("âœ… Card atualizado (cache/fila):", id);
      
      // ðŸ”„ Invalida E refetch imediatamente para garantir UI atualizada
      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      queryClient.refetchQueries({ queryKey: ["cards", deckId] });
    },
  });

  const deleteCardsMutation = useMutation({
    mutationFn: async (deletions) => {
      for (const { cardId, quantityToDelete } of deletions) {
        const card = cards.find((c) => c.id === cardId);
        if (!card) continue;

        if (quantityToDelete >= (card.quantity || 1)) {
          // Deleta documento completo (silencioso)
          await deleteDocSilent("cards", cardId);
        } else {
          // Atualiza quantidade (silencioso)
          await updateDocSilent("cards", cardId, {
            quantity: (card.quantity || 1) - quantityToDelete,
          });
        }
      }
      return deletions;
    },
    onMutate: async (deletions) => {
      // Cancelar refetches em andamento
      await queryClient.cancelQueries({ queryKey: ["cards", deckId] });
      
      // Snapshot do estado anterior
      const previousCards = queryClient.getQueryData(["cards", deckId]);
      
      // Atualização otimista já foi aplicada no DeleteQuantityDialog
      
      return { previousCards };
    },
    onError: (err, variables, context) => {
      // Rollback apenas para erros críticos
      if (err.code !== "resource-exhausted" && context?.previousCards) {
        console.error("Erro crítico ao deletar:", err);
        queryClient.setQueryData(["cards", deckId], context.previousCards);
      }
    },
    onSuccess: () => {
      // Sucesso - cache já está correto via optimistic update
      setSelectedCards([]);
      setIsSelectionMode(false);
      console.log("Cartas removidas (cache/fila)");
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await updateDocSilent("decks", id, data);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      await addDocSilent("messages", {
        ...messageData,
        created_at: new Date(),
      });
    },
  });

  // Atualiza contagem do deck
  useEffect(() => {
    if (deck && cards && !isViewOnly) {
      const totalCards = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);
      updateDeckMutation.mutate({
        id: deck.id,
        data: { card_count: totalCards },
      });
    }
  }, [cards, deck, isViewOnly, updateDeckMutation]);

  // ðŸ”Ž Adicionar carta pela SearchBar
  const searchCard = async (cardName) => {
    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
      );
      if (!response.ok) throw new Error("Carta não encontrada");
      const cardData = await response.json();

      const existingCard = cards.find((c) => c.scryfall_id === cardData.id);
      if (existingCard) {
        await updateCardMutation.mutateAsync({
          id: existingCard.id,
          data: { quantity: (existingCard.quantity || 1) + 1 },
        });
      } else {
        const newCard = {
          deck_id: deckId,
          card_name: cardData.name,
          scryfall_id: cardData.id,
          image_url:
            cardData.image_uris?.normal ||
            cardData.card_faces?.[0]?.image_uris?.normal ||
            "",
          mana_cost: cardData.mana_cost || "",
          type_line: cardData.type_line || "",
          acquired: false,
          quantity: 1,
          created_by: user?.email || "",
          created_at: new Date(),
        };
        const docId = await addDocSilent("cards", newCard);

        // Atualização otimista
        queryClient.setQueryData(["cards", deckId], (old = []) => [
          { id: docId, ...newCard },
          ...old,
        ]);
      }

      queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
    } catch (err) {
      setError(err.message || "Erro ao buscar carta");
    } finally {
      setIsSearching(false);
    }
  };

  // Handlers
  const handleToggleAcquired = (card) => {
    if (!isViewOnly) {
      updateCardMutation.mutate({
        id: card.id,
        data: { acquired: !card.acquired },
      });
    }
  };

  const handleToggleSelect = (cardId) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedCards.length > 0) {
      const cardsToRemove = cards.filter((c) => selectedCards.includes(c.id));
      setCardsToDelete(cardsToRemove);
      setShowDeleteDialog(true);
    }
  };

  const handleConfirmDelete = (quantities) => {
    const deletions = Object.entries(quantities).map(([cardId, quantity]) => ({
      cardId,
      quantityToDelete: quantity,
    }));
    deleteCardsMutation.mutate(deletions);
    setShowDeleteDialog(false);
    setCardsToDelete([]);
  };

  const handleShowArtSelector = (card) => {
    if (isViewOnly) return;
    setSelectedCardForArt(card);
    setShowArtSelector(true);
  };

  const handleSelectArt = (artData) => {
    if (selectedCardForArt && !isViewOnly) {
      const cardId = selectedCardForArt.id;
      setShowArtSelector(false);
      setSelectedCardForArt(null);
      queryClient.setQueryData(["cards", deckId], (old = []) => old?.map((c) => c.id === cardId ? { ...c, ...artData } : c) || old);
      updateCardMutation.mutate({ id: cardId, data: artData });
      setTimeout(() => queryClient.refetchQueries({ queryKey: ["cards", deckId] }), 100);
    }
  };

const handleOfferTrade = (card) => {
  setSelectedCardForTrade(card);
  setShowTradeDialog(true);
};

const handleConfirmTrade = async () => {
  if (selectedCardForTrade && user) {
    try {
      await sendMessageMutation.mutateAsync({
        recipient_id: "algumFriendId", // substitua pelo id real do amigo
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        message: `${user.full_name || user.email} tem ${selectedCardForTrade.card_name}, disponível para trade com você.`,
        card_name: selectedCardForTrade.card_name,
        type: "trade",
      });

      setShowTradeDialog(false);
      setSelectedCardForTrade(null);
      setError("Oferta de trade enviada com sucesso!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Erro ao enviar oferta de trade");
    }
  }
};

const totalCards = cards.reduce((sum, c) => sum + (c.quantity || 1), 0);

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
            <h1 className="text-lg font-bold text-white">{deck?.name}</h1>
            {isViewOnly && <Eye className="w-4 h-4 text-blue-400" />}
          </div>
          <p className="text-sm text-gray-400">
            {deck?.format} • {totalCards} cartas
            {isViewOnly && ` • ${friendName}`}
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
            className={error.includes("sucesso") ? "text-green-400" : ""}
          >
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )}

    {/* Grid de cartas */}
    <div className="p-4">
      {cards.length === 0 && !isLoading ? (
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
            {cards.map((card) => (
              <CardGridItem
                key={card.id}
                card={card}
                onToggleAcquired={handleToggleAcquired}
                isSelectionMode={isSelectionMode && !isViewOnly}
                isSelected={selectedCards.includes(card.id)}
                onToggleSelect={handleToggleSelect}
                onShowArtSelector={handleShowArtSelector}
                onOfferTrade={handleOfferTrade}
                isViewOnly={isViewOnly}
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
          {selectedCards.length}{" "}
          {selectedCards.length === 1
            ? "carta selecionada"
            : "cartas selecionadas"}
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
      isLoading={deleteCardsMutation.isLoading}
    />

    <TradeConfirmDialog
      isOpen={showTradeDialog}
      onClose={() => {
        setShowTradeDialog(false);
        setSelectedCardForTrade(null);
      }}
      card={selectedCardForTrade}
      onConfirm={handleConfirmTrade}
    />
  </div>
);
}

export default DeckBuilder;





import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { addDocSilent } from "@/lib/firestoreSilent";
import AdvancedSearchForm from "./AdvancedSearchForm";
import SearchResultsGrid from "./SearchResultsGrid";
import CardZoomModal from "./CardZoomModal";
import { X } from "lucide-react";

interface AdvancedSearchPageProps {
  onClose: () => void;
}

export default function AdvancedSearchPage({ onClose }: AdvancedSearchPageProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user] = useAuthState(auth);
  const [cards, setCards] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [selectedCardForDeck, setSelectedCardForDeck] = useState<any | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // 🔧 Normaliza o formato removendo caracteres estranhos
  const normalizeFormat = (format: string) => {
    if (!format) return "Casual";
    
    const normalized = format
      .replace(/[^\x20-\x7E]/g, '') // Remove caracteres não-ASCII
      .trim();
    
    const formatMap: { [key: string]: string } = {
      'Standard': 'Standard',
      'Modern': 'Modern',
      'Commander': 'Commander',
      'Commander 300': 'Commander 300',
      'Commander 500': 'Commander 500',
      'Legacy': 'Legacy',
      'Vintage': 'Vintage',
      'Pioneer': 'Pioneer',
      'Pauper': 'Pauper',
      'Historic': 'Historic',
      'Casual': 'Casual'
    };
    
    return formatMap[normalized] || normalized || 'Casual';
  };

  // Busca decks do usuário
  const { data: decks } = useQuery({
    queryKey: ["decks", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const q = query(collection(db, "decks"), where("ownerId", "==", user.uid));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!user,
  });

  async function handleSearch(query: string) {
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      setCards(data.data || []);
      setIsFilterOpen(false); // Fecha o filtro após buscar
    } catch (err) {
      console.error("Erro ao buscar cartas:", err);
    }
  }

  function handleAddToDeckClick(card: any) {
    setSelectedCardForDeck(card);
    setSelectedDeckId(null);
    setShowDeckSelector(true);
    setSelectedCard(null);
  }

  async function handleAddToExistingDeck() {
    if (!selectedDeckId) {
      return;
    }

    console.log("🔍 Redirecionando para deck:", selectedDeckId);
    console.log("🎴 Carta a ser adicionada:", selectedCardForDeck?.name);
    
    if (!selectedCardForDeck) {
      console.warn("⚠️ Nenhuma carta selecionada!");
      return;
    }

    // Fecha modais
    setShowDeckSelector(false);
    onClose(); // Fecha a página de busca avançada
    
    // Redireciona para o deck com a carta no estado
    navigate(`/deckbuilder/${selectedDeckId}`, {
      state: {
        addCard: {
          id: selectedCardForDeck.id,
          name: selectedCardForDeck.name,
          image_uris: selectedCardForDeck.image_uris,
          card_faces: selectedCardForDeck.card_faces,
          mana_cost: selectedCardForDeck.mana_cost || "",
          type_line: selectedCardForDeck.type_line || "",
          oracle_text: selectedCardForDeck.oracle_text || "",
        }
      }
    });
  }

  async function handleCreateNewDeck() {
    if (!newDeckName.trim() || !user || !selectedCardForDeck) return;

    console.log("🎴 Criando novo deck:", newDeckName, "com carta:", selectedCardForDeck.name);
    
    setIsCreatingDeck(true);
    try {
      const deckId = await addDocSilent("decks", {
        ownerId: user.uid,
        name: newDeckName.trim(),
        format: "Commander",
        cards: [],
        createdAt: new Date(),
      });

      console.log("✅ Deck criado com ID:", deckId);

      // Adiciona a carta ao deck recém-criado
      const cardId = await addDocSilent("cards", {
        deck_id: deckId,
        card_name: selectedCardForDeck.name,
        scryfall_id: selectedCardForDeck.id,
        image_url: selectedCardForDeck.image_uris?.normal || selectedCardForDeck.card_faces?.[0]?.image_uris?.normal,
        quantity: 1,
        mana_cost: selectedCardForDeck.mana_cost || "",
        type_line: selectedCardForDeck.type_line || "",
        oracle_text: selectedCardForDeck.oracle_text || "",
      });

      console.log("✅ Carta adicionada ao deck com ID:", cardId);
      alert("Deck criado e carta adicionada!");
      setShowDeckSelector(false);
      setSelectedCardForDeck(null);
      setNewDeckName("");
    } catch (err: any) {
      console.error("❌ Erro ao criar deck:", err);
      alert("Erro ao criar deck: " + (err?.message || "Erro desconhecido"));
    } finally {
      setIsCreatingDeck(false);
    }
  }

  // 🆕 Redireciona para página de criação de deck com a carta selecionada
  function handleGoToCreateDeck() {
    if (!selectedCardForDeck) return;
    
    console.log("🎯 Redirecionando para criar deck com carta:", selectedCardForDeck.name);
    
    // Fecha o modal de seleção de deck
    setShowDeckSelector(false);
    
    // Fecha a busca avançada
    onClose();
    
    // Navega para a página de criação de deck com a carta no state
    navigate("/create", { 
      state: { 
        cardToAdd: {
          card_name: selectedCardForDeck.name,
          scryfall_id: selectedCardForDeck.id,
          image_url: selectedCardForDeck.image_uris?.normal || selectedCardForDeck.card_faces?.[0]?.image_uris?.normal,
          quantity: 1,
          mana_cost: selectedCardForDeck.mana_cost || "",
          type_line: selectedCardForDeck.type_line || "",
          oracle_text: selectedCardForDeck.oracle_text || "",
        }
      } 
    });
  }

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header fixo */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white">Busca Avançada</h1>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
        >
          <X className="w-5 h-5" />
          Fechar
        </button>
      </div>

      {/* Container principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Painel de filtros expansível */}
        <div 
          className={`bg-gray-800 border-b border-gray-700 transition-all duration-300 ease-in-out overflow-hidden ${
            isFilterOpen ? 'max-h-[500px]' : 'max-h-0'
          }`}
        >
          <div className="overflow-y-auto max-h-[500px]">
            <AdvancedSearchForm onSearch={handleSearch} />
          </div>
        </div>

        {/* Barra de toggle (barrinha branca) */}
        <div className="bg-gray-800 border-b border-gray-700 flex justify-center py-2 cursor-pointer hover:bg-gray-750"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <div className="w-16 h-1 bg-white rounded-full"></div>
        </div>

        {/* Grid de resultados */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>Use os filtros acima para buscar cartas</p>
            </div>
          ) : (
            <SearchResultsGrid
              cards={cards}
              onCardLongPress={(card: any) => setSelectedCard(card)}
            />
          )}
        </div>
      </div>

      {/* Modal de zoom da carta */}
      {selectedCard && (
        <CardZoomModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onAddToDeck={() => handleAddToDeckClick(selectedCard)}
        />
      )}

      {/* Modal de seleção de deck */}
      {showDeckSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-10 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-100">
              Adicionar ao Deck
            </h2>

            {/* Lista de decks existentes */}
            {decks && decks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-3">
                  Selecione um Deck
                </h3>
                <div className="flex flex-col gap-2 mb-4">
                  {decks.map((deck: any) => (
                    <button
                      key={deck.id}
                      onClick={() => {
                        console.log("🖱️ Deck selecionado:", deck.name, "ID:", deck.id);
                        setSelectedDeckId(deck.id);
                      }}
                      className={`w-full rounded-lg px-4 py-3 text-gray-100 transition-all text-left ${
                        selectedDeckId === deck.id 
                          ? 'bg-blue-600 border-2 border-blue-400 shadow-lg shadow-blue-500/50' 
                          : 'bg-gray-700 border-2 border-transparent hover:bg-gray-600'
                      }`}
                    >
                      <div className="font-medium">{deck.name}</div>
                      <div className="text-sm text-gray-300">{normalizeFormat(deck.format)}</div>
                    </button>
                  ))}
                </div>

                {/* Botão Adicionar */}
                <button
                  onClick={handleAddToExistingDeck}
                  disabled={!selectedDeckId}
                  className={`w-full rounded-lg px-4 py-3 font-medium transition-colors mb-4 ${
                    selectedDeckId
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedDeckId ? 'Adicionar ao Deck Selecionado' : 'Selecione um Deck Primeiro'}
                </button>
              </div>
            )}

            {/* Botão de criar novo deck */}
            <button
              onClick={handleGoToCreateDeck}
              className="w-full rounded-lg bg-orange-500 px-4 py-3 text-white font-medium hover:bg-orange-600 transition-colors mb-4"
            >
              Criar novo deck
            </button>

            <button
              onClick={() => {
                setShowDeckSelector(false);
                setSelectedCardForDeck(null);
                setSelectedDeckId(null);
                setNewDeckName("");
              }}
              className="w-full rounded-lg bg-gray-700 px-4 py-2 text-gray-200 hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

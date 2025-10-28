// src/pages/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, query, where } from "@/firebase";
import { auth, db } from "@/firebase";
import { useAuthState } from "@/hooks/useAuthState";
import { Search } from "lucide-react";
import { updateDocSilent, deleteDocSilent, batchDeleteSilent } from "@/lib/firestoreSilent";
import { localDeckManager } from "@/lib/localDeckManager";
import { useDebounce } from "@/hooks/useDebounce";

// 🔗 Import do menu de usuário (popup de perfil)
import UserMenu from "@/components/user/UserMenu";
// ✅ Import do componente de busca de regras
import SearchRulesDialog from "@/components/rules/SearchRulesDialog";
// 🔍 Import do componente de busca avançada
import AdvancedSearchPage from "@/components/advanced-search/AdvancedSearchPage";
// 🔄 Import do painel de debug de sincronização
import SyncDebugPanel from "@/components/ui/SyncDebugPanel";

// 🔒 Email do desenvolvedor com acesso ao painel de debug
const DEV_EMAIL = "moudorskingdom@gmail.com";

function Home() {
  const navigate = useNavigate();
  const [user] = useAuthState();
  const [showSyncPanel, setShowSyncPanel] = useState(true);

  // � Normaliza o formato removendo caracteres estranhos
  const normalizeFormat = (format) => {
    if (!format) return "Casual";
    
    // Remove caracteres especiais e normaliza
    const normalized = format
      .replace(/[^\x20-\x7E]/g, '') // Remove caracteres não-ASCII
      .trim();
    
    // Mapeia formatos conhecidos
    const formatMap = {
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

  // �🔎 Estados dos modais de busca
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

  // ⭐ Estados da busca de capa
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);
  const [deckForCover, setDeckForCover] = useState(null);
  const [coverSearchTerm, setCoverSearchTerm] = useState("");
  const [coverSuggestions, setCoverSuggestions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // 🎯 Estados do modal de opções de deck
  const [deckOptionsOpen, setDeckOptionsOpen] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState(null);
  
  // 📝 Estados do dialog de renomear
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  
  // 🗑️ Estados do dialog de apagar deck
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 📋 Estados do dialog de mudar formato
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [newFormat, setNewFormat] = useState("");
  
  // � Estado para exportar para Arena
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();

  const { data: decks, isLoading, refetch } = useQuery({
    queryKey: ["decks", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("🔍 Buscando decks do Firebase E IndexedDB...");
      
      // 1️⃣ Busca decks do Firebase
      const q = query(collection(db, "decks"), where("ownerId", "==", user.uid));
      const snapshot = await getDocs(q);
      const firebaseDecks = snapshot.docs.map((doc) => ({ 
        id: doc.id, 
        ...doc.data(),
        _source: "firebase" 
      }));
      
      // 2️⃣ Busca decks locais do IndexedDB
      const localDecksObj = await localDeckManager.getLocalDecks();
      const localDecks = Object.values(localDecksObj)
        .filter(deck => deck.ownerId === user.uid)
        .map(deck => ({
          ...deck,
          _source: "local"
        }));
      
      // 3️⃣ Combina e ordena por data de criação (mais recentes primeiro)
      const allDecks = [...firebaseDecks, ...localDecks].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB - dateA;
      });
      
      console.log(`✅ ${firebaseDecks.length} decks do Firebase + ${localDecks.length} decks locais = ${allDecks.length} total`);
      
      return allDecks;
    },
    enabled: !!user,
  });

  const hasDecks = decks && decks.length > 0;

  // 🔎 Debounce na busca de capa
  const debouncedCoverSearch = useDebounce(coverSearchTerm, 500);

  // 🔎 Efeito para buscar sugestões quando debounce estabilizar
  React.useEffect(() => {
    if (debouncedCoverSearch.length < 3) {
      setCoverSuggestions([]);
      return;
    }
    
    const fetchSuggestions = async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(debouncedCoverSearch)}`
        );
        const data = await res.json();
        setCoverSuggestions(data.data || []);
      } catch {
        setCoverSuggestions([]);
      } finally {
        setLoadingSearch(false);
      }
    };
    
    fetchSuggestions();
  }, [debouncedCoverSearch]);

  // 🔎 Handler apenas atualiza o termo (debounce faz o resto)
  const handleSearchAutocomplete = (term) => {
    setCoverSearchTerm(term);
  };

  // ✅ Selecionar carta e salvar como capa
  const handleSelectCover = async (cardName) => {
    const deckId = deckForCover.id;
    
    // Fecha o modal primeiro
    setCoverSearchOpen(false);
    setCoverSearchTerm("");
    setCoverSuggestions([]);
    
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
      );
      const data = await res.json();
      const image = data.image_uris?.art_crop || data.card_faces?.[0]?.image_uris?.art_crop;

      // Atualiza o cache local diretamente (otimista)
      queryClient.setQueryData(["decks", user?.uid], (oldDecks) => {
        if (!oldDecks) return oldDecks;
        return oldDecks.map((deck) =>
          deck.id === deckId
            ? { ...deck, coverImage: image }
            : deck
        );
      });

      // Salva em background
      await updateDocSilent("decks", deckId, { coverImage: image });
    } catch (err) {
      console.error("Erro ao salvar capa:", err);
    }
  };

  // 📝 Renomear deck
  const handleRenameDeck = async () => {
    if (!newDeckName.trim() || !selectedDeck) return;
    
    const deckId = selectedDeck.id;
    const newName = newDeckName.trim();
    
    // Fecha TUDO primeiro
    setRenameDialogOpen(false);
    setDeckOptionsOpen(false);
    setNewDeckName("");
    setSelectedDeck(null);
    
    // Atualiza o cache local diretamente (otimista)
    queryClient.setQueryData(["decks", user?.uid], (oldDecks) => {
      if (!oldDecks) return oldDecks;
      return oldDecks.map((deck) =>
        deck.id === deckId
          ? { ...deck, name: newName }
          : deck
      );
    });
    
    // Atualiza também o cache do Deckbuilder
    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;
      return { ...oldDeck, name: newName };
    });
    
    // Salva em background
    try {
      await updateDocSilent("decks", deckId, { name: newName });
    } catch (err) {
      console.error("Erro ao renomear deck:", err);
    }
  };

  // 🗑️ Apagar deck
  const handleDeleteDeck = async () => {
    if (!selectedDeck || isDeleting) return;
    
    const deckId = selectedDeck.id;
    const deckName = selectedDeck.name;
    const isLocalDeck = deckId.startsWith('local_');
    
    console.log(`🗑️ Apagando deck ${isLocalDeck ? 'LOCAL' : 'FIREBASE'}:`, deckName);
    console.log(`🔍 DeckId:`, deckId);
    console.log(`🔍 Deck completo:`, selectedDeck);
    setIsDeleting(true);
    
    try {
      if (isLocalDeck) {
        // ============ DECK LOCAL ============
        console.log("📦 Deletando deck local do IndexedDB...");
        
        // 1️⃣ Busca e deleta todas as cartas locais
        console.log("🔍 Buscando cartas locais...");
        const localCards = await localDeckManager.getDeckCards(deckId);
        console.log(`📊 Encontradas ${localCards.length} cartas locais`);
        
        if (localCards.length > 0) {
          for (const card of localCards) {
            console.log(`🗑️ Deletando carta local: ${card.card_name}`);
            await localDeckManager.deleteCardLocally(card.id);
          }
          console.log(`✅ ${localCards.length} cartas locais deletadas do deck ${deckName}`);
        }
        
        // 2️⃣ Deleta o deck local
        console.log("🗑️ Deletando deck local...");
        await localDeckManager.deleteDeckLocally(deckId);
        console.log("✅ Deck local deletado:", deckName);
        
      } else {
        // ============ DECK FIREBASE ============
        console.log("☁️ Deletando deck do Firebase...");
        
        // 1️⃣ Busca todas as cartas do deck
        console.log("🔍 Buscando cartas no Firebase...");
        const cardsQuery = query(collection(db, "cards"), where("deck_id", "==", deckId));
        const cardsSnapshot = await getDocs(cardsQuery);
        console.log(`📊 Encontradas ${cardsSnapshot.docs.length} cartas no Firebase`);
        
        // 2️⃣ Deleta todas as cartas primeiro
        const cardIds = cardsSnapshot.docs.map(doc => doc.id);
        if (cardIds.length > 0) {
          console.log(`🗑️ Deletando ${cardIds.length} cartas...`);
          await batchDeleteSilent("cards", cardIds);
          console.log(`✅ ${cardIds.length} cartas deletadas do deck ${deckName}`);
        }
        
        // 3️⃣ Deleta o deck
        console.log("🗑️ Deletando deck do Firebase...");
        await deleteDocSilent("decks", deckId);
        console.log("✅ Deck do Firebase deletado:", deckName);
      }
      
      // 4️⃣ Atualiza o cache local (otimista)
      queryClient.setQueryData(["decks", user?.uid], (oldDecks) => {
        if (!oldDecks) return oldDecks;
        return oldDecks.filter((deck) => deck.id !== deckId);
      });
      
      // 5️⃣ Invalida queries relacionadas
      queryClient.removeQueries(["deck", deckId]);
      queryClient.removeQueries(["cards", deckId]);
      
      // 6️⃣ Fecha os modais
      setDeleteDialogOpen(false);
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
      
      console.log("🎉 Deck apagado com sucesso!");
      
    } catch (err) {
      console.error("❌ Erro ao apagar deck:", err);
      alert(`Erro ao apagar deck: ${err.message}\n\nO deck pode ter sido marcado para exclusão quando a internet estiver disponível.`);
      
      // Tenta atualizar o cache mesmo assim
      queryClient.invalidateQueries(["decks", user?.uid]);
      
      // Fecha os modais mesmo em caso de erro
      setDeleteDialogOpen(false);
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
    } finally {
      setIsDeleting(false);
    }
  }; // Fim handleDeleteDeck

  // 📋 Mudar formato do deck
  const handleChangeFormat = async () => {
    if (!newFormat.trim() || !selectedDeck) return;
    
    const deckId = selectedDeck.id;
    const format = newFormat.trim();
    
    // Fecha TUDO primeiro
    setFormatDialogOpen(false);
    setDeckOptionsOpen(false);
    setNewFormat("");
    setSelectedDeck(null);
    
    // Atualiza o cache local diretamente (otimista)
    queryClient.setQueryData(["decks", user?.uid], (oldDecks) => {
      if (!oldDecks) return oldDecks;
      return oldDecks.map((deck) =>
        deck.id === deckId
          ? { ...deck, format: format }
          : deck
      );
    });
    
    // Atualiza também o cache do Deckbuilder
    queryClient.setQueryData(["deck", deckId], (oldDeck) => {
      if (!oldDeck) return oldDeck;
      return { ...oldDeck, format: format };
    });
    
    // Salva em background
    try {
      await updateDocSilent("decks", deckId, { format: format });
    } catch (err) {
      console.error("Erro ao mudar formato:", err);
    }
  };

  // �🎮 Exportar para Magic Arena
  const handleExportToArena = async () => {
    if (!selectedDeck) return;
    
    setIsExporting(true);
    try {
      const q = query(
        collection(db, "cards"),
        where("deck_id", "==", selectedDeck.id)
      );
      const snapshot = await getDocs(q);
      const cards = snapshot.docs.map((doc) => doc.data());

      const arenaFormat = cards
        .map((card) => `${card.quantity} ${card.card_name}`)
        .join("\n");

      await navigator.clipboard.writeText(arenaFormat);
      alert("Deck copiado para Magic Arena! Cole no jogo.");
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
    } catch (err) {
      console.error("Erro ao exportar para Arena:", err);
      alert("Erro ao exportar deck. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gradient-to-br from-gray-900 to-black text-white">
      {/* 🔗 Popup de perfil (UserMenu) */}
      <div className="fixed top-6 right-6">
        <UserMenu />
      </div>

      <div className="flex h-full flex-col items-center px-4 pt-20">
        <h1 className="mb-6 text-3xl font-bold">Meus Decks</h1>

        {isLoading && <p>Carregando decks...</p>}

        {!isLoading && !hasDecks && (
          <button
            onClick={() => navigate("/create")}
            className="rounded-lg bg-orange-500 px-6 py-3 text-lg font-semibold text-white shadow hover:bg-orange-600"
          >
            Adicionar um novo deck
          </button>
        )}

        {hasDecks && (
          <div className="w-full max-w-lg overflow-y-auto max-h-[calc(100vh-200px)] pb-24 scrollbar-hide space-y-6">
            {decks?.map((deck) => (
              <div
                key={deck.id}
                className="relative cursor-pointer overflow-hidden rounded-xl shadow-lg min-h-[240px] flex-shrink-0"
                onClick={() => navigate(`/deckbuilder/${deck.id}`)}
              >
                <div
                  className="h-56 w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${deck.coverImage || "https://placehold.co/400x200"})`,
                  }}
                />

                {/* Botão de opções (substituindo estrela) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectedDeck(deck);
                    setDeckOptionsOpen(true);
                  }}
                  className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 text-lg"
                >
                  ⚙
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                  <h2 className="text-2xl font-bold">{deck.name}</h2>
                  <p className="text-base text-gray-300">{normalizeFormat(deck.format)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasDecks && (
        <button
          onClick={() => navigate("/create")}
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-600"
        >
          +
        </button>
      )}

      {/* 🔎 Botão de busca */}
      <button
        onClick={() => setSearchOptionsOpen(!searchOptionsOpen)}
        className="fixed bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500 text-white shadow-lg hover:bg-purple-600 z-50"
      >
        <Search className="w-6 h-6" />
      </button>

      {/* 🔎 Menu de opções de busca (slide de baixo pra cima) */}
      {searchOptionsOpen && (
        <div className="fixed bottom-24 left-6 flex flex-col gap-2 z-40">
          {/* Buscar Carta */}
          <button
            onClick={() => {
              setSearchOptionsOpen(false);
              setRulesDialogOpen(true);
            }}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white text-sm font-medium hover:bg-gray-600 transition-all shadow-lg"
          >
            Buscar Carta
          </button>

          {/* Busca Avançada */}
          <button
            onClick={() => {
              setSearchOptionsOpen(false);
              setAdvancedSearchOpen(true);
            }}
            className="rounded-lg bg-gray-700 px-4 py-2 text-white text-sm font-medium hover:bg-gray-600 transition-all shadow-lg"
          >
            Busca Avançada
          </button>
        </div>
      )}

      {/* Dialog de busca de carta (regras) */}
      <SearchRulesDialog
        isOpen={rulesDialogOpen}
        onClose={() => setRulesDialogOpen(false)}
      />

      {/* Dialog de busca avançada */}
      {advancedSearchOpen && (
        <AdvancedSearchPage onClose={() => setAdvancedSearchOpen(false)} />
      )}

      {/* ⭐ Barra de busca independente para capa */}
      {coverSearchOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center p-10 z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              Escolher capa para {deckForCover?.name}
            </h2>
            <input
              type="text"
              value={coverSearchTerm}
              onChange={(e) => handleSearchAutocomplete(e.target.value)}
              placeholder="Digite o nome da carta..."
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {loadingSearch && <p className="mt-2 text-sm text-gray-400">Buscando...</p>}
            <ul className="mt-3 max-h-40 overflow-y-auto">
              {coverSuggestions.map((sug) => (
                <li
                  key={sug}
                  onClick={() => handleSelectCover(sug)}
                  className="cursor-pointer px-2 py-1 hover:bg-gray-700 rounded"
                >
                  {sug}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setCoverSearchOpen(false)}
              className="mt-4 rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* 🎯 Modal de opções do deck */}
      {deckOptionsOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-10 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-gray-100">
              {selectedDeck?.name}
            </h2>
            
            <div className="flex flex-col gap-2">
              {/* Renomear Deck */}
              <button
                onClick={() => {
                  setNewDeckName(selectedDeck?.name || "");
                  setRenameDialogOpen(true);
                }}
                className="w-full rounded-lg bg-gray-700 px-4 py-3 text-gray-100 hover:bg-gray-600 transition-colors text-left font-medium"
              >
                Renomear Deck
              </button>

              {/* Alterar Capa */}
              <button
                onClick={() => {
                  setDeckForCover(selectedDeck);
                  setCoverSearchOpen(true);
                  setDeckOptionsOpen(false);
                }}
                className="w-full rounded-lg bg-gray-700 px-4 py-3 text-gray-100 hover:bg-gray-600 transition-colors text-left font-medium"
              >
                Alterar Capa
              </button>

              {/* Mudar Formato */}
              <button
                onClick={() => {
                  setNewFormat(selectedDeck?.format || "");
                  setFormatDialogOpen(true);
                }}
                className="w-full rounded-lg bg-gray-700 px-4 py-3 text-gray-100 hover:bg-gray-600 transition-colors text-left font-medium"
              >
                Mudar Formato
              </button>

              {/* Copiar para Magic Arena */}
              <button
                onClick={handleExportToArena}
                disabled={isExporting}
                className="w-full rounded-lg bg-gray-700 px-4 py-3 text-gray-100 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors text-left font-medium"
              >
                {isExporting ? "Exportando..." : "Copiar para Magic Arena"}
              </button>

              {/* Apagar Deck */}
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="w-full rounded-lg bg-red-600 px-4 py-3 text-white hover:bg-red-700 transition-colors text-left font-medium"
              >
                Apagar Deck
              </button>
            </div>

            <button
              onClick={() => {
                setDeckOptionsOpen(false);
                setSelectedDeck(null);
              }}
              className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 text-gray-300 hover:bg-black hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 📝 Dialog de renomear deck */}
      {renameDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-10 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-100">
              Renomear Deck
            </h2>
            
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              placeholder="Digite o novo nome..."
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newDeckName.trim()) {
                  handleRenameDeck();
                }
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={handleRenameDeck}
                disabled={!newDeckName.trim()}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-white font-medium hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Salvar
              </button>
              
              <button
                onClick={() => {
                  setRenameDialogOpen(false);
                  setNewDeckName("");
                }}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2.5 text-gray-200 font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ Dialog de confirmação de apagar deck */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-10 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-red-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-red-500">
              Apagar Deck
            </h2>
            
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja apagar o deck <span className="font-bold text-white">"{selectedDeck?.name}"</span>?
            </p>
            
            <p className="text-sm text-red-400 mb-6">
              ⚠️ Esta ação não pode ser desfeita. Todas as cartas do deck também serão removidas.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteDeck}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Apagando..." : "Apagar"}
              </button>
              
              <button
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2.5 text-gray-200 font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 Dialog de mudar formato */}
      {formatDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-10 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-100">
              Mudar Formato do Deck
            </h2>
            
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => setNewFormat("Commander")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Commander"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Commander
              </button>
              
              <button
                onClick={() => setNewFormat("Commander 300")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Commander 300"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Commander 300
              </button>
              
              <button
                onClick={() => setNewFormat("Commander 500")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Commander 500"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Commander 500
              </button>
              
              <button
                onClick={() => setNewFormat("Standard")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Standard"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Standard
              </button>
              
              <button
                onClick={() => setNewFormat("Modern")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Modern"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Modern
              </button>
              
              <button
                onClick={() => setNewFormat("Pioneer")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Pioneer"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Pioneer
              </button>
              
              <button
                onClick={() => setNewFormat("Pauper")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Pauper"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Pauper
              </button>
              
              <button
                onClick={() => setNewFormat("Legacy")}
                className={`rounded-lg px-4 py-3 font-medium transition-all ${
                  newFormat === "Legacy"
                    ? "bg-orange-500 text-white ring-2 ring-orange-400"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                }`}
              >
                Legacy
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangeFormat}
                disabled={!newFormat.trim()}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-white font-medium hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                Salvar
              </button>
              
              <button
                onClick={() => {
                  setFormatDialogOpen(false);
                  setNewFormat("");
                }}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2.5 text-gray-200 font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 Painel de Debug de Sincronização (apenas para desenvolvimento e dev autorizado) */}
      {process.env.NODE_ENV === 'development' && user?.email === DEV_EMAIL && (
        <>
          {/* Botão toggle flutuante - CENTRALIZADO */}
          <button
            onClick={() => setShowSyncPanel(!showSyncPanel)}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
            title={showSyncPanel ? "Ocultar painel de sincronização" : "Mostrar painel de sincronização"}
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {showSyncPanel ? (
                // Ícone de "fechar" (X)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                // Ícone de "database/storage"
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              )}
            </svg>
          </button>

          {/* Painel de debug - CENTRALIZADO */}
          {showSyncPanel && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-96 z-40">
              <SyncDebugPanel />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Home;


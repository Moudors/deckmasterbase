// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useDecks } from "@/lib/useUnifiedDecks";
import { useConnectivity } from "@/lib/connectivityManager";
import { useAuthState } from "@/hooks/useAuthState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Search, WifiOff, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🔗 Import do menu de usuário (popup de perfil)
import UserMenu from "@/components/user/UserMenu";
// ✅ Import do componente de busca de regras
import SearchRulesDialog from "@/components/rules/SearchRulesDialog";
// 🔍 Import do componente de busca avançada
import AdvancedSearchPage from "@/components/advanced-search/AdvancedSearchPage";

function Home() {
  const navigate = useNavigate();
  const [user] = useAuthState();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user);
  const connectivity = useConnectivity();

  // Novo sistema unificado de decks
  const {
    decks,
    isLoading,
    error: decksError,
    createDeck,
    updateDeck,
    deleteDeck,
    syncDecks,
    refetch,
    createError,
    updateError,
    deleteError
  } = useDecks();

  const queryClient = useQueryClient();

  // Estados para funcionalidades da UI
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [deckOptionsOpen, setDeckOptionsOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newFormat, setNewFormat] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Estados para busca (cartas e capa)
  const [searchOptionsOpen, setSearchOptionsOpen] = useState(false);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);
  const [deckForCover, setDeckForCover] = useState(null);
  const [coverSearchTerm, setCoverSearchTerm] = useState("");
  const [coverSuggestions, setCoverSuggestions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Hook de debounce para busca de capa
  const debouncedCoverSearchTerm = useDebounce(coverSearchTerm, 500);

  // Efeito para busca automática de cartas para capa
  useEffect(() => {
    if (debouncedCoverSearchTerm && coverSearchOpen) {
      handleSearchAutocomplete(debouncedCoverSearchTerm);
    }
  }, [debouncedCoverSearchTerm, coverSearchOpen]);

  // Computadas
  const hasDecks = decks && decks.length > 0;
  const isOfflineMode = !connectivity.canSaveData;

  // 🔍 Debug logs para identificar problema
  console.log("🏠 HOME DEBUG:", {
    isLoading,
    decksError,
    decks: decks ? { length: decks.length, items: decks.map(d => ({ id: d.id, name: d.name })) } : null,
    hasDecks,
    user: user ? { id: user.id, email: user.email } : null
  });

  // Funções auxiliares
  const normalizeFormat = (format) => {
    if (!format) return "Commander";
    const lower = format.toLowerCase();
    if (lower.includes("commander")) {
      if (lower.includes("300")) return "Commander 300";
      if (lower.includes("500")) return "Commander 500";
      return "Commander";
    }
    return format.charAt(0).toUpperCase() + format.slice(1);
  };

  // Função para busca automática de cartas para capa
  const handleSearchAutocomplete = async (searchTerm) => {
    if (searchTerm.length < 2) {
      setCoverSuggestions([]);
      return;
    }

    setLoadingSearch(true);
    try {
      // Primeiro buscar autocomplete para nomes
      const autocompleteResponse = await fetch(
        `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(searchTerm)}`
      );
      if (!autocompleteResponse.ok) throw new Error("Erro na busca");
      
      const autocompleteData = await autocompleteResponse.json();
      const cardNames = autocompleteData.data || [];
      
      // Para os primeiros 5 resultados, buscar dados completos para mostrar preview
      const previewPromises = cardNames.slice(0, 5).map(async (cardName) => {
        try {
          const cardResponse = await fetch(
            `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`
          );
          if (cardResponse.ok) {
            const cardData = await cardResponse.json();
            return {
              name: cardName,
              image_url: getCardImageUrl(cardData, 0), // Usar helper para dual-face
              has_art_crop: hasArtCrop(cardData), // Usar helper para verificar art_crop
              is_dual_face: !!cardData.card_faces
            };
          }
        } catch (e) {
          // Se falhar, retornar apenas o nome
          return { name: cardName, image_url: null, has_art_crop: false };
        }
        return { name: cardName, image_url: null, has_art_crop: false };
      });
      
      // Aguardar todas as buscas de preview (com timeout)
      const previewResults = await Promise.allSettled(previewPromises);
      const enrichedSuggestions = previewResults.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        return { name: cardNames[index], image_url: null, has_art_crop: false };
      });
      
      // Adicionar os nomes restantes sem preview
      const remainingNames = cardNames.slice(5).map(name => ({
        name,
        image_url: null,
        has_art_crop: false
      }));
      
      setCoverSuggestions([...enrichedSuggestions, ...remainingNames]);
    } catch (error) {
      console.error("❌ Erro ao buscar cartas:", error);
      setCoverSuggestions([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Função para selecionar capa do deck
  // Função helper para extrair URL de imagem de cartas (incluindo dual-face)
  const getCardImageUrl = (cardData, preferredFace = 0) => {
    // Função para extrair imagem de image_uris
    const extractImageFromUris = (uris) => {
      if (!uris) return null;
      return uris.art_crop || uris.large || uris.normal || uris.border_crop;
    };

    // Se tem image_uris no nível raiz (cartas normais)
    if (cardData.image_uris) {
      return extractImageFromUris(cardData.image_uris);
    }

    // Se tem card_faces (cartas de duas faces)
    if (cardData.card_faces && cardData.card_faces.length > 0) {
      // Usar a face especificada ou a primeira
      const faceIndex = Math.min(preferredFace, cardData.card_faces.length - 1);
      const selectedFace = cardData.card_faces[faceIndex];
      
      if (selectedFace.image_uris) {
        return extractImageFromUris(selectedFace.image_uris);
      }
    }

    return null;
  };

  // Função helper para verificar se tem art_crop disponível
  const hasArtCrop = (cardData) => {
    // Verificar no nível raiz
    if (cardData.image_uris?.art_crop) return true;
    
    // Verificar nas faces
    if (cardData.card_faces) {
      return cardData.card_faces.some(face => face.image_uris?.art_crop);
    }
    
    return false;
  };

  const handleSelectCover = async (cardName) => {
    console.log('🖼️ COVER FUNCTION - Starting with:', cardName);
    console.log('🖼️ COVER FUNCTION - DeckForCover:', deckForCover);
    
    if (!deckForCover) {
      console.log('❌ COVER FUNCTION - No deck selected');
      return;
    }

    try {
      console.log('🌐 COVER FUNCTION - Fetching from Scryfall...');
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      
      console.log('📡 COVER FUNCTION - Response status:', response.status);
      if (!response.ok) throw new Error("Carta não encontrada");
      
      const cardData = await response.json();
      console.log('🎴 COVER FUNCTION - Card data:', cardData.name);
      console.log('🔍 COVER FUNCTION - Card type:', {
        has_image_uris: !!cardData.image_uris,
        has_card_faces: !!cardData.card_faces,
        faces_count: cardData.card_faces?.length || 0
      });
      
      // Usar função helper para extrair imagem (suporta dual-face)
      const imageUrl = getCardImageUrl(cardData, 0); // Usar primeira face por padrão
      
      console.log('🖼️ COVER FUNCTION - Available image formats:');
      if (cardData.image_uris) {
        console.log('  Normal card:', {
          art_crop: cardData.image_uris?.art_crop ? '✅' : '❌',
          large: cardData.image_uris?.large ? '✅' : '❌',
          normal: cardData.image_uris?.normal ? '✅' : '❌',
          border_crop: cardData.image_uris?.border_crop ? '✅' : '❌'
        });
      }
      if (cardData.card_faces) {
        console.log('  Dual-face card:');
        cardData.card_faces.forEach((face, index) => {
          console.log(`    Face ${index + 1} (${face.name}):`, {
            art_crop: face.image_uris?.art_crop ? '✅' : '❌',
            large: face.image_uris?.large ? '✅' : '❌',
            normal: face.image_uris?.normal ? '✅' : '❌',
            border_crop: face.image_uris?.border_crop ? '✅' : '❌'
          });
        });
      }
      console.log('🖼️ COVER FUNCTION - Selected image URL:', imageUrl);
      
      if (imageUrl) {
        console.log('💾 COVER FUNCTION - Calling updateDeck...');
        console.log('🔧 COVER FUNCTION - Deck ID:', deckForCover.id);
        console.log('🔧 COVER FUNCTION - Updates:', { cover_image_url: imageUrl });
        
        const result = await updateDeck({ deckId: deckForCover.id, updates: { cover_image_url: imageUrl } });
        console.log('✅ COVER FUNCTION - UpdateDeck result:', result);
        
        setCoverSearchOpen(false);
        setDeckForCover(null);
        setCoverSearchTerm("");
        setCoverSuggestions([]);
        console.log('🏁 COVER FUNCTION - Process completed successfully');
      } else {
        console.log('❌ COVER FUNCTION - No image URL found');
      }
    } catch (error) {
      console.error("❌ COVER FUNCTION - Error:", error);
      console.error("❌ COVER FUNCTION - Error details:", {
        message: error.message,
        stack: error.stack,
        cardName,
        deckId: deckForCover?.id
      });
      alert("Erro ao definir capa do deck: " + error.message);
    }
  };

  // Função para renomear deck
  const handleRenameDeck = async () => {
    if (!selectedDeck || !newDeckName.trim()) return;

    try {
      await updateDeck({ deckId: selectedDeck.id, updates: { name: newDeckName.trim() } });
      setRenameDialogOpen(false);
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
      setNewDeckName("");
    } catch (error) {
      console.error("❌ Erro ao renomear deck:", error);
      alert("Erro ao renomear deck: " + error.message);
    }
  };

  // Função para alterar formato do deck
  const handleChangeFormat = async () => {
    if (!selectedDeck || !newFormat.trim()) return;

    try {
      await updateDeck({ deckId: selectedDeck.id, updates: { format: newFormat.trim() } });
      setFormatDialogOpen(false);
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
      setNewFormat("");
    } catch (error) {
      console.error("Erro ao alterar formato:", error);
      alert("Erro ao alterar formato do deck");
    }
  };

  // Função para apagar deck
  const handleDeleteDeck = async () => {
    if (!selectedDeck) return;

    setIsDeleting(true);
    try {
      await deleteDeck(selectedDeck.id);
      setDeleteDialogOpen(false);
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
    } catch (error) {
      console.error("Erro ao apagar deck:", error);
      alert("Erro ao apagar deck");
    } finally {
      setIsDeleting(false);
    }
  };

  // Função para exportar para Magic Arena
  const handleExportToArena = async () => {
    if (!selectedDeck) return;

    setIsExporting(true);
    try {
      // Buscar cartas do deck
      const response = await fetch(`/api/decks/${selectedDeck.id}/cards`);
      if (!response.ok) throw new Error("Erro ao carregar cartas");
      
      const cards = await response.json();
      
      // Converter para formato Arena
      const arenaFormat = cards
        .map((card) => `${card.quantity} ${card.name}`)
        .join("\n");
      
      // Copiar para clipboard
      await navigator.clipboard.writeText(arenaFormat);
      alert("Lista copiada para a área de transferência!");
      
      setDeckOptionsOpen(false);
      setSelectedDeck(null);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar deck");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950">
      {/* 🌐 Barra de status de conectividade */}
      {isOfflineMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white">
            <WifiOff className="w-4 h-4" />
            <span>Modo Offline - Apenas visualização</span>
            {connectivity.canSearchScryfall && (
              <span className="text-yellow-200">• Busca Scryfall disponível</span>
            )}
            {connectivity.isSupabaseConnected && (
              <button 
                onClick={syncDecks}
                className="ml-4 px-2 py-1 bg-white/20 rounded text-xs hover:bg-white/30 transition-colors"
              >
                Sincronizar
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🔗 Popup de perfil (UserMenu) - só mostra se há usuário autenticado */}
      {user && (
        <div className="fixed top-6 right-6">
          <UserMenu />
        </div>
      )}

      <div className={`flex h-full flex-col items-center px-4 text-white ${isOfflineMode ? 'pt-24' : 'pt-20'}`}>
        {/* Alertas de erro */}
        {(decksError || createError || deleteError) && (
          <div className="mb-4 w-full max-w-md">
            <Alert className="bg-red-900/20 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-400">
                {decksError?.message || createError?.message || deleteError?.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <h1 className="mb-6 text-3xl font-bold">Meus Decks</h1>


        {isLoading && <p>Carregando decks...</p>}

        {!isLoading && !hasDecks && (
          <button
            onClick={() => {
              if (!connectivity.canSaveData) {
                alert('Criar deck só é possível quando online');
                return;
              }
              navigate("/create");
            }}
            className={`rounded-lg px-6 py-3 text-lg font-semibold text-white shadow ${
              connectivity.canSaveData 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            disabled={!connectivity.canSaveData}
          >
            Adicionar um novo deck
            {!connectivity.canSaveData && <span className="ml-2 text-sm">(Offline)</span>}
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
                    backgroundImage: `url(${deck.cover_image_url || "https://placehold.co/400x200"})`,
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
              onChange={(e) => {
                const value = e.target.value;
                setCoverSearchTerm(value);
                if (value.length >= 2) {
                  handleSearchAutocomplete(value);
                } else {
                  setCoverSuggestions([]);
                }
              }}
              placeholder="Digite o nome da carta..."
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {loadingSearch && <p className="mt-2 text-sm text-gray-400">Buscando...</p>}
            <ul className="mt-3 max-h-60 overflow-y-auto">
              {coverSuggestions.map((suggestion, index) => {
                const cardName = suggestion.name || suggestion;
                const imageUrl = suggestion.image_url;
                const hasArtCrop = suggestion.has_art_crop;
                const isDualFace = suggestion.is_dual_face;
                
                return (
                  <li
                    key={`${cardName}-${index}`}
                    onClick={() => handleSelectCover(cardName)}
                    className="cursor-pointer px-2 py-2 hover:bg-gray-700 rounded flex items-center gap-3 transition-colors"
                  >
                    {imageUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={imageUrl} 
                          alt={cardName}
                          className="w-12 h-12 object-cover rounded border border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-white font-medium">{cardName}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {isDualFace && (
                          <div className="text-xs text-blue-400">🔄 Duas faces</div>
                        )}
                        {hasArtCrop && (
                          <div className="text-xs text-green-400">🎨 Arte sem moldura</div>
                        )}
                        {imageUrl && !hasArtCrop && (
                          <div className="text-xs text-yellow-400">🖼️ Com moldura</div>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
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

    </div>
  );
}

export default Home;
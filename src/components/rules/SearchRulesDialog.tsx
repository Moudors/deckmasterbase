import React, {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Book, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { renderManaSymbols } from "@/utils/manaSymbols";
import { traduzirCarta, translateText, ScryfallCard } from "@/services/translator";
import { searchCards, findCardByName } from "@/utils/cardTranslationCache";

// 🔧 Funções de API
export async function getAutocomplete(query: string): Promise<string[]> {
  // Autocomplete suporta busca em qualquer idioma automaticamente
  const res = await fetch(
    `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}&include_extras=true`
  );
  const data = await res.json();
  return data.data || [];
}

export async function getCardByName(name: string): Promise<ScryfallCard> {
  // Estratégia 1: Busca fuzzy normal (melhor para nomes em inglês e aproximados)
  let res = await fetch(
    `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
  );
  
  if (res.ok) {
    return await res.json();
  }
  
  // Estratégia 2: Busca avançada por nome exato (português, espanhol, etc.)
  res = await fetch(
    `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(name)}"&unique=prints`
  );
  
  if (res.ok) {
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
  }
  
  // Estratégia 3: Busca por palavras parciais em qualquer idioma
  res = await fetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}&unique=cards&order=name`
  );
  
  if (res.ok) {
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
  }
  
  // Estratégia 4: Busca em prints com nome estrangeiro
  res = await fetch(
    `https://api.scryfall.com/cards/search?q=foreign:"${encodeURIComponent(name)}"&unique=cards`
  );
  
  if (res.ok) {
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
  }
  
  throw new Error("Carta não encontrada. Tente usar o nome em inglês ou verifique a ortografia.");
}

// 🔧 Buscar rulings oficiais
async function getRulings(rulingsUri: string) {
  const res = await fetch(rulingsUri);
  if (!res.ok) throw new Error("Erro ao buscar rulings");
  const data = await res.json();
  return data.data as { published_at: string; comment: string; source: string }[];
}

interface SearchRulesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchRulesDialog({
  isOpen,
  onClose,
}: SearchRulesDialogProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ScryfallCard | null>(null);
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) handleNextFace();
    setTouchStartX(null);
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete com cache local multilíngue
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingSuggestions(true);

    const debounceTimer = setTimeout(async () => {
      try {
        // 🚀 Busca instantânea no cache local (sem requisições!)
        console.log('🌍 Buscando regras com cache multilíngue para:', query);
        const cacheResults = await searchCards(query, 'pt-BR', 15);
        
        if (cacheResults.length > 0) {
          console.log(`⚡ Encontrou ${cacheResults.length} resultados no cache local`);
          setSuggestions(cacheResults.map(r => r.english));
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } else {
          // Fallback: API Scryfall se não encontrou no cache
          console.log('🔍 Nenhum resultado no cache, buscando no Scryfall');
          const data = await getAutocomplete(query);
          setSuggestions(data);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [query]);

    // Selecionar carta
  const handleCardSelect = async (cardName: string) => {
    setShowSuggestions(false);
    setQuery(cardName);
    setIsSearching(true);
    setError(null);
    setResult(null);
    setCurrentFaceIndex(0);

    try {
      const fetchedCard = await getCardByName(cardName);

      // 🔑 traduz carta (edição PT ou Azure, incluindo faces)
      const cartaTraduzida = await traduzirCarta(fetchedCard);

      // 🔑 rulings sempre traduzidas
      let rulingsTraduzidas: { published_at: string; comment: string; source: string }[] = [];
      if (fetchedCard.rulings_uri) {
        const rulings = await getRulings(fetchedCard.rulings_uri);
        rulingsTraduzidas = await Promise.all(
          rulings.map(async (r) => ({
            ...r,
            comment: await translateText(r.comment, "pt"),
          }))
        );
      }

      // 🔑 monta objeto final já com rulings
      setResult({
        ...cartaTraduzida,
        rulings: rulingsTraduzidas,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsSearching(false);
    }
  };

  // Teclas de navegação
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleCardSelect(suggestions[selectedIndex]);
      } else if (query.trim()) {
        handleCardSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleNextFace = () => {
    if (!result?.card_faces || result.card_faces.length <= 1) return;
    const faces = result.card_faces;
    setCurrentFaceIndex((prev) => (prev + 1) % faces.length);
  };

  const currentFace = result?.card_faces
    ? result.card_faces[currentFaceIndex]
    : result;

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl h-[85vh] max-h-[85vh]
                     -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg
                     bg-gray-400/90 backdrop-blur-md border border-gray-600 p-4 flex flex-col"
          aria-describedby="search-rules-description"
        >
          {/* Título acessível mas visualmente oculto */}
          <Dialog.Title className="sr-only">Buscar Regras de Cartas</Dialog.Title>
          <Dialog.Description id="search-rules-description" className="sr-only">
            Busque por cartas do Magic: The Gathering e visualize suas regras traduzidas.
          </Dialog.Description>
          {/* Header */}
          <div className="pb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-black text-lg">
              <Book className="w-5 h-5" />
              Buscar Regras
            </h2>
            <Dialog.Close asChild>
              <button
                aria-label="Fechar"
                className="rounded p-1 text-black/70 hover:text-black hover:bg-black/10"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3 flex-1 flex flex-col min-h-0">
            {/* Search Input */}
            <div className="relative flex-shrink-0" ref={searchRef}>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 z-10" />
                  <Input
                    value={query}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setQuery(e.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    onFocus={() =>
                      suggestions.length > 0 && setShowSuggestions(true)
                    }
                    placeholder="Digite o nome da carta..."
                    className="pl-9 h-10 text-sm bg-white/90 border-gray-500 text-black placeholder:text-gray-600"
                    disabled={isSearching}
                    autoComplete="off"
                  />
                  {isLoadingSuggestions && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-600" />
                  )}
                </div>
                
                {/* Botão de busca forçada */}
                <button
                  onClick={() => query.trim() && handleCardSelect(query.trim())}
                  disabled={isSearching || !query.trim()}
                  className="h-10 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                  title="Buscar diretamente sem autocomplete"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-gray-500 rounded-lg shadow-2xl max-h-60 overflow-y-auto z-50"
                  >
                    {suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        onClick={() => handleCardSelect(suggestion)}
                        className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-300 last:border-b-0 ${
                          index === selectedIndex
                            ? "bg-orange-500/20 text-orange-800"
                            : "text-black hover:bg-gray-200"
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
                          <span className="font-medium text-sm">{suggestion}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-100 border border-red-400 rounded-lg p-2.5 flex-shrink-0">
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            {/* Result */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 -mr-2">
              {isSearching && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-2" />
                    <p className="text-xs text-black">Buscando informações...</p>
                  </div>
                </div>
              )}

              {result && !isSearching && currentFace && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 rounded-lg p-3 border border-gray-400"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 mb-3 pb-3 border-b border-gray-300">
                    {currentFace.image_uris?.normal && (
                      <img
                        src={currentFace.image_uris.normal}
                        alt={currentFace.name}
                        className="w-32 sm:w-40 h-auto rounded-lg shadow-lg mx-auto sm:mx-0 cursor-pointer"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        draggable={false}
                      />
                    )}
                    <div className="flex-1 w-full">
                      <h3 className="text-base sm:text-lg font-bold text-black mb-1 text-center sm:text-left">
                        {currentFace.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700">
                        {currentFace.type_line ?? ""}
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-black">
                    <div className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                      {renderManaSymbols(currentFace.oracle_text ?? "")}
                    </div>

                   {/* 🔑 Rulings traduzidas */}
                    {result?.rulings && result.rulings.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-sm text-black">
                          Notas oficiais (Rulings)
                        </h4>
                        <ul className="list-disc ml-4 text-xs text-gray-700">
                          {result.rulings.map(
                            (
                              r: { published_at: string; comment: string },
                              i: number
                            ) => (
                              <li key={i}>
                                <span className="font-medium">{r.published_at}:</span>{" "}
                                {r.comment}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {!isSearching && !result && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Book className="w-12 h-12 text-gray-600 mb-2" />
                  <p className="text-black font-medium text-sm mb-1">
                    Busque por uma carta
                  </p>
                  <p className="text-xs text-gray-700 px-4">
                    Digite o nome de uma carta em qualquer idioma para ver sua tradução e
                    regras em português
                  </p>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


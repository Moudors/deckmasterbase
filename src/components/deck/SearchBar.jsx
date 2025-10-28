import React, { useState, useEffect, useRef } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { deckCardOperations } from "../../lib/supabaseOperations";

export default function SearchBar({ deckId, isSearching, setIsSearching }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setSuggestions(data.data || []);
        setShowSuggestions(true);
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
  }, [query]);

  // 🔄 Adicionar carta ao deck
  const handleSearch = async (cardName) => {
    if (!deckId) return;
    setIsSearching(true);

    try {
      // Buscar dados completos da carta no Scryfall
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
        // Adicionar card_faces para suportar dupla face
        card_faces: cardData.card_faces || null,
      };

      // Check if this card already exists in the deck (by scryfall_id)
      const currentCards = queryClient.getQueryData(["cards", deckId]) || [];
      const existing = currentCards.find((c) => c.scryfall_id === cardData.id);

      if (existing) {
        // Increment quantity on existing doc
        const nextQty = (existing.quantity || 1) + 1;
        // Optimistic cache update
        queryClient.setQueryData(["cards", deckId], (old = []) =>
          old.map((c) => (c.id === existing.id ? { ...c, quantity: nextQty } : c))
        );

        try {
          // Atualizar quantidade no Supabase
          await deckCardOperations.updateDeckCard(existing.id, { quantity: nextQty });
          // Sucesso silencioso - cache já está correto
        } catch (err) {
          // Rollback para erros críticos
          console.error("Erro ao incrementar:", err);
          queryClient.setQueryData(["cards", deckId], (old = []) =>
            old.map((c) => (c.id === existing.id ? { ...c, quantity: existing.quantity } : c))
          );
        }
      } else {
        // --- show optimistic card immediately (client-side Scryfall fetched data)
        const tempId = `tmp-${Date.now()}`;
        const tempCard = { id: tempId, ...newCard, __optimistic: true };
        queryClient.setQueryData(["cards", deckId], (old = []) => [tempCard, ...old]);

        // Persist to Supabase
        try {
          const docId = await deckCardOperations.addCardToDeck(deckId, newCard);

          // Replace temp with real card id & data
          queryClient.setQueryData(["cards", deckId], (old = []) =>
            old.map((c) => (c && c.id === tempId ? { id: docId, ...newCard } : c))
          );
          // Sucesso - carta adicionada
        } catch (err) {
          // Rollback para erros
          console.error("Erro ao adicionar:", err);
          queryClient.setQueryData(["cards", deckId], (old = []) => old.filter((c) => c.id !== tempId));
          alert("Erro ao adicionar carta: " + (err.message || "Tente novamente"));
        }
      }

      // Resetar estado e focar input para permitir adicionar mais
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      try {
        inputRef.current?.focus();
      } catch (e) {
        /* ignore */
      }

      // Resetar estado e focar input para permitir adicionar mais
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      try {
        inputRef.current?.focus();
      } catch (e) {
        /* ignore */
      }
    } catch (error) {
      console.error("Erro ao adicionar carta:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSearch(suggestions[selectedIndex]);
    } else if (query.trim()) {
      handleSearch(query.trim());
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
    handleSearch(suggestion);
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 p-4"
    >
      <form onSubmit={handleSubmit} className="flex gap-2 relative" ref={searchRef}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <Input
            id="searchCard"
            name="searchCard"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            ref={inputRef}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Buscar carta no Scryfall..."
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-orange-500"
            autoComplete="off"
          />

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto z-50"
              >
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-700 last:border-b-0 ${
                      index === selectedIndex
                        ? "bg-orange-500/20 text-orange-400"
                        : "text-gray-300 hover:bg-gray-700"
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{suggestion}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading indicator for suggestions */}
          {isLoadingSuggestions && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </form>
    </motion.div>
  );
}

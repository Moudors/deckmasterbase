import React, { useState, useEffect, useRef } from "react";

interface AdvancedSearchFormProps {
  onSearch: (query: string) => void;
}

export default function AdvancedSearchForm({ onSearch }: AdvancedSearchFormProps) {
  // Estados para cada campo
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [typeInput, setTypeInput] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [allowPartialTypes, setAllowPartialTypes] = useState(false);
  const [typeCategories, setTypeCategories] = useState<Record<string, string[]>>({});
  const [filteredCategories, setFilteredCategories] = useState<Record<string, string[]>>({});
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [colors, setColors] = useState<string[]>([]);
  const [colorMode, setColorMode] = useState<"exact" | "including" | "at-least-one">("exact");
  const [commanderColors, setCommanderColors] = useState<string[]>([]);
  const typeInputRef = useRef<HTMLInputElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  // Busca todas as categorias de tipos da API do Scryfall
  useEffect(() => {
    const catalogEndpoints = [
      { key: "Card Types", url: "https://api.scryfall.com/catalog/card-types" },
      { key: "Supertypes", url: "https://api.scryfall.com/catalog/supertypes" },
      { key: "Artifact Types", url: "https://api.scryfall.com/catalog/artifact-types" },
      { key: "Battle Types", url: "https://api.scryfall.com/catalog/battle-types" },
      { key: "Creature Types", url: "https://api.scryfall.com/catalog/creature-types" },
      { key: "Enchantment Types", url: "https://api.scryfall.com/catalog/enchantment-types" },
      { key: "Land Types", url: "https://api.scryfall.com/catalog/land-types" },
      { key: "Planeswalker Types", url: "https://api.scryfall.com/catalog/planeswalker-types" },
      { key: "Spell Types", url: "https://api.scryfall.com/catalog/spell-types" },
    ];

    Promise.all(
      catalogEndpoints.map((endpoint) =>
        fetch(endpoint.url)
          .then((res) => res.json())
          .then((data) => ({ key: endpoint.key, data: data.data || [] }))
          .catch(() => ({ key: endpoint.key, data: [] }))
      )
    ).then((results) => {
      const categories: Record<string, string[]> = {};
      results.forEach((result) => {
        if (result.data.length > 0) {
          categories[result.key] = result.data;
        }
      });
      setTypeCategories(categories);
      setFilteredCategories(categories);
    });
  }, []);

  // Filtra tipos baseado no input
  useEffect(() => {
    if (typeInput.trim()) {
      const searchTerm = typeInput.toLowerCase();
      const filtered: Record<string, string[]> = {};
      
      Object.entries(typeCategories).forEach(([category, types]) => {
        const matchingTypes = types.filter((type) =>
          type.toLowerCase().includes(searchTerm)
        );
        if (matchingTypes.length > 0) {
          filtered[category] = matchingTypes;
        }
      });
      
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(typeCategories);
    }
  }, [typeInput, typeCategories]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node) &&
        typeInputRef.current &&
        !typeInputRef.current.contains(event.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Alterna seleção de cor
  function toggleColor(color: string, isCommander: boolean = false) {
    if (isCommander) {
      setCommanderColors((prev) =>
        prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
      );
    } else {
      setColors((prev) =>
        prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
      );
    }
  }

  // Seleciona tipo da sugestão
  function selectType(type: string) {
    if (!selectedTypes.includes(type)) {
      setSelectedTypes([...selectedTypes, type]);
    }
    setTypeInput("");
    setShowTypeDropdown(false);
    typeInputRef.current?.focus();
  }

  // Remove tipo selecionado
  function removeType(type: string) {
    setSelectedTypes(selectedTypes.filter((t) => t !== type));
  }

  // Monta query final
  function buildQuery() {
    const parts: string[] = [];

    if (name) parts.push(`name:"${name}"`);
    if (text) parts.push(`o:"${text}"`);
    if (selectedTypes.length > 0) {
      if (allowPartialTypes) {
        // Tipos parciais = OR (qualquer um dos tipos)
        const typeQuery = selectedTypes.map(t => `t:${t}`).join(" OR ");
        parts.push(`(${typeQuery})`);
      } else {
        // Busca exata: carta deve ter TODOS os tipos juntos
        // Ex: t:legendary t:creature (carta que é tanto legendary quanto creature)
        selectedTypes.forEach(t => parts.push(`t:${t}`));
      }
    }
    if (colors.length > 0) {
      const colorString = colors.join("");
      switch (colorMode) {
        case "exact":
          // Exatamente estas cores
          parts.push(`color=${colorString}`);
          break;
        case "including":
          // Incluindo estas cores (pode ter mais)
          parts.push(`color>=${colorString}`);
          break;
        case "at-least-one":
          // Ao menos uma das cores
          parts.push(`color:${colorString}`);
          break;
      }
    }
    if (commanderColors.length > 0) parts.push(`id:${commanderColors.join("")}`);

    return parts.join(" ");
  }

  // Dispara busca
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = buildQuery();
    onSearch(query);
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-gray-800 text-white space-y-3">
      {/* Nome */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">Nome da carta</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='Ex: "Fire"'
          className="w-full border border-gray-600 rounded bg-gray-700 px-2.5 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Texto */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">Texto da carta</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ex: "draw a card"'
          className="w-full border border-gray-600 rounded bg-gray-700 px-2.5 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Tipo */}
      <div className="relative">
        <label className="block text-xs font-medium text-gray-300 mb-1">Tipo</label>
        
        {/* Tags dos tipos selecionados */}
        {selectedTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {selectedTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded"
              >
                {type}
                <button
                  type="button"
                  onClick={() => removeType(type)}
                  className="hover:text-gray-200 transition-colors"
                >
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input
            ref={typeInputRef}
            type="text"
            value={typeInput}
            onChange={(e) => setTypeInput(e.target.value)}
            onFocus={() => setShowTypeDropdown(true)}
            placeholder="Ex: Creature, Instant..."
            className="w-full border border-gray-600 rounded bg-gray-700 px-2.5 py-1.5 pr-8 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {/* Botão para abrir/fechar dropdown */}
          <button
            type="button"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Dropdown com todos os tipos organizados por categoria */}
        {showTypeDropdown && (
          <div 
            ref={typeDropdownRef}
            className="absolute z-10 w-full mt-1 max-h-80 overflow-y-auto bg-gray-800 border border-gray-600 rounded shadow-lg"
          >
            {Object.keys(filteredCategories).length > 0 ? (
              Object.entries(filteredCategories).map(([category, types]) => (
                <div key={category} className="border-b border-gray-700 last:border-b-0">
                  {/* Título da categoria */}
                  <div className="px-2.5 py-1.5 bg-gray-900 text-xs font-semibold text-gray-400 uppercase tracking-wide sticky top-0">
                    {category}
                  </div>
                  {/* Lista de tipos */}
                  <div className="py-0.5">
                    {types.map((type) => (
                      <button
                        type="button"
                        key={`${category}-${type}`}
                        onClick={() => selectType(type)}
                        className="w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">
                Nenhum tipo encontrado
              </div>
            )}
          </div>
        )}
        
        {/* Checkbox: Permitir tipos parciais */}
        {selectedTypes.length > 1 && (
          <div className="mt-1.5">
            <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPartialTypes}
                onChange={(e) => setAllowPartialTypes(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
              />
              <span>Permitir tipos parciais</span>
            </label>
            <p className="text-xs text-gray-500 mt-0.5 ml-5">
              {allowPartialTypes 
                ? "Mostra cartas que tenham pelo menos um dos tipos selecionados" 
                : "Mostra apenas cartas que tenham todos os tipos selecionados"}
            </p>
          </div>
        )}
      </div>

      {/* Cores */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">Cores</label>
        <div className="flex gap-1.5">
          {[
            { symbol: "W", mana: "w" },
            { symbol: "U", mana: "u" },
            { symbol: "B", mana: "b" },
            { symbol: "R", mana: "r" },
            { symbol: "G", mana: "g" },
            { symbol: "C", mana: "c" } // Incolor
          ].map(({ symbol, mana }) => (
            <button
              type="button"
              key={symbol}
              onClick={() => toggleColor(symbol)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                colors.includes(symbol)
                  ? "border-orange-500 scale-110"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <i className={`ms ms-${mana} ms-cost`} />
            </button>
          ))}
        </div>
        
        {/* Dropdown: Modo de cores */}
        {colors.length > 0 && (
          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-400 mb-1">Modo de busca</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value as "exact" | "including" | "at-least-one")}
              className="w-full border border-gray-600 rounded bg-gray-700 px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="exact">Exatamente estas cores</option>
              <option value="including">Incluindo estas cores</option>
              <option value="at-least-one">Ao menos uma das cores</option>
            </select>
            <p className="text-xs text-gray-500 mt-0.5">
              {colorMode === "exact" && "Apenas cartas com exatamente as cores selecionadas"}
              {colorMode === "including" && "Cartas que incluem as cores selecionadas (pode ter outras)"}
              {colorMode === "at-least-one" && "Cartas com pelo menos uma das cores selecionadas"}
            </p>
          </div>
        )}
      </div>

      {/* Identidade de comandante */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1">Identidade de comandante</label>
        <div className="flex gap-1.5">
          {[
            { symbol: "W", mana: "w" },
            { symbol: "U", mana: "u" },
            { symbol: "B", mana: "b" },
            { symbol: "R", mana: "r" },
            { symbol: "G", mana: "g" },
            { symbol: "C", mana: "c" } // Incolor
          ].map(({ symbol, mana }) => (
            <button
              type="button"
              key={symbol}
              onClick={() => toggleColor(symbol, true)}
              className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                commanderColors.includes(symbol)
                  ? "border-orange-500 scale-110"
                  : "border-gray-600 hover:border-gray-500"
              }`}
            >
              <i className={`ms ms-${mana} ms-cost`} />
            </button>
          ))}
        </div>
      </div>

      {/* Botão de busca */}
      <button
        type="submit"
        className="w-full py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm"
      >
        Buscar
      </button>
    </form>
  );
}

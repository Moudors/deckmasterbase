// src/utils/manaSymbols.tsx
import React from "react";

/**
 * Converte texto com símbolos de mana em elementos JSX.
 * Exemplo: "{G}{U}{1}" → <i class="ms ms-g"></i><i class="ms ms-u"></i><i class="ms ms-1"></i>
 * Suporta símbolos especiais: {T} (tap), {Q} (untap), {E} (energy), etc.
 */
export function renderManaSymbols(text: string): React.ReactNode {
  if (!text) return null;

  // Divide em partes como {G}, {U}, {1}, {T}, {Q}, ou texto normal
  const parts = text.split(/(\{.*?\})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          let symbol = part.slice(1, -1).toLowerCase();
          
          // Mapeamento de símbolos especiais para classes do Mana Font
          const symbolMap: Record<string, string> = {
            't': 'tap',           // {T} → ms-tap
            'q': 'untap',         // {Q} → ms-untap
            'e': 'e',             // {E} → ms-e (energy)
            's': 'snow',          // {S} → ms-snow
            'chaos': 'chaos',     // {CHAOS} → ms-chaos
            'x': 'x',             // {X} → ms-x
            'y': 'y',             // {Y} → ms-y
            'z': 'z',             // {Z} → ms-z
            '0': '0',             // {0} → ms-0
            '½': 'half',          // {½} → ms-half
            '∞': 'infinity',      // {∞} → ms-infinity
          };
          
          // Processa manas híbridos e phyrexian (ex: {W/U}, {2/W}, {G/P})
          // O Mana Font usa o formato original com barra: ms-wu, ms-2w, ms-gp
          if (symbol.includes('/')) {
            // Remove a barra para criar a classe CSS do Mana Font
            // {W/U} → w/u → wu → ms-wu
            // {2/W} → 2/w → 2w → ms-2w
            // {G/P} → g/p → gp → ms-gp
            const hybridSymbol = symbol.replace('/', '');
            return <i key={index} className={`ms ms-${hybridSymbol} ms-cost ms-hybrid inline-block`} />;
          }
          
          // Usa o mapeamento se existir, caso contrário usa o símbolo direto
          const mappedSymbol = symbolMap[symbol] || symbol;
          
          return <i key={index} className={`ms ms-${mappedSymbol} ms-cost inline-block`} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

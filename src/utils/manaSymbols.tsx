// src/utils/manaSymbols.tsx
import React from "react";

/**
 * Converte texto com símbolos de mana em elementos JSX.
 * Exemplo: "{G}{U}{1}" → <i class="ms ms-g"></i><i class="ms ms-u"></i><i class="ms ms-1"></i>
 */
export function renderManaSymbols(text: string): React.ReactNode {
  if (!text) return null;

  // Divide em partes como {G}, {U}, {1}, ou texto normal
  const parts = text.split(/(\{.*?\})/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          const symbol = part.slice(1, -1).toLowerCase();
          return <i key={index} className={`ms ms-${symbol} inline-block`} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

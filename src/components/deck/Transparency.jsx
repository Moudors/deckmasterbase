// src/components/deck/Transparency.jsx
import React, { useState } from "react";

/**
 * Componente que encapsula a lógica de transparência via duplo clique.
 * 
 * Props:
 * - children: conteúdo a ser renderizado dentro do wrapper
 * - defaultTransparent: se começa transparente ou não
 * - onToggle: callback opcional chamado quando a transparência muda
 */
export default function Transparency({
  children,
  defaultTransparent = false,
  onToggle,
}) {
  const [isTransparent, setIsTransparent] = useState(defaultTransparent);

  const handleDoubleClick = () => {
    setIsTransparent((prev) => {
      const novo = !prev;
      if (onToggle) onToggle(novo);
      return novo;
    });
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`transition-opacity duration-300 ${
        isTransparent ? "opacity-50" : "opacity-100"
      }`}
    >
      {children}
    </div>
  );
}

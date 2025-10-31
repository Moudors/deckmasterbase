import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Download } from "lucide-react";

export default function DeckSettingsMenu({ isOpen, onClose, onImportClick, onExportClick, anchorRef }) {
  const menuRef = useRef(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
      >
        <button
          onClick={() => {
            onImportClick();
            onClose();
          }}
          className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
        >
          <Upload className="w-4 h-4 text-orange-500" />
          <span className="text-sm">Importar Deck</span>
        </button>
        
        <button
          onClick={() => {
            onExportClick();
            onClose();
          }}
          className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3 border-t border-gray-700"
        >
          <Download className="w-4 h-4 text-blue-500" />
          <span className="text-sm">Exportar Deck</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

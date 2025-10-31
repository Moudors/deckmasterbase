import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ImportDeckModal({ isOpen, onClose, onImport }) {
  const [deckText, setDeckText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async () => {
    if (!deckText.trim()) return;

    setIsImporting(true);
    try {
      // Processar o texto linha por linha
      const lines = deckText.trim().split('\n');
      const cards = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Formato: "4 Lightning Bolt" ou "4x Lightning Bolt"
        const match = trimmedLine.match(/^(\d+)x?\s+(.+)$/i);
        
        if (match) {
          const quantity = parseInt(match[1], 10);
          const cardName = match[2].trim();
          
          cards.push({
            name: cardName,
            quantity: quantity
          });
        } else {
          // Se não tiver quantidade, assume 1
          cards.push({
            name: trimmedLine,
            quantity: 1
          });
        }
      }

      console.log("📋 Cartas a importar:", cards);
      await onImport?.(cards);
      
      // Limpar e fechar
      setDeckText("");
      onClose();
    } catch (error) {
      console.error("❌ Erro ao importar deck:", error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Importar Deck
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Cole a lista de cartas (uma por linha). Formato: <code className="bg-gray-800 px-1 py-0.5 rounded">4 Lightning Bolt</code>
          </p>

          <textarea
            value={deckText}
            onChange={(e) => setDeckText(e.target.value)}
            placeholder="4 Lightning Bolt&#10;2 Counterspell&#10;1 Black Lotus&#10;..."
            className="w-full h-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isImporting}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || !deckText.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                "Concluir"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

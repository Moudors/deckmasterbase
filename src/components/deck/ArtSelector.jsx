import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function ArtSelector({ 
  isOpen, 
  onClose, 
  card, 
  onSelectArt, 
  onAddCard,
  onUpdateCard,
  deckId 
}) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [newQuantity, setNewQuantity] = useState(1);
  const queryClient = useQueryClient();

  // 🔄 Buscar versões da carta
  const fetchCardVersions = useCallback(async () => {
    if (!card) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(
          card.card_name
        )}"&unique=prints`
      );
      const data = await response.json();

      if (data.data) {
        const validVersions = data.data.filter(
          (v) => v.image_uris?.normal || v.card_faces?.[0]?.image_uris?.normal
        );
        setVersions(validVersions);
        setSelectedVersion(card.scryfall_id);
      }
    } catch (error) {
      console.error("Erro ao buscar versões:", error);
    } finally {
      setIsLoading(false);
    }
  }, [card]);

  useEffect(() => {
    if (isOpen && card) {
      fetchCardVersions();
      setNewQuantity(card.quantity || 1); // Inicia com a quantidade atual
    }
  }, [isOpen, card, fetchCardVersions]);

  // 🔄 Trocar arte da carta atual
  const handleConfirm = useCallback(async () => {
    if (selectedVersion && selectedVersion !== card.scryfall_id) {
      const version = versions.find((v) => v.id === selectedVersion);
      if (version) {
        const imageUrl =
          version.image_uris?.normal || version.card_faces?.[0]?.image_uris?.normal;

        // ✅ Apenas chama o callback - deixa o Deckbuilder gerenciar o update
        onSelectArt?.({
          scryfall_id: version.id,
          image_url: imageUrl,
        });

        // Fecha modal imediatamente
        onClose();
        return;
      }
    }
    onClose(); // fecha modal se nada mudou
  }, [selectedVersion, card?.scryfall_id, versions, onSelectArt, onClose]);

  // 🔄 Adicionar nova carta com arte diferente
  const handleAddDifferentArt = useCallback(async () => {
    if (!selectedVersion || !deckId || !onAddCard) return;

    const version = versions.find((v) => v.id === selectedVersion);
    if (!version) return;

    const imageUrl =
      version.image_uris?.normal || version.card_faces?.[0]?.image_uris?.normal;

    try {
      // Usar a função de adicionar carta do hook unificado
      await onAddCard({
        scryfall_id: version.id,
        card_name: version.name,
        image_url: imageUrl,
        mana_cost: version.mana_cost || "",
        type_line: version.type_line || "",
        quantity: 1,
        acquired: false,
        card_faces: version.card_faces || null,
      });

      onClose();
    } catch (error) {
      console.error("Erro ao adicionar carta com arte diferente:", error);
    }
  }, [selectedVersion, deckId, onAddCard, versions, onClose]);

  // 🔄 Adicionar mais cópias da carta atual
  const handleAddMoreCopies = async () => {
    if (!card || !onUpdateCard || newQuantity <= 0) return;

    try {
      // Usar a função de atualizar carta do hook unificado
      await onUpdateCard({
        cardId: card.id,
        updates: { quantity: newQuantity }
      });

      onClose();
    } catch (error) {
      console.error("Erro ao adicionar mais cópias:", error);
    }
  };

  // Incrementar quantidade
  const incrementQuantity = () => {
    setNewQuantity(prev => prev + 1);
  };

  // Decrementar quantidade
  const decrementQuantity = () => {
    setNewQuantity(prev => Math.max(1, prev - 1)); // Mínimo 1
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Escolher Arte - {card?.card_name}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            {versions.length} {versions.length === 1 ? "versão disponível" : "versões disponíveis"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Grid de versões */}
            <div className="overflow-y-auto max-h-[60vh] pr-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {versions.map((version) => {
                  const imageUrl =
                    version.image_uris?.normal || version.card_faces?.[0]?.image_uris?.normal;
                  const isSelected = selectedVersion === version.id;

                  return (
                    <motion.div
                      key={version.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedVersion(version.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-orange-500 shadow-lg shadow-orange-500/50"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={version.name}
                        className="w-full h-auto select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-xs text-white font-medium truncate">{version.set_name}</p>
                        <p className="text-xs text-gray-300">
                          {version.set.toUpperCase()} • {version.collector_number}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleAddDifferentArt}
                  disabled={!selectedVersion || selectedVersion === card?.scryfall_id}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600/20 hover:text-purple-300 h-12"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Arte Diferente
                </Button>
                
                {/* Contador de cópias com botões +/- */}
                <div className="flex items-center gap-2 h-12">
                  <Button
                    onClick={decrementQuantity}
                    variant="outline"
                    disabled={newQuantity <= 1}
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed w-12 h-12 p-0"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  
                  <Button
                    onClick={handleAddMoreCopies}
                    variant="outline"
                    disabled={newQuantity === (card?.quantity || 1)}
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex-1 h-12 font-bold text-2xl"
                  >
                    {newQuantity}
                  </Button>
                  
                  <Button
                    onClick={incrementQuantity}
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 w-12 h-12 p-0"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!selectedVersion || selectedVersion === card?.scryfall_id}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Trocar Arte
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


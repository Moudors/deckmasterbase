import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DeleteQuantityDialog({ isOpen, onClose, cards = [], deckId, onConfirm, isLoading = false }) {
  const queryClient = useQueryClient();

  // Mapa de seleção por carta (bolinha)
  const [selected, setSelected] = useState({});
  // Mapa de quantidades a remover por carta
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Inicializa: todas selecionadas por padrão; quantidades = total de cada carta
      const initialSelected = {};
      const initialQuantities = {};
      cards.forEach((card) => {
        initialSelected[card.id] = true;
        initialQuantities[card.id] = card.quantity || 1;
      });
      setSelected(initialSelected);
      setQuantities(initialQuantities);
    }
  }, [isOpen, cards]);

  const toggleSelected = (cardId) => {
    setSelected((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  const handleQuantityChange = (cardId, delta) => {
    setQuantities((prev) => {
      const card = cards.find((c) => c.id === cardId);
      const maxQuantity = card?.quantity || 1;
      const next = Math.min(Math.max(1, (prev[cardId] || 1) + delta), maxQuantity);
      return { ...prev, [cardId]: next };
    });
  };

  const handleSelectAllToggle = () => {
    const allSelected = cards.every((c) => selected[c.id]);
    if (allSelected) {
      // desmarcar todos
      const newSelected = {};
      const newQuantities = {};
      cards.forEach((card) => {
        newSelected[card.id] = false;
        newQuantities[card.id] = 1;
      });
      setSelected(newSelected);
      setQuantities(newQuantities);
    } else {
      // marcar todos e setar quantidades ao máximo
      const newSelected = {};
      const newQuantities = {};
      cards.forEach((card) => {
        newSelected[card.id] = true;
        newQuantities[card.id] = card.quantity || 1;
      });
      setSelected(newSelected);
      setQuantities(newQuantities);
    }
  };

  const handleConfirm = async () => {
    try {
      // prepare payload of removals
      const payload = {};
      cards.forEach((c) => {
        if (selected[c.id]) {
          payload[c.id] = quantities[c.id] || 1;
        }
      });

      // Optimistic cache update so UI reflects the removals immediately
      try {
        queryClient.setQueryData(["cards", deckId], (old = []) => {
          if (!old || old.length === 0) return old;
          return old
            .map((c) => {
              const qtyToRemove = payload[c.id];
              if (!qtyToRemove) return c;
              const newQty = (c.quantity || 1) - qtyToRemove;
              if (newQty <= 0) return null;
              return { ...c, quantity: newQty };
            })
            .filter(Boolean);
        });
      } catch (err) {
        console.error("Erro na atualização otimista do cache:", err);
      }

      // call parent handler to perform deletions (actual writes)
      if (onConfirm) {
        try {
          onConfirm(payload);
        } catch (err) {
          console.error("Erro no onConfirm:", err);
          // If parent failed synchronously, invalidate to reconcile
          queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
        }
      }
    } catch (error) {
      console.error("Erro ao confirmar remoção:", error);
    } finally {
      // close modal regardless — parent will handle eventual rollback/invalidation
      onClose();
    }
  };

  const totalSelectedCopies =
    cards.reduce((sum, card) => {
      if (!selected[card.id]) return sum;
      return sum + (quantities[card.id] || 0);
    }, 0) || 0;

  const nothingSelected = cards.every((c) => !selected[c.id]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trash2 className="w-5 h-5 text-red-500" />
            Remover cartas
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-400">
            Selecione as cartas (bolinha) e ajuste quantas cópias remover
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-gray-300">Ações:</div>
          <button
            onClick={handleSelectAllToggle}
            className="text-sm text-orange-400 hover:underline"
            type="button"
          >
            {cards.every((c) => selected[c.id]) ? "Desmarcar todas" : "Remover todas"}
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {cards.map((card) => {
            const hasMultiple = (card.quantity || 1) > 1;
            const isSelected = !!selected[card.id];

            return (
              <div
                key={card.id}
                className={`flex items-center gap-4 p-3 rounded-lg border ${
                  isSelected ? "bg-gray-700 border-gray-600" : "bg-gray-800 border-gray-700"
                }`}
              >
                {/* Bolinha de seleção (usar Button do design system) */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isSelected ? "Selecionado" : "Não Selecionado"}
                  onClick={() => toggleSelected(card.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded-full p-0 border ${
                    isSelected
                      ? "border-orange-500 bg-orange-500"
                      : "border-gray-500 bg-gray-600/30"
                  }`}
                />

                {/* Imagem */}
                <img
                  src={card.image_url || null}
                  alt={card.card_name}
                  className="w-16 h-auto rounded"
                  loading="lazy"
                  decoding="async"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-white line-clamp-1">{card.card_name}</p>
                  <p className="text-sm text-gray-400">
                    {hasMultiple ? `${card.quantity} cópias` : "1 cópia"}
                  </p>
                </div>

                {/* Quantidade a remover (apenas se Selecionado) */}
                {isSelected && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(card.id, -1)}
                      disabled={(quantities[card.id] || 1) <= 1}
                      className="h-8 w-8 bg-gray-700 border-gray-600"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-bold">
                      {quantities[card.id]}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(card.id, 1)}
                      disabled={(quantities[card.id] || 1) >= (card.quantity || 1)}
                      className="h-8 w-8 bg-gray-700 border-gray-600"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex items-center justify-between pt-4 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Remover {totalSelectedCopies} {totalSelectedCopies === 1 ? "carta" : "cartas"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={nothingSelected || isLoading}
              className={`${
                nothingSelected ? "bg-red-600/60" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isLoading ? "Removendo..." : "Remover"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Plus, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/firebase";
import {
  collection,
  doc,
  getDoc,
} from "firebase/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { addDocSilent, updateDocSilent } from "@/lib/firestoreSilent";

export default function ArtSelector({ isOpen, onClose, card, onSelectArt, deckId }) {
  const [versions, setVersions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
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
    }
  }, [isOpen, card, fetchCardVersions]);

  // 🔄 Trocar arte da carta atual
  const handleConfirm = async () => {
    if (selectedVersion && selectedVersion !== card.scryfall_id) {
      const version = versions.find((v) => v.id === selectedVersion);
      if (version) {
        const imageUrl =
          version.image_uris?.normal || version.card_faces?.[0]?.image_uris?.normal;

        console.log("🎨 ArtSelector: Selecionada nova arte", {
          card: card.card_name,
          oldImage: card.image_url,
          newImage: imageUrl,
        });

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
  };

  // 🔄 Adicionar nova carta com arte diferente
  const handleAddDifferentArt = async () => {
    if (!selectedVersion || !deckId) return;

    const version = versions.find((v) => v.id === selectedVersion);
    if (!version) return;

    const imageUrl =
      version.image_uris?.normal || version.card_faces?.[0]?.image_uris?.normal;

    try {
      // Criar card temporário otimista
      const tempId = `temp-${Date.now()}`;
      const newCard = {
        id: tempId,
        deck_id: deckId,
        card_name: version.name,
        scryfall_id: version.id,
        image_url: imageUrl,
        mana_cost: version.mana_cost || "",
        type_line: version.type_line || "",
        acquired: false,
        quantity: 1,
        created_at: new Date(),
      };

      // Inserir otimisticamente no cache e fechar modal
      queryClient.setQueryData(["cards", deckId], (old = []) => [newCard, ...old]);
      onClose();

      // Persistir em background de forma silenciosa
      const docId = await addDocSilent("cards", {
        deck_id: deckId,
        card_name: version.name,
        scryfall_id: version.id,
        image_url: imageUrl,
        mana_cost: version.mana_cost || "",
        type_line: version.type_line || "",
        acquired: false,
        quantity: 1,
        created_at: new Date(),
        // Adicionar card_faces para suportar dupla face
        card_faces: version.card_faces || null,
      });

      // Substituir temp pelo id real (ou tempId se for queued)
      queryClient.setQueryData(["cards", deckId], (old = []) =>
        old.map((c) => (c.id === tempId ? { ...c, id: docId } : c))
      );
    } catch (error) {
      // Rollback apenas em erros críticos (não quota)
      if (error.code !== "resource-exhausted") {
        console.error("Erro crítico ao adicionar carta:", error);
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      }
    }
  };

  // 🔄 Adicionar mais cópias da carta atual
  const handleAddMoreCopies = async () => {
    if (!card) return;

    try {
      // Atualização otimista local: aumentar quantidade imediatamente
      queryClient.setQueryData(["cards", deckId], (old = []) =>
        old.map((c) => (c.id === card.id ? { ...c, quantity: (c.quantity || 1) + 1 } : c))
      );

      onClose(); // fecha modal enquanto atualiza em background

      // Persistir a atualização de forma silenciosa
      const cardRef = doc(db, "cards", card.id);
      const cardSnap = await getDoc(cardRef);
      if (cardSnap.exists()) {
        const currentQuantity = cardSnap.data().quantity || 1;
        await updateDocSilent("cards", card.id, {
          quantity: currentQuantity + 1,
        });
      }
    } catch (error) {
      // Rollback apenas em erros críticos (não quota)
      if (error.code !== "resource-exhausted") {
        console.error("Erro crítico ao adicionar cópias:", error);
        queryClient.invalidateQueries({ queryKey: ["cards", deckId] });
      }
    }
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
                                <Button
                  onClick={handleAddMoreCopies}
                  variant="outline"
                  className="border-blue-600 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 h-12"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Adicionar Mais Cópias
                </Button>
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


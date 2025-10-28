import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button"; // ✅ corrigido
import { Loader2, Check, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../../firebase"; // ✅ corrigido (firebase.ts está em /src)
import { collection, query, where, getDocs } from "@/firebase";
import { updateDocSilent } from "@/lib/firestoreSilent";

export default function CoverSelector({ isOpen, onClose, deck, onSelectCover }) {
  const [selectedCover, setSelectedCover] = useState(deck?.cover_image_url || null);
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && deck?.id) {
      fetchDeckCards();
    }
  }, [isOpen, deck]);

  useEffect(() => {
    if (deck) {
      setSelectedCover(deck.cover_image_url || null);
    }
  }, [deck]);

  const fetchDeckCards = async () => {
    setIsLoading(true);
    try {
      const cardsRef = collection(db, "cards");
      const q = query(cardsRef, where("deck_id", "==", deck.id));
      const querySnapshot = await getDocs(q);
      const cardsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCards(cardsData);
    } catch (error) {
      console.error("Erro ao buscar cartas do deck:", error);
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getArtCropUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Converte para art_crop (arte sem frame) se for URL normal
    if (imageUrl.includes("/normal/")) {
      return imageUrl.replace("/normal/", "/art_crop/");
    }
    return imageUrl;
  };

  const handleConfirm = async () => {
    if (selectedCover && deck?.id) {
      try {
        // Garante que sempre salva a URL art_crop (arte sem frame)
        const artCropUrl = getArtCropUrl(selectedCover);
        await updateDocSilent("decks", deck.id, {
          cover_image_url: artCropUrl,
        });
        if (onSelectCover) onSelectCover(artCropUrl);
      } catch (error) {
        console.error("Erro ao atualizar capa do deck:", error);
      }
    }
    onClose();
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Escolher Capa - {deck?.name}
          </DialogTitle>
          <p className="text-sm text-gray-400">
            Selecione uma carta para ser a capa do deck
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">
              Adicione cartas ao deck para escolher uma capa
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[60vh] pr-2">
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {cards.map((card) => {
                  const isSelected = selectedCover === card.image_url;
                  const artCropUrl = getArtCropUrl(card.image_url);

                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: 1.05, y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedCover(card.image_url)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-[5/4] ${
                        isSelected
                          ? "border-orange-500 shadow-lg shadow-orange-500/50 ring-2 ring-orange-500/30"
                          : "border-gray-700 hover:border-gray-500"
                      }`}
                    >
                      <img
                        src={artCropUrl}
                        alt={card.card_name}
                        className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        onContextMenu={handleContextMenu}
                        draggable={false}
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      {card.quantity > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-full text-xs font-bold">
                          x{card.quantity}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedCover}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Confirmar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

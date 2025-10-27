import React, { useEffect, useState, memo } from "react";
import { Card } from "../ui/card";       // ✅ corrigido
import { Badge } from "../ui/badge";     // ✅ corrigido
import { Layers, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "../../firebase";     // ✅ corrigido (firebase.ts está em /src)
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useImageCache } from "@/hooks/useImageCache";

const formatColors = {
  Standard: "bg-gradient-to-br from-blue-500 to-blue-600",
  Modern: "bg-gradient-to-br from-purple-500 to-purple-600",
  Commander: "bg-gradient-to-br from-amber-500 to-amber-600",
  Legacy: "bg-gradient-to-br from-red-500 to-red-600",
  Vintage: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  Pioneer: "bg-gradient-to-br from-green-500 to-green-600",
  Pauper: "bg-gradient-to-br from-gray-500 to-gray-600",
  Historic: "bg-gradient-to-br from-pink-500 to-pink-600",
  Casual: "bg-gradient-to-br from-teal-500 to-teal-600"
};

function DeckCard({ deck, onClick, onSelectCover }) {
  const [coverCard, setCoverCard] = useState(null);

  // 🔧 Normaliza o formato removendo caracteres estranhos
  const normalizeFormat = (format) => {
    if (!format) return "Casual";
    
    // Remove caracteres especiais e normaliza
    const normalized = format
      .replace(/[^\x20-\x7E]/g, '') // Remove caracteres não-ASCII
      .trim();
    
    // Mapeia formatos conhecidos
    const formatMap = {
      'Standard': 'Standard',
      'Modern': 'Modern',
      'Commander': 'Commander',
      'Commander 300': 'Commander 300',
      'Commander 500': 'Commander 500',
      'Legacy': 'Legacy',
      'Vintage': 'Vintage',
      'Pioneer': 'Pioneer',
      'Pauper': 'Pauper',
      'Historic': 'Historic',
      'Casual': 'Casual'
    };
    
    return formatMap[normalized] || normalized || 'Casual';
  };

  const displayFormat = normalizeFormat(deck.format);

  useEffect(() => {
    async function fetchCoverCard() {
      if (!deck.id) return;
      const cardsRef = collection(db, "cards");
      const q = query(
        cardsRef,
        where("deck_id", "==", deck.id),
        orderBy("created_date", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setCoverCard({ id: snapshot.docs[0].id, ...data });
      }
    }

    fetchCoverCard();
  }, [deck.id]);

  const hasCover = deck.cover_image_url || coverCard?.image_url;

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleCoverClick = (e) => {
    e.stopPropagation();
    onSelectCover(deck);
  };

  const getArtCropUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // Tenta art_crop primeiro (arte sem frame)
    if (imageUrl.includes("/normal/")) {
      return imageUrl.replace("/normal/", "/art_crop/");
    }
    // Se já for art_crop ou outro formato, retorna como está
    return imageUrl;
  };

  const coverImageUrl = deck.cover_image_url || coverCard?.image_url;
  // Sempre usa art_crop (arte sem frame) se disponível
  const artCropUrl = coverImageUrl ? getArtCropUrl(coverImageUrl) : null;

  // 🖼️ Cache de imagem local (IndexedDB)
  const cachedCoverUrl = useImageCache(artCropUrl);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={onClick}
        className="cursor-pointer overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 hover:border-orange-500 transition-all duration-300 group relative"
      >
        <div className={`h-32 relative overflow-hidden ${!hasCover ? formatColors[displayFormat] || formatColors.Casual : ""}`}>
          {hasCover ? (
            <>
              <img
                src={cachedCoverUrl || artCropUrl}
                alt={deck.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onContextMenu={handleContextMenu}
                draggable={false}
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </>
          ) : (
            <div className="absolute inset-0 bg-black/20" />
          )}

          <button
            onClick={handleCoverClick}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
          >
            <ImageIcon className="w-4 h-4 text-white" />
          </button>

          <div className="absolute top-3 left-3">
            <Sparkles className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{deck.name}</h3>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-gray-700 text-gray-200 border-gray-600">
              {displayFormat}
            </Badge>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Layers className="w-4 h-4" />
              <span>{deck.card_count || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Memoiza componente - só re-renderiza se deck mudar
export default memo(DeckCard, (prevProps, nextProps) => {
  return (
    prevProps.deck.id === nextProps.deck.id &&
    prevProps.deck.name === nextProps.deck.name &&
    prevProps.deck.format === nextProps.deck.format &&
    prevProps.deck.card_count === nextProps.deck.card_count &&
    prevProps.deck.coverImage === nextProps.deck.coverImage
  );
});

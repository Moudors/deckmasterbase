import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthState } from "../../hooks/useAuthState";

const BuyRequestModal = ({ isOpen, onClose, card, deckOwnerId, deckOwnerName }) => {
  const [user] = useAuthState();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  if (!isOpen || !card) return null;

  const handleSendBuyRequest = async () => {
    setIsSending(true);
    setError(null);
    
    try {
      // Importar operações do Supabase
      const { messageOperations, userOperations } = await import("../../lib/supabaseOperations");
      
      // Buscar display_name do usuário logado
      let senderName = "";
      try {
        const userDb = await userOperations.getUser(user.id);
        senderName = userDb?.display_name || "";
      } catch (err) {
        console.error('[BUY REQUEST] Erro ao buscar display_name:', err);
      }
      
      // Enviar mensagem de interesse em comprar
      const messageText = `${senderName} tem interesse em comprar: ${card.card_name}`;
      const messageData = {
        recipient_id: deckOwnerId,
        sender_id: user?.id,
        sender_name: senderName,
        card_id: card.id,
        card_name: card.card_name,
        type: 'buy_request',
        content: messageText,
        created_at: new Date().toISOString()
      };
      
      await messageOperations.sendMessage(messageData);
      
      // Fechar modal
      onClose();
    } catch (err) {
      console.error('[BUY REQUEST] Erro ao enviar mensagem:', err);
      setError("Erro ao enviar interesse de compra");
    } finally {
      setIsSending(false);
    }
  };

  // Determinar imagem da carta
  const imageUrl = card.image_url || card.card_faces?.[0]?.image_uris?.normal;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">Interesse em Comprar</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Imagem da carta */}
            <div className="mb-4 flex justify-center">
              <img
                src={imageUrl}
                alt={card.card_name}
                className="rounded-lg max-h-64 w-auto shadow-lg"
              />
            </div>

            {/* Nome da carta */}
            <h3 className="text-lg font-semibold text-white text-center mb-4">
              {card.card_name}
            </h3>

            {/* Informação sobre o dono */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">
                Esta carta pertence a:
              </p>
              <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-white font-medium">{deckOwnerName}</span>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Uma mensagem será enviada informando seu interesse em comprar esta carta.
              </p>
            </div>

            {/* Ações */}
            {error && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={isSending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSendBuyRequest}
                disabled={isSending}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Enviando..." : "Enviar Interesse"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BuyRequestModal;

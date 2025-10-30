import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthState } from "../../hooks/useAuthState";

const TradeModal = ({ isOpen, onClose, card, friendsWhoWant = [] }) => {
  const [user] = useAuthState();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  
  if (!isOpen || !card) return null;

  const handleProposeTrade = async () => {
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
        console.error('[TRADE] Erro ao buscar display_name:', err);
      }
      
      // Enviar mensagem de trade para cada amigo interessado
      const sendPromises = friendsWhoWant.map(async (friend) => {
        const messageText = `Oferta de trade: ${card.card_name}`;
        const messageData = {
          recipient_id: friend.userId,
          sender_id: user?.id,
          sender_name: senderName,
          card_id: card.id,
          card_name: card.card_name,
          type: 'trade_offer',
          content: messageText,
          created_at: new Date().toISOString()
        };
        
        return messageOperations.sendMessage(messageData);
      });
      
      // Aguardar todas as mensagens serem enviadas
      await Promise.all(sendPromises);
      
      // Fechar modal e mostrar sucesso
      onClose();
      // Você pode adicionar um toast de sucesso aqui se quiser
    } catch (err) {
      console.error('[TRADE] Erro ao enviar mensagens:', err);
      setError("Erro ao enviar proposta de trade");
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
                <Users className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold text-white">Trade Disponível</h2>
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

            {/* Lista de amigos que querem essa carta */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-3">
                {friendsWhoWant.length === 1
                  ? "Amigo interessado:"
                  : "Amigos interessados:"}
              </p>
              <div className="space-y-2">
                {friendsWhoWant.map((friend, index) => (
                  <div
                    key={`friend-${index}-${String(friend?.userId || index)}`}
                    className="flex items-center gap-2 p-2 bg-gray-700 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Users className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="text-white font-medium">{friend.displayName}</span>
                  </div>
                ))}
              </div>
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
                Fechar
              </Button>
              <Button
                onClick={handleProposeTrade}
                disabled={isSending}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? "Enviando..." : "Propor Trade"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeModal;

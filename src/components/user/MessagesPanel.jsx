import React, { useEffect, useState, useCallback } from "react";
import { messageOperations, userOperations } from "@/lib/supabaseOperations";
import { supabase } from "@/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  MailOpen,
  Trash2,
  RefreshCw,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function MessagesPanel({ user }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const msgs = await messageOperations.getUserMessages(user.id);
      console.log('[DEBUG] Mensagens recebidas:', msgs);
      setMessages(msgs);
    } catch (err) {
      setError(err.message || 'Erro ao buscar mensagens');
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const markAsRead = async (messageId) => {
    await messageOperations.updateMessage(messageId, { read: true });
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    );
  };

  const deleteMessage = async (messageId) => {
    await messageOperations.deleteMessage(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const handleMessageClick = (message) => {
    if (!message.read && message.type !== "friend_request") {
      markAsRead(message.id);
    }
  };

  // ✅ Aceitar solicitação de amizade
  const handleAccept = async (msg) => {
    try {
      // Buscar dados atuais dos usuários
      console.log("[DEBUG] user.id:", user.id);
      console.log("[DEBUG] msg.sender_id:", msg.sender_id);
      const currentUser = await userOperations.getUser(user.id);
      const senderUser = await userOperations.getUser(msg.sender_id);
      console.log("[DEBUG] currentUser:", currentUser);
      console.log("[DEBUG] senderUser:", senderUser);

      // MIGRAÇÃO: Adiciona amizade na tabela friendships
      if (!currentUser || !senderUser) {
        throw new Error("Usuário não encontrado para amizade");
      }

      // Verifica se já existe amizade
      const { data: existingFriendship1 } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', user.id)
        .eq('friend_id', msg.sender_id)
        .single();
      const { data: existingFriendship2 } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', msg.sender_id)
        .eq('friend_id', user.id)
        .single();

      // Atualiza ou insere amizade para ambos
      let err1 = null;
      if (existingFriendship1) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('user_id', user.id)
          .eq('friend_id', msg.sender_id);
        err1 = error;
      } else {
        const { error } = await supabase
          .from('friendships')
          .insert({
            user_id: user.id,
            friend_id: msg.sender_id,
            status: 'accepted',
            created_at: new Date().toISOString()
          });
        err1 = error;
      }

      let err2 = null;
      if (existingFriendship2) {
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('user_id', msg.sender_id)
          .eq('friend_id', user.id);
        err2 = error;
      } else {
        const { error } = await supabase
          .from('friendships')
          .insert({
            user_id: msg.sender_id,
            friend_id: user.id,
            status: 'accepted',
            created_at: new Date().toISOString()
          });
        err2 = error;
      }
      if (err1 || err2) throw err1 || err2;

      // atualiza status da mensagem
      await messageOperations.updateMessage(msg.id, {
        status: "accepted",
        read: true,
      });

      setMessages((prev) => prev.filter((m) => m.id !== msg.id));

      // Forçar reload para garantir atualização da lista de amigos
      if (typeof window !== "undefined" && window.location) {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err) {
      console.error("Erro ao aceitar solicitação:", err);
    }
  };

  // ❌ Recusar solicitação
  const handleReject = async (msg) => {
    try {
      await messageOperations.updateMessage(msg.id, {
        status: "rejected",
        read: true,
      });

      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
    } catch (err) {
      console.error("Erro ao recusar solicitação:", err);
    }
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-white">Mensagens</h3>
          {unreadCount > 0 && (
            <Badge className="bg-orange-500 text-white px-2 py-0.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchMessages}
          className="h-7 w-7 hover:bg-gray-800"
        >
          <RefreshCw className="w-3 h-3 text-gray-400" />
        </Button>
      </div>

      <ScrollArea className="h-80 rounded-lg border border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Mail className="w-12 h-12 text-red-600 mb-2" />
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Mail className="w-12 h-12 text-gray-600 mb-2" />
            <p className="text-gray-500 text-sm">Nenhuma mensagem</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  onClick={() => handleMessageClick(message)}
                  className={`p-3 rounded-lg border cursor-pointer group hover:border-orange-500 transition-colors ${
                    message.read
                      ? "bg-gray-800/50 border-gray-700"
                      : "bg-orange-500/10 border-orange-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {message.type === "friend_request" ? (
                        <UserPlus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      ) : message.read ? (
                        <MailOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      )}
                      <span className="font-medium text-white text-sm truncate">
                        {message.sender_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {(() => {
                          let dateValue = message.created_date?.toDate?.() || message.created_date;
                          let dateObj = dateValue ? new Date(dateValue) : null;
                          if (!dateObj || isNaN(dateObj.getTime())) return "";
                          try {
                            return format(dateObj, "dd/MM HH:mm");
                          } catch {
                            return "";
                          }
                        })()}
                      </span>
                      {message.type !== "friend_request" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMessage(message.id);
                          }}
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/20 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed mb-2">
                    {message.content}
                  </p>

                  {/* ✅ Botões de aceitar/recusar solicitação */}
                  {message.type === "friend_request" &&
                    message.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(message);
                          }}
                        >
                          <Check className="w-4 h-4 mr-1" /> Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(message);
                          }}
                        >
                          <X className="w-4 h-4 mr-1" /> Recusar
                        </Button>
                      </div>
                    )}

                  {message.type === "friend_request" &&
                    message.status === "accepted" && (
                      <p className="text-xs text-green-400">
                        ✅ Solicitação aceita
                      </p>
                    )}

                  {message.type === "friend_request" &&
                    message.status === "rejected" && (
                      <p className="text-xs text-red-400">
                        ❌ Solicitação recusada
                      </p>
                    )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

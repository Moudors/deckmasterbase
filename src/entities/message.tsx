// src/entities/message.ts
export interface Message {
  recipient_id: string;      // ID do usuário destinatário
  sender_id: string;         // ID do usuário remetente
  sender_name?: string;      // Nome do remetente (opcional)
  message: string;           // Conteúdo da mensagem
  card_name?: string;        // Nome da carta (para trades, opcional)
  read?: boolean;            // Se a mensagem foi lida (opcional, default false)
  type?: "trade" | "general" | "friend_request"; // Tipo da mensagem (opcional, default "general")
  status?: "pending" | "accepted" | "rejected";  // Status da solicitação de amizade (opcional, default "pending")
}

// Exemplo de objeto
export const exampleMessage: Message = {
  recipient_id: "user123",
  sender_id: "user456",
  sender_name: "Lucas",
  message: "Olá! Gostaria de trocar esta carta.",
  card_name: "Black Lotus",
  read: false,
  type: "trade",
  status: "pending",
};

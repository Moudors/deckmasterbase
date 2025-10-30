// src/lib/supabaseOperations.js
import { supabase } from '../supabase';

// ==================== USERS ====================

export const userOperations = {
  // Buscar todos os usernames
  async getAllUsernames() {
    const { data, error } = await supabase
      .from('usernames')
      .select('*');
    if (error) {
      console.error('[DEBUG] Erro ao buscar todos os usernames:', error);
    } else {
      console.log('[DEBUG] Resultado getAllUsernames:', JSON.stringify(data, null, 2));
    }
    return data || [];
  },
  // Buscar todos os usuários
  async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*');
    if (error) {
      console.error('[DEBUG] Erro ao buscar todos os usuários:', error);
    } else {
      console.log('[DEBUG] Resultado getAllUsers:', JSON.stringify(data, null, 2));
    }
    return data || [];
  },
  // Buscar usuário por ID
  async getUser(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Atualizar usuário
  async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Buscar usuário por username
  async getUserByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
};

// ==================== DECKS ====================

export const deckOperations = {
  // Buscar decks do usuário
  async getUserDecks(userId) {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Buscar deck por ID
  async getDeck(id) {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Criar novo deck
  async createDeck(deckData) {
    const { data, error } = await supabase
      .from('decks')
      .insert(deckData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar deck
  async updateDeck(id, updates) {
    const { data, error } = await supabase
      .from('decks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Deletar deck
  async deleteDeck(id) {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

// ==================== DECK CARDS ====================

export const deckCardOperations = {
  // Buscar cartas de um deck
  async getDeckCards(deckId) {
    const { data, error } = await supabase
      .from('deck_cards')
      .select('id, deck_id, card_name, quantity, acquired, image_url, mana_cost, type_line, oracle_text, created_at, updated_at, card_faces, colors, color_identity, cmc, rarity, set_code, collector_number, scryfall_id, is_transparent')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Adicionar carta ao deck
  async addCardToDeck(deckId, cardData) {
    // Log detalhado para debug
    console.log("🔄 [DEBUG] Dados enviados para deck_cards:", {
      deck_id: deckId,
      ...cardData
    });

    const { data, error } = await supabase
      .from('deck_cards')
      .insert({
        deck_id: deckId,
        ...cardData
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [DEBUG] Erro ao adicionar carta ao deck:", error);
      throw error;
    }
    return data;
  },

  // Atualizar carta no deck
  async updateDeckCard(cardId, updates) {
    console.log('[DEBUG] updateDeckCard - Enviando updates:', updates);
    const { data, error } = await supabase
      .from('deck_cards')
      .update(updates)
      .eq('id', cardId)
      .select('*')
      .single();
    if (error) throw error;
    console.log('[DEBUG] updateDeckCard - Retorno do Supabase:', data);
    return data;
  },

  // Deletar carta do deck
  async deleteDeckCard(cardId) {
    const { error } = await supabase
      .from('deck_cards')
      .delete()
      .eq('id', cardId);
    
    if (error) throw error;
  },

  // Deletar várias cartas do deck
  async deleteDeckCards(cardIds) {
    const { error } = await supabase
      .from('deck_cards')
      .delete()
      .in('id', cardIds);
    
    if (error) throw error;
  }
};

// ==================== MESSAGES ====================

export const messageOperations = {
  // Buscar mensagens do usuário
  async getUserMessages(userId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Enviar mensagem
  async sendMessage(messageData) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar mensagem
  async updateMessage(messageId, updates) {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Deletar mensagem
  async deleteMessage(messageId) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    
    if (error) throw error;
  }
};

// ==================== UTILS ====================

// Gerar timestamp padrão
export const serverTimestamp = () => new Date().toISOString();

// Log de operações para debug
export const logOperation = (operation, data, error = null) => {
  if (error) {
    console.error(`❌ ${operation} failed:`, error);
  } else {
    console.log(`✅ ${operation} success:`, data);
  }
};
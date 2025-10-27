// Sistema de gerenciamento de decks locais com IDs reais
// Cria decks localmente e sincroniza com Firebase quando possível

import storage from './indexedDBStorage';

const LOCAL_DECKS_KEY = 'local_decks';
const LOCAL_CARDS_KEY = 'local_cards';

class LocalDeckManager {
  constructor() {
    this.pendingSync = new Set(); // IDs pendentes de sincronização
  }

  // Gera ID único local (compatível com Firestore)
  generateLocalId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `local_${timestamp}_${random}`;
  }

  // Salva deck localmente com ID real
  async saveDeckLocally(deckData) {
    try {
      const deckId = this.generateLocalId();
      const deck = {
        id: deckId,
        ...deckData,
        _localOnly: true, // Marca como não sincronizado
        _createdAt: new Date().toISOString(),
      };

      // Salva no IndexedDB
      const decks = await this.getLocalDecks();
      decks[deckId] = deck;
      await storage.setItem(LOCAL_DECKS_KEY, decks);

      // Marca para sincronização
      this.pendingSync.add(deckId);

      console.log("✅ Deck salvo localmente:", deckId);
      return deckId;
    } catch (error) {
      console.error("❌ Erro ao salvar deck localmente:", error);
      throw error;
    }
  }

  // Salva carta localmente
  async saveCardLocally(deckId, cardData) {
    try {
      const cardId = this.generateLocalId();
      const card = {
        id: cardId,
        deck_id: deckId,
        ...cardData,
        _localOnly: true,
        _createdAt: new Date().toISOString(),
      };

      // Salva no IndexedDB
      const cards = await this.getLocalCards();
      if (!cards[deckId]) {
        cards[deckId] = {};
      }
      cards[deckId][cardId] = card;
      await storage.setItem(LOCAL_CARDS_KEY, cards);

      // Marca para sincronização
      this.pendingSync.add(`card_${cardId}`);

      console.log("✅ Carta salva localmente:", cardId);
      return cardId;
    } catch (error) {
      console.error("❌ Erro ao salvar carta localmente:", error);
      throw error;
    }
  }

  // Busca todos os decks locais
  async getLocalDecks() {
    try {
      const decks = await storage.getItem(LOCAL_DECKS_KEY);
      return decks || {};
    } catch (error) {
      console.error("❌ Erro ao buscar decks locais:", error);
      return {};
    }
  }

  // Busca deck específico
  async getDeck(deckId) {
    try {
      const decks = await this.getLocalDecks();
      return decks[deckId] || null;
    } catch (error) {
      console.error("❌ Erro ao buscar deck:", error);
      return null;
    }
  }

  // Busca cartas de um deck
  async getDeckCards(deckId) {
    try {
      const cards = await this.getLocalCards();
      const deckCards = cards[deckId] || {};
      return Object.values(deckCards);
    } catch (error) {
      console.error("❌ Erro ao buscar cartas:", error);
      return [];
    }
  }

  // Busca todas as cartas
  async getLocalCards() {
    try {
      const cards = await storage.getItem(LOCAL_CARDS_KEY);
      return cards || {};
    } catch (error) {
      console.error("❌ Erro ao buscar cartas locais:", error);
      return {};
    }
  }

  // Atualiza deck local
  async updateDeck(deckId, updates) {
    try {
      const decks = await this.getLocalDecks();
      if (!decks[deckId]) {
        throw new Error(`Deck ${deckId} não encontrado`);
      }

      decks[deckId] = {
        ...decks[deckId],
        ...updates,
        _updatedAt: new Date().toISOString(),
      };

      await storage.setItem(LOCAL_DECKS_KEY, decks);
      
      // Marca para sincronização
      this.pendingSync.add(deckId);

      console.log("✅ Deck atualizado localmente:", deckId);
      return decks[deckId];
    } catch (error) {
      console.error("❌ Erro ao atualizar deck:", error);
      throw error;
    }
  }

  // Deleta deck local
  async deleteDeck(deckId) {
    try {
      const decks = await this.getLocalDecks();
      delete decks[deckId];
      await storage.setItem(LOCAL_DECKS_KEY, decks);

      // Remove cartas do deck
      const cards = await this.getLocalCards();
      delete cards[deckId];
      await storage.setItem(LOCAL_CARDS_KEY, cards);

      console.log("✅ Deck deletado localmente:", deckId);
    } catch (error) {
      console.error("❌ Erro ao deletar deck:", error);
      throw error;
    }
  }

  // Alias para compatibilidade
  async deleteDeckLocally(deckId) {
    return this.deleteDeck(deckId);
  }

  // Deleta uma carta específica
  async deleteCardLocally(cardId) {
    try {
      const cards = await this.getLocalCards();
      
      // Encontra e remove a carta
      let found = false;
      for (const deckId in cards) {
        if (cards[deckId][cardId]) {
          delete cards[deckId][cardId];
          found = true;
          break;
        }
      }
      
      if (found) {
        await storage.setItem(LOCAL_CARDS_KEY, cards);
        console.log("✅ Carta deletada localmente:", cardId);
      } else {
        console.warn("⚠️ Carta não encontrada:", cardId);
      }
    } catch (error) {
      console.error("❌ Erro ao deletar carta:", error);
      throw error;
    }
  }

  // Marca deck como sincronizado
  async markAsSynced(deckId, firestoreId) {
    try {
      const decks = await this.getLocalDecks();
      if (!decks[deckId]) return;

      // Atualiza com ID do Firestore
      decks[deckId]._localOnly = false;
      decks[deckId]._firestoreId = firestoreId;
      decks[deckId]._syncedAt = new Date().toISOString();

      await storage.setItem(LOCAL_DECKS_KEY, decks);
      this.pendingSync.delete(deckId);

      console.log("✅ Deck marcado como sincronizado:", deckId, "→", firestoreId);
    } catch (error) {
      console.error("❌ Erro ao marcar como sincronizado:", error);
    }
  }

  // Lista itens pendentes de sincronização
  getPendingSync() {
    return Array.from(this.pendingSync);
  }

  // Verifica se há itens pendentes
  hasPendingSync() {
    return this.pendingSync.size > 0;
  }

  // Estatísticas
  async getStats() {
    const decks = await this.getLocalDecks();
    const cards = await this.getLocalCards();
    
    const deckCount = Object.keys(decks).length;
    const localOnlyDecks = Object.values(decks).filter(d => d._localOnly).length;
    
    let cardCount = 0;
    let localOnlyCards = 0;
    Object.values(cards).forEach(deckCards => {
      cardCount += Object.keys(deckCards).length;
      localOnlyCards += Object.values(deckCards).filter(c => c._localOnly).length;
    });

    return {
      decks: {
        total: deckCount,
        localOnly: localOnlyDecks,
        synced: deckCount - localOnlyDecks,
      },
      cards: {
        total: cardCount,
        localOnly: localOnlyCards,
        synced: cardCount - localOnlyCards,
      },
      pendingSync: this.pendingSync.size,
    };
  }

  // Exporta para console (debug)
  async logStats() {
    const stats = await this.getStats();
    console.table(stats);
  }
}

// Singleton
export const localDeckManager = new LocalDeckManager();

// Expõe no window para debug
if (typeof window !== 'undefined') {
  window.localDeckManager = localDeckManager;
}

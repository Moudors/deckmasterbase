/**
 * 🔍 QUERY MANAGER - Camada de Consultas Offline-First
 * =====================================================
 * Gerencia consultas priorizando IndexedDB (cache local)
 * 
 * ESTRATÉGIA:
 * 1. Busca SEMPRE do IndexedDB primeiro (instantâneo)
 * 2. Retorna dados locais imediatamente
 * 3. Em background, sincroniza com Firebase
 * 4. Notifica componentes quando dados atualizarem
 * 
 * BENEFÍCIOS:
 * - Performance instantânea
 * - Funciona 100% offline
 * - Sincronização transparente
 */

import unifiedStorage from './unifiedStorage';
import syncManager from './syncManager';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from '../firebase';

class QueryManager {
  constructor() {
    this.cache = new Map(); // Cache em memória para queries recentes
    this.listeners = new Map(); // Listeners para atualizações
  }

  /**
   * 👤 Busca perfil do usuário
   */
  async getUserProfile(userId, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // 1. Busca do cache local (instantâneo)
      const cachedProfile = await unifiedStorage.getUserProfile(userId);
      
      if (cachedProfile && !forceRefresh) {
        console.log('⚡ Perfil carregado do cache');
        
        // Em background, atualiza do Firebase
        this.refreshUserProfileInBackground(userId);
        
        return cachedProfile;
      }

      // 2. Se não tem cache ou forceRefresh, busca do Firebase
      if (navigator.onLine) {
        console.log('🌐 Buscando perfil do Firebase...');
        const profile = await this.fetchUserProfileFromFirebase(userId);
        
        if (profile) {
          // Salva no cache
          await unifiedStorage.saveUserProfile(profile);
          return profile;
        }
      }

      // 3. Fallback para cache mesmo que antigo
      return cachedProfile;

    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      // Tenta retornar cache em caso de erro
      return await unifiedStorage.getUserProfile(userId);
    }
  }

  /**
   * 🔄 Atualiza perfil em background
   */
  async refreshUserProfileInBackground(userId) {
    if (!navigator.onLine) return;

    try {
      const profile = await this.fetchUserProfileFromFirebase(userId);
      if (profile) {
        await unifiedStorage.saveUserProfile(profile);
        this.notifyListeners(`user_${userId}`, profile);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil em background:', error);
    }
  }

  /**
   * 🌐 Busca perfil do Firebase
   */
  async fetchUserProfileFromFirebase(userId) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { userId, ...docSnap.data() };
    }
    return null;
  }

  /**
   * 🃏 Busca todos os decks do usuário
   */
  async getUserDecks(userId, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // 1. Busca do cache local (instantâneo)
      const cachedDecks = await unifiedStorage.getUserDecks(userId);
      
      if (cachedDecks.length > 0 && !forceRefresh) {
        console.log(`⚡ ${cachedDecks.length} decks carregados do cache`);
        
        // Em background, sincroniza com Firebase
        this.refreshDecksInBackground(userId);
        
        return cachedDecks;
      }

      // 2. Se não tem cache ou forceRefresh, busca do Firebase
      if (navigator.onLine) {
        console.log('🌐 Buscando decks do Firebase...');
        await syncManager.pullFromFirebase(userId);
        
        // Retorna dados atualizados do cache
        return await unifiedStorage.getUserDecks(userId);
      }

      // 3. Fallback para cache vazio
      return cachedDecks;

    } catch (error) {
      console.error('❌ Erro ao buscar decks:', error);
      return await unifiedStorage.getUserDecks(userId);
    }
  }

  /**
   * 🔄 Atualiza decks em background
   */
  async refreshDecksInBackground(userId) {
    if (!navigator.onLine) return;

    try {
      await syncManager.pullFromFirebase(userId);
      const updatedDecks = await unifiedStorage.getUserDecks(userId);
      this.notifyListeners(`decks_${userId}`, updatedDecks);
    } catch (error) {
      console.error('❌ Erro ao atualizar decks em background:', error);
    }
  }

  /**
   * 🎴 Busca deck específico
   */
  async getDeck(deckId, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // 1. Busca do cache local
      const cachedDeck = await unifiedStorage.getDeck(deckId);
      
      if (cachedDeck && !forceRefresh) {
        console.log('⚡ Deck carregado do cache:', deckId);
        
        // Background refresh
        this.refreshDeckInBackground(deckId);
        
        return cachedDeck;
      }

      // 2. Busca do Firebase se online
      if (navigator.onLine) {
        console.log('🌐 Buscando deck do Firebase:', deckId);
        const deck = await this.fetchDeckFromFirebase(deckId);
        
        if (deck) {
          await unifiedStorage.saveDeck(deck, { synced: true });
          return deck;
        }
      }

      return cachedDeck;

    } catch (error) {
      console.error('❌ Erro ao buscar deck:', error);
      return await unifiedStorage.getDeck(deckId);
    }
  }

  /**
   * 🔄 Atualiza deck em background
   */
  async refreshDeckInBackground(deckId) {
    if (!navigator.onLine) return;

    try {
      const deck = await this.fetchDeckFromFirebase(deckId);
      if (deck) {
        await unifiedStorage.saveDeck(deck, { synced: true });
        this.notifyListeners(`deck_${deckId}`, deck);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar deck em background:', error);
    }
  }

  /**
   * 🌐 Busca deck do Firebase
   */
  async fetchDeckFromFirebase(deckId) {
    const docRef = doc(db, 'decks', deckId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: deckId, ...docSnap.data() };
    }
    return null;
  }

  /**
   * 🎴 Busca cartas de um deck
   */
  async getDeckCards(deckId, options = {}) {
    const { forceRefresh = false } = options;

    try {
      // 1. Busca do cache local
      const cachedCards = await unifiedStorage.getDeckCards(deckId);
      
      if (cachedCards.length > 0 && !forceRefresh) {
        console.log(`⚡ ${cachedCards.length} cartas carregadas do cache`);
        
        // Background refresh
        this.refreshCardsInBackground(deckId);
        
        return cachedCards;
      }

      // 2. Busca do Firebase se online
      if (navigator.onLine) {
        console.log('🌐 Buscando cartas do Firebase:', deckId);
        const cards = await this.fetchCardsFromFirebase(deckId);
        
        // Salva todas no cache
        for (const card of cards) {
          await unifiedStorage.saveCard(card, { synced: true });
        }
        
        return cards;
      }

      return cachedCards;

    } catch (error) {
      console.error('❌ Erro ao buscar cartas:', error);
      return await unifiedStorage.getDeckCards(deckId);
    }
  }

  /**
   * 🔄 Atualiza cartas em background
   */
  async refreshCardsInBackground(deckId) {
    if (!navigator.onLine) return;

    try {
      const cards = await this.fetchCardsFromFirebase(deckId);
      
      for (const card of cards) {
        await unifiedStorage.saveCard(card, { synced: true });
      }
      
      this.notifyListeners(`cards_${deckId}`, cards);
    } catch (error) {
      console.error('❌ Erro ao atualizar cartas em background:', error);
    }
  }

  /**
   * 🌐 Busca cartas do Firebase
   */
  async fetchCardsFromFirebase(deckId) {
    const cardsQuery = query(
      collection(db, 'cards'),
      where('deck_id', '==', deckId)
    );
    const snapshot = await getDocs(cardsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * 💾 Cria deck (salva local + enfileira sync)
   */
  async createDeck(deckData, userId) {
    try {
      // Gera ID temporário
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const deck = {
        id: tempId,
        userId,
        ...deckData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Salva no cache local
      await unifiedStorage.saveDeck(deck, { 
        synced: false,
        pending: ['CREATE']
      });

      // Adiciona à fila de sincronização
      await unifiedStorage.addToSyncQueue({
        type: 'CREATE_DECK',
        entityType: 'decks',
        entityId: tempId,
        data: deck
      });

      console.log('✅ Deck criado localmente:', tempId);

      // Tenta sincronizar imediatamente
      syncManager.syncNow();

      return deck;

    } catch (error) {
      console.error('❌ Erro ao criar deck:', error);
      throw error;
    }
  }

  /**
   * ✏️ Atualiza deck
   */
  async updateDeck(deckId, updates) {
    try {
      // Busca deck atual
      const currentDeck = await unifiedStorage.getDeck(deckId);
      
      if (!currentDeck) {
        throw new Error(`Deck ${deckId} não encontrado`);
      }

      // Atualiza localmente
      const updatedDeck = {
        ...currentDeck,
        ...updates,
        updated_at: new Date().toISOString()
      };

      await unifiedStorage.saveDeck(updatedDeck, {
        synced: false,
        pending: ['UPDATE']
      });

      // Enfileira sincronização
      await unifiedStorage.addToSyncQueue({
        type: 'UPDATE_DECK',
        entityType: 'decks',
        entityId: deckId,
        data: updates
      });

      console.log('✅ Deck atualizado localmente:', deckId);

      // Sincroniza
      syncManager.syncNow();

      return updatedDeck;

    } catch (error) {
      console.error('❌ Erro ao atualizar deck:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Deleta deck
   */
  async deleteDeck(deckId) {
    try {
      // Deleta localmente
      await unifiedStorage.deleteDeck(deckId);

      // Enfileira sincronização
      await unifiedStorage.addToSyncQueue({
        type: 'DELETE_DECK',
        entityType: 'decks',
        entityId: deckId
      });

      console.log('✅ Deck deletado localmente:', deckId);

      // Sincroniza
      syncManager.syncNow();

    } catch (error) {
      console.error('❌ Erro ao deletar deck:', error);
      throw error;
    }
  }

  /**
   * 🎴 Adiciona carta
   */
  async addCard(deckId, cardData) {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const card = {
        id: tempId,
        deck_id: deckId,
        ...cardData,
        created_at: new Date().toISOString()
      };

      // Salva localmente
      await unifiedStorage.saveCard(card, {
        synced: false,
        pending: ['CREATE']
      });

      // Enfileira sync
      await unifiedStorage.addToSyncQueue({
        type: 'CREATE_CARD',
        entityType: 'cards',
        entityId: tempId,
        data: card
      });

      console.log('✅ Carta adicionada localmente:', tempId);

      syncManager.syncNow();

      return card;

    } catch (error) {
      console.error('❌ Erro ao adicionar carta:', error);
      throw error;
    }
  }

  /**
   * ✏️ Atualiza carta
   */
  async updateCard(cardId, updates) {
    try {
      const currentCard = await unifiedStorage.getCard(cardId);
      
      if (!currentCard) {
        throw new Error(`Carta ${cardId} não encontrada`);
      }

      const updatedCard = {
        ...currentCard,
        ...updates
      };

      await unifiedStorage.saveCard(updatedCard, {
        synced: false,
        pending: ['UPDATE']
      });

      await unifiedStorage.addToSyncQueue({
        type: 'UPDATE_CARD',
        entityType: 'cards',
        entityId: cardId,
        data: updates
      });

      console.log('✅ Carta atualizada localmente:', cardId);

      syncManager.syncNow();

      return updatedCard;

    } catch (error) {
      console.error('❌ Erro ao atualizar carta:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Deleta carta
   */
  async deleteCard(cardId) {
    try {
      await unifiedStorage.deleteCard(cardId);

      await unifiedStorage.addToSyncQueue({
        type: 'DELETE_CARD',
        entityType: 'cards',
        entityId: cardId
      });

      console.log('✅ Carta deletada localmente:', cardId);

      syncManager.syncNow();

    } catch (error) {
      console.error('❌ Erro ao deletar carta:', error);
      throw error;
    }
  }

  /**
   * 🔔 Registra listener para atualizações
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);

    // Retorna função de unsubscribe
    return () => {
      const callbacks = this.listeners.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * 📢 Notifica listeners
   */
  notifyListeners(key, data) {
    const callbacks = this.listeners.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  /**
   * 🧹 Limpa cache em memória
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache em memória limpo');
  }
}

// Singleton
const queryManager = new QueryManager();

// Expõe no window para debug
if (typeof window !== 'undefined') {
  window.queryManager = queryManager;
  console.log('🔍 QueryManager disponível em window.queryManager');
}

export default queryManager;

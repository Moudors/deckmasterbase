// Hook unificado para gerenciar decks - Online First com fallback offline
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectivity } from './connectivityManager';
import { offlineCacheManager } from './offlineCacheManager';
import { deckOperations, deckCardOperations } from './supabaseOperations';
import { useAuthState } from '../hooks/useAuthState';
import { supabase } from '../supabase';

export function useDecks() {
  const [user, authLoading] = useAuthState(); // ✅ Correção: useAuthState retorna array
  const connectivity = useConnectivity();
  const queryClient = useQueryClient();

  // Query para buscar decks
  const {
    data: decks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['decks'],
    queryFn: async () => {
      // 🔍 Obter o usuário autenticado do Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('👤 Usuário não autenticado, retornando array vazio');
        return [];
      }

      console.log('👤 Usuário autenticado para buscar decks:', user.email, 'ID:', user.id);

      // MODO ONLINE: Busca do Supabase e faz cache
      if (connectivity.canSaveData) {
        try {
          const onlineDecks = await deckOperations.getUserDecks(user.id);
          
          // Salva no cache para uso offline
          await offlineCacheManager.cacheDecks(user.id, onlineDecks);
          await offlineCacheManager.setLastSyncTime();
          
          console.log('✅ Decks encontrados online:', onlineDecks.length);
          console.log('📋 Lista de decks:', onlineDecks.map(d => ({ id: d.id, name: d.name, owner_id: d.owner_id })));
          
          return onlineDecks;
        } catch (err) {
          console.error('⚠️ Erro detalhado ao buscar decks online:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint,
            fullError: err
          });
          
          // Fallback para cache offline
          const cachedDecks = await offlineCacheManager.getCachedDecks(user.id);
          console.log('📦 Usando cache offline:', cachedDecks.length, 'decks');
          return cachedDecks;
        }
      }
      
      // MODO OFFLINE: Busca do cache
      console.log('📱 Modo offline - buscando decks do cache');
      return await offlineCacheManager.getCachedDecks(user.id);
    },
    enabled: true, // Sempre habilitado, a verificação de auth é interna
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Mutation para criar deck (apenas online)
  const createDeckMutation = useMutation({
    mutationFn: async (deckData) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível criar decks offline. Conecte-se à internet.');
      }
      
      // 🔍 Obter o usuário autenticado do Supabase (uma única vez)
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('🆕 Criando deck online para usuário:', user.email);
      
      // Chama diretamente o Supabase sem dupla autenticação
      const { data, error } = await supabase
        .from('decks')
        .insert({
          ...deckData,
          owner_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newDeck) => {
      console.log('✅ Deck criado com sucesso:', newDeck.id);
      
      // Atualiza cache otimisticamente
      queryClient.setQueryData(['decks'], (old = []) => [newDeck, ...old]);
      
      // 🔄 Força invalidação das queries para garantir sincronização
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      
      // 📦 Atualiza cache offline também
      if (user?.id) {
        offlineCacheManager.cacheDecks(user.id, [newDeck, ...decks]);
      }
    },
  });

  // Mutation para atualizar deck (apenas online)
  const updateDeckMutation = useMutation({
    mutationFn: async ({ deckId, updates }) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível editar decks offline. Conecte-se à internet.');
      }
      
      console.log('✏️ Atualizando deck online');
      return await deckOperations.updateDeck(deckId, updates);
    },
    onSuccess: (updatedDeck, { deckId }) => {
      // Atualiza o deck no cache
      queryClient.setQueryData(['decks'], (old = []) =>
        old.map(deck => deck.id === deckId ? { ...deck, ...updatedDeck } : deck)
      );
      
      // Invalida e recarrega as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      
      // Atualiza cache offline
      if (user?.id) {
        const updatedDecks = decks.map(deck => 
          deck.id === deckId ? { ...deck, ...updatedDeck } : deck
        );
        offlineCacheManager.cacheDecks(user.id, updatedDecks);
      }
    },
  });

  // Mutation para deletar deck (apenas online)
  const deleteDeckMutation = useMutation({
    mutationFn: async (deckId) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível deletar decks offline. Conecte-se à internet.');
      }
      
      console.log('🗑️ Deletando deck online');
      return await deckOperations.deleteDeck(deckId);
    },
    onSuccess: (_, deckId) => {
      // Remove o deck do cache
      queryClient.setQueryData(['decks'], (old = []) =>
        old.filter(deck => deck.id !== deckId)
      );
      
      // Invalida queries
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      
      // Atualiza cache offline
      if (user?.id) {
        const filteredDecks = decks.filter(deck => deck.id !== deckId);
        offlineCacheManager.cacheDecks(user.id, filteredDecks);
      }
    },
  });

  // Função para forçar sincronização (quando voltar online)
  const syncDecks = async () => {
    if (connectivity.canSaveData && user?.id) {
      console.log('🔄 Sincronizando decks...');
      await refetch();
    }
  };

  return {
    // Dados
    decks,
    isLoading,
    error,
    
    // Estados
    isOnline: connectivity.canSaveData,
    isOfflineMode: connectivity.isOfflineMode,
    canEdit: connectivity.canSaveData,
    
    // Mutations (apenas online)
    createDeck: createDeckMutation.mutateAsync,
    updateDeck: updateDeckMutation.mutateAsync,
    deleteDeck: deleteDeckMutation.mutateAsync,
    
    // Estados das mutations
    isCreating: createDeckMutation.isPending,
    isUpdating: updateDeckMutation.isPending,
    isDeleting: deleteDeckMutation.isPending,
    
    // Erros das mutations
    createError: createDeckMutation.error,
    updateError: updateDeckMutation.error,
    deleteError: deleteDeckMutation.error,
    
    // Funções utilitárias
    refetch,
    syncDecks,
  };
}

export function useDeckCards(deckId) {
  const connectivity = useConnectivity();
  const queryClient = useQueryClient();

  // Query para buscar cartas do deck
  const {
    data: cards = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['cards', deckId],
    queryFn: async () => {
      if (!deckId) return [];

      // Sempre busca do Supabase, nunca do cache offline
      console.log(`🌐 Buscando cartas do deck ${deckId} diretamente do Supabase (sem cache offline)`);
      const onlineCards = await deckCardOperations.getDeckCards(deckId);
      return onlineCards;
    },
    enabled: !!deckId,
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para adicionar carta (apenas online)
  const addCardMutation = useMutation({
    mutationFn: async (cardData) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível adicionar cartas offline. Conecte-se à internet.');
      }
      
      console.log('➕ Adicionando carta online');
      return await deckCardOperations.addCardToDeck(deckId, cardData);
    },
    onSuccess: (newCard) => {
      // Adiciona a carta ao cache
      queryClient.setQueryData(['cards', deckId], (old = []) => [newCard, ...old]);
      
      // Atualiza cache offline
      offlineCacheManager.cacheDeckCards(deckId, [newCard, ...cards]);
    },
  });

  // Mutation para atualizar carta (apenas online)
  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, updates }) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível editar cartas offline. Conecte-se à internet.');
      }
      
      console.log('✏️ Atualizando carta online:', { cardId, updates });
      return await deckCardOperations.updateDeckCard(cardId, updates);
    },
    // Removido update otimístico: só atualiza cache após sucesso do banco
    onMutate: async ({ cardId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['cards', deckId] });
      // Snapshot para rollback, mas sem update otimístico
      const previousCards = queryClient.getQueryData(['cards', deckId]);
      return { previousCards, cardId, updates };
    },
    onSuccess: (updatedCard, { cardId, updates }) => {
      // Após atualização, força refetch das cartas diretamente do Supabase
      queryClient.invalidateQueries({ queryKey: ['cards', deckId] });
      // Atualiza cache offline APENAS após sucesso
      if (updatedCard) {
        const cards = queryClient.getQueryData(['cards', deckId]) || [];
        const updatedCards = cards.map(card => card.id === cardId ? { ...card, ...updatedCard } : card);
        offlineCacheManager.cacheDeckCards(deckId, updatedCards);
        console.log('[DEBUG] Cache offline atualizado após sucesso:', updatedCard);
      }
    },
    onError: (err, { cardId }, context) => {
      // Rollback em caso de erro
      if (context?.previousCards) {
        queryClient.setQueryData(['cards', deckId], context.previousCards);
      }
      console.error('❌ Erro ao atualizar carta:', err);
    },
  });

  // Mutation para deletar carta (apenas online)
  const deleteCardMutation = useMutation({
    mutationFn: async (cardId) => {
      if (!connectivity.canSaveData) {
        throw new Error('Não é possível remover cartas offline. Conecte-se à internet.');
      }
      
      console.log('🗑️ Removendo carta online');
      return await deckCardOperations.deleteDeckCard(cardId);
    },
    onSuccess: (_, cardId) => {
      // Remove a carta do cache
      queryClient.setQueryData(['cards', deckId], (old = []) =>
        old.filter(card => card.id !== cardId)
      );
      
      // Atualiza cache offline
      const filteredCards = cards.filter(card => card.id !== cardId);
      offlineCacheManager.cacheDeckCards(deckId, filteredCards);
    },
  });

  return {
    // Dados
    cards,
    isLoading,
    error,
    
    // Estados
    isOnline: connectivity.canSaveData,
    isOfflineMode: connectivity.isOfflineMode,
    canEdit: connectivity.canSaveData,
    
    // Mutations (apenas online)
    addCard: addCardMutation.mutate,
    updateCard: updateCardMutation.mutate,
    deleteCard: deleteCardMutation.mutate,
    
    // Estados das mutations
    isAdding: addCardMutation.isPending,
    isUpdating: updateCardMutation.isPending,
    isDeleting: deleteCardMutation.isPending,
    
    // Erros das mutations
    addError: addCardMutation.error,
    updateError: updateCardMutation.error,
    deleteError: deleteCardMutation.error,
    
    // Funções utilitárias
    refetch,
  };
}
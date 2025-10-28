// Script para debugar navegação e decks
// Execute no console do navegador (F12 -> Console)

console.log('=== DEBUG DE NAVEGAÇÃO E DECKS ===');

// Função para verificar decks carregados
window.debugDecks = async () => {
    console.log('📦 Verificando decks carregados...');
    
    try {
        // Verificar autenticação
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error || !session?.user) {
            console.error('❌ Usuário não autenticado');
            return;
        }
        
        console.log('✅ Usuário autenticado:', session.user.email);
        
        // Buscar decks
        const { data: decks, error: deckError } = await window.supabase
            .from('decks')
            .select('id, name, format, cover_image_url, created_at')
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (deckError) {
            console.error('❌ Erro ao buscar decks:', deckError);
            return;
        }
        
        console.log('📊 Total de decks:', decks.length);
        decks.forEach((deck, index) => {
            console.log(`${index + 1}. ${deck.name} (${deck.id})`, {
                format: deck.format,
                cover: deck.cover_image_url ? 'TEM' : 'SEM',
                created: deck.created_at
            });
        });
        
        return decks;
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
};

// Função para testar navegação para um deck
window.testNavigation = (deckId) => {
    if (!deckId) {
        console.log('❌ ID do deck é obrigatório');
        console.log('Uso: testNavigation("deck-id-aqui")');
        return;
    }
    
    console.log('🔄 Testando navegação para deck:', deckId);
    
    // Simular clique - navegar para o deckbuilder
    const url = `/deckbuilder/${deckId}`;
    console.log('🔗 Navegando para:', url);
    
    // Tentar navegação usando window.location
    window.location.hash = `#${url}`;
    
    // Ou tentar com React Router se disponível
    if (window.history && window.history.pushState) {
        window.history.pushState(null, '', url);
        // Disparar evento para React Router detectar
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
};

// Função para verificar uma carta de deck específico
window.debugDeckCards = async (deckId) => {
    if (!deckId) {
        console.log('❌ ID do deck é obrigatório');
        console.log('Uso: debugDeckCards("deck-id-aqui")');
        return;
    }
    
    console.log('🃏 Verificando cartas do deck:', deckId);
    
    try {
        const { data: cards, error } = await window.supabase
            .from('deck_cards')
            .select('*')
            .eq('deck_id', deckId);
            
        if (error) {
            console.error('❌ Erro ao buscar cartas:', error);
            return;
        }
        
        console.log('📊 Total de cartas:', cards.length);
        cards.forEach((card, index) => {
            console.log(`${index + 1}. ${card.name} x${card.quantity}`);
        });
        
        return cards;
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
};

// Função para testar atualização de cover
window.testCoverUpdate = async (deckId, imageUrl) => {
    if (!deckId || !imageUrl) {
        console.log('❌ ID do deck e URL da imagem são obrigatórios');
        console.log('Uso: testCoverUpdate("deck-id", "https://exemplo.com/imagem.jpg")');
        return;
    }
    
    console.log('🖼️ Testando atualização de cover...');
    console.log('Deck:', deckId);
    console.log('Imagem:', imageUrl);
    
    try {
        const { data, error } = await window.supabase
            .from('decks')
            .update({ cover_image_url: imageUrl })
            .eq('id', deckId)
            .select();
            
        if (error) {
            console.error('❌ Erro ao atualizar cover:', error);
            return;
        }
        
        console.log('✅ Cover atualizada:', data);
        
        // Recarregar página para ver mudança
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        return data;
        
    } catch (err) {
        console.error('❌ Erro inesperado:', err);
    }
};

console.log('=== COMANDOS DISPONÍVEIS ===');
console.log('debugDecks() - Listar todos os decks');
console.log('testNavigation("deck-id") - Testar navegação para deck');
console.log('debugDeckCards("deck-id") - Verificar cartas de um deck');
console.log('testCoverUpdate("deck-id", "url-imagem") - Testar atualização de cover');
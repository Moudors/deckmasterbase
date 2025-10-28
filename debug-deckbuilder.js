// Debug específico para o Deckbuilder
// Execute DEPOIS de navegar para /deckbuilder/ID-DO-DECK

console.log('=== DEBUG DECKBUILDER ===');

window.debugDeckbuilder = async () => {
    try {
        // 1. Verificar URL
        const url = window.location.pathname;
        const match = url.match(/\/deckbuilder\/(.+)/);
        
        if (!match) {
            console.log('❌ Não está na página do deckbuilder');
            return;
        }
        
        const deckId = match[1];
        console.log('🎯 Deck ID da URL:', deckId);
        
        // 2. Verificar autenticação
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session?.user) {
            console.log('❌ Usuário não autenticado');
            return;
        }
        
        console.log('✅ Usuário autenticado:', session.user.email);
        
        // 3. Testar busca direta do deck
        console.log('🔍 Buscando deck específico...');
        const { data: deck, error: deckError } = await window.supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .single();
            
        if (deckError) {
            console.error('❌ Erro ao buscar deck específico:', deckError);
            return;
        }
        
        console.log('✅ Deck encontrado:', deck);
        console.log('   Nome:', deck.name);
        console.log('   Owner ID:', deck.owner_id);
        console.log('   User ID:', session.user.id);
        console.log('   Match:', deck.owner_id === session.user.id ? '✅' : '❌');
        
        // 4. Testar busca de todos os decks (como faz o hook)
        console.log('\n🔍 Testando busca como o hook useDecks...');
        const { data: allDecks, error: allDecksError } = await window.supabase
            .from('decks')
            .select('*')
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (allDecksError) {
            console.error('❌ Erro ao buscar todos os decks:', allDecksError);
            return;
        }
        
        console.log('📦 Todos os decks:', allDecks.length);
        const currentDeck = allDecks.find(d => d.id === deckId);
        
        if (currentDeck) {
            console.log('✅ Deck atual encontrado na lista!');
        } else {
            console.log('❌ Deck atual NÃO encontrado na lista!');
        }
        
        // 5. Verificar React Query Cache
        if (window.queryClient) {
            console.log('\n🔍 Verificando cache do React Query...');
            const cachedDecks = window.queryClient.getQueryData(['decks']);
            console.log('Cache de decks:', cachedDecks);
            
            if (cachedDecks && Array.isArray(cachedDecks)) {
                const cachedDeck = cachedDecks.find(d => d.id === deckId);
                console.log('Deck no cache:', cachedDeck ? '✅ Encontrado' : '❌ Não encontrado');
            }
        }
        
        // 6. Simular o que o Deckbuilder faz
        console.log('\n🎭 Simulando lógica do Deckbuilder...');
        
        // Simular currentDeck = useMemo(() => decks?.find(deck => deck.id === deckId) || null)
        const simulatedCurrentDeck = allDecks?.find(deck => deck.id === deckId) || null;
        
        if (simulatedCurrentDeck) {
            console.log('✅ Simulação bem-sucedida! Deck seria encontrado:', simulatedCurrentDeck.name);
        } else {
            console.log('❌ Simulação falhou! Deck não seria encontrado');
            console.log('Motivos possíveis:');
            console.log('- allDecks está vazio');
            console.log('- deckId não confere');
            console.log('- Problema no find()');
        }
        
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
    }
};

// Executar automaticamente se estivermos no deckbuilder
if (window.location.pathname.includes('/deckbuilder/')) {
    setTimeout(debugDeckbuilder, 1000);
}

console.log('=== COMANDOS ===');
console.log('debugDeckbuilder() - Debug específico do deckbuilder');
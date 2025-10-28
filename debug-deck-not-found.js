// Debug específico para problema "deck não encontrado"
// Execute no console do navegador após fazer login

console.log('=== DEBUG: DECK NÃO ENCONTRADO ===');

window.debugDeckNotFound = async () => {
    try {
        // 1. Verificar autenticação
        const { data: { session }, error: authError } = await window.supabase.auth.getSession();
        
        if (authError || !session?.user) {
            console.error('❌ Problema de autenticação:', authError);
            return;
        }
        
        console.log('✅ Usuário autenticado:', session.user.email);
        console.log('👤 User ID:', session.user.id);
        
        // 2. Buscar todos os decks do usuário
        const { data: allDecks, error: deckError } = await window.supabase
            .from('decks')
            .select('*')
            .eq('owner_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (deckError) {
            console.error('❌ Erro ao buscar decks:', deckError);
            return;
        }
        
        console.log('📦 Total de decks encontrados:', allDecks.length);
        
        if (allDecks.length === 0) {
            console.log('ℹ️ Nenhum deck encontrado. Você precisa criar um deck primeiro!');
            console.log('🔄 Execute: window.location.href = "/create"');
            return;
        }
        
        // 3. Mostrar detalhes de cada deck
        allDecks.forEach((deck, index) => {
            console.log(`\n📋 Deck ${index + 1}:`);
            console.log(`   Nome: ${deck.name}`);
            console.log(`   ID: ${deck.id}`);
            console.log(`   Formato: ${deck.format}`);
            console.log(`   Owner ID: ${deck.owner_id}`);
            console.log(`   Cover: ${deck.cover_image_url || 'Sem cover'}`);
            console.log(`   Criado: ${deck.created_at}`);
            console.log(`   🔗 Testar: window.location.href = '/deckbuilder/${deck.id}'`);
        });
        
        // 4. Testar busca específica do primeiro deck
        if (allDecks.length > 0) {
            const firstDeck = allDecks[0];
            console.log(`\n🔍 Testando busca específica do deck: ${firstDeck.name}`);
            
            const { data: specificDeck, error: specificError } = await window.supabase
                .from('decks')
                .select('*')
                .eq('id', firstDeck.id)
                .single();
                
            if (specificError) {
                console.error('❌ Erro ao buscar deck específico:', specificError);
            } else {
                console.log('✅ Deck específico encontrado:', specificDeck);
                
                // 5. Testar navegação
                console.log('\n🔄 Para testar navegação, execute:');
                console.log(`window.location.href = '/deckbuilder/${firstDeck.id}'`);
                
                // 6. Verificar se há cartas no deck
                const { data: cards, error: cardsError } = await window.supabase
                    .from('deck_cards')
                    .select('*')
                    .eq('deck_id', firstDeck.id);
                    
                if (cardsError) {
                    console.error('❌ Erro ao buscar cartas:', cardsError);
                } else {
                    console.log(`🃏 Cartas no deck: ${cards.length}`);
                }
            }
        }
        
        // 7. Verificar URL atual
        console.log('\n🔗 Informações da URL:');
        console.log('URL atual:', window.location.href);
        console.log('Pathname:', window.location.pathname);
        console.log('Hash:', window.location.hash);
        
        // 8. Extrair ID da URL se estiver no deckbuilder
        const match = window.location.pathname.match(/\/deckbuilder\/(.+)/);
        if (match) {
            const urlDeckId = match[1];
            console.log(`\n🎯 ID do deck na URL: ${urlDeckId}`);
            
            // Verificar se esse deck existe
            const deckExists = allDecks.find(deck => deck.id === urlDeckId);
            if (deckExists) {
                console.log('✅ Deck da URL encontrado na lista!');
            } else {
                console.log('❌ Deck da URL NÃO encontrado na lista!');
                console.log('💡 Possível problema: ID incorreto ou deck de outro usuário');
            }
        }
        
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
    }
};

// Executar automaticamente
debugDeckNotFound();

console.log('\n=== COMANDOS DISPONÍVEIS ===');
console.log('debugDeckNotFound() - Executar debug completo');
console.log('window.location.href = "/create" - Criar novo deck');
console.log('window.location.href = "/" - Voltar para home');
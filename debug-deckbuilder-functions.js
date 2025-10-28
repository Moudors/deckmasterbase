// Debug específico para funcionalidades do Deckbuilder
// Execute no console do navegador estando na página do deckbuilder

console.log('=== DEBUG FUNCIONALIDADES DECKBUILDER ===');

window.debugDeckbuilderFunctions = async () => {
    try {
        // 1. Verificar parâmetros da URL
        const url = window.location.pathname;
        const match = url.match(/\/deckbuilder\/(.+)/);
        
        if (!match) {
            console.log('❌ Não está na página do deckbuilder');
            return;
        }
        
        const deckId = match[1];
        console.log('🎯 Deck ID:', deckId);
        
        // 2. Verificar autenticação
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session?.user) {
            console.log('❌ Usuário não autenticado');
            return;
        }
        
        console.log('✅ Usuário autenticado:', session.user.email);
        
        // 3. Testar busca de cartas do deck atual
        console.log('\n🃏 Testando busca de cartas...');
        const { data: currentCards, error: cardsError } = await window.supabase
            .from('deck_cards')
            .select('*')
            .eq('deck_id', deckId);
            
        if (cardsError) {
            console.error('❌ Erro ao buscar cartas:', cardsError);
        } else {
            console.log('📊 Cartas no deck:', currentCards.length);
            currentCards.forEach((card, index) => {
                console.log(`  ${index + 1}. ${card.name} x${card.quantity}`);
            });
        }
        
        // 4. Testar função de adicionar carta
        console.log('\n➕ Testando adição de carta...');
        const testCard = {
            deck_id: deckId,
            scryfall_id: 'test-' + Date.now(),
            name: 'Carta Teste Debug',
            image_url: 'https://example.com/test.jpg',
            mana_cost: '{1}{W}',
            type_line: 'Creature — Human',
            quantity: 1,
            acquired: false
        };
        
        const { data: newCard, error: addError } = await window.supabase
            .from('deck_cards')
            .insert(testCard)
            .select()
            .single();
            
        if (addError) {
            console.error('❌ Erro ao adicionar carta de teste:', addError);
        } else {
            console.log('✅ Carta de teste adicionada:', newCard);
            
            // Limpar carta de teste
            setTimeout(async () => {
                const { error: deleteError } = await window.supabase
                    .from('deck_cards')
                    .delete()
                    .eq('id', newCard.id);
                    
                if (deleteError) {
                    console.error('❌ Erro ao deletar carta de teste:', deleteError);
                } else {
                    console.log('🗑️ Carta de teste removida');
                }
            }, 2000);
        }
        
        // 5. Testar função de busca no Scryfall
        console.log('\n🔍 Testando busca no Scryfall...');
        try {
            const response = await fetch('https://api.scryfall.com/cards/autocomplete?q=lightning bolt');
            const suggestions = await response.json();
            console.log('✅ Scryfall funcionando:', suggestions.data?.slice(0, 3));
        } catch (scryfallError) {
            console.error('❌ Erro no Scryfall:', scryfallError);
        }
        
        // 6. Testar atualização de cover
        console.log('\n🖼️ Testando atualização de cover...');
        const testImageUrl = 'https://cards.scryfall.io/art_crop/front/1/5/15b0f214-8668-4921-88ba-7ccf71015bd6.jpg';
        
        const { data: updatedDeck, error: updateError } = await window.supabase
            .from('decks')
            .update({ cover_image_url: testImageUrl })
            .eq('id', deckId)
            .select()
            .single();
            
        if (updateError) {
            console.error('❌ Erro ao atualizar cover:', updateError);
        } else {
            console.log('✅ Cover atualizada:', updatedDeck.cover_image_url);
        }
        
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
    }
};

// Função para testar busca de cartas específicas
window.testCardSearch = async (cardName = 'Lightning Bolt') => {
    console.log('🔍 Testando busca por:', cardName);
    
    try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
        const cardData = await response.json();
        
        if (cardData.object === 'error') {
            console.error('❌ Carta não encontrada:', cardData);
            return;
        }
        
        console.log('✅ Carta encontrada:', {
            name: cardData.name,
            mana_cost: cardData.mana_cost,
            type_line: cardData.type_line,
            image: cardData.image_uris?.normal
        });
        
        return cardData;
        
    } catch (error) {
        console.error('❌ Erro na busca:', error);
    }
};

// Executar debug automaticamente
debugDeckbuilderFunctions();

console.log('\n=== COMANDOS DISPONÍVEIS ===');
console.log('debugDeckbuilderFunctions() - Debug completo');
console.log('testCardSearch("Nome da Carta") - Testar busca específica');
console.log('window.location.reload() - Recarregar página');
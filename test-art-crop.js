// Script para testar a nova funcionalidade de capa com art_crop
console.log("🎨 === TESTE DE BUSCA DE CAPA COM ART_CROP ===");

// Função para testar diretamente a API do Scryfall
async function testScryfallArtCrop() {
  console.log("\n🌐 Testando API do Scryfall para art_crop...");
  
  const testCards = ['Lightning Bolt', 'Black Lotus', 'Sol Ring', 'Counterspell'];
  
  for (const cardName of testCards) {
    try {
      console.log(`\n🔍 Testando: ${cardName}`);
      
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      
      if (response.ok) {
        const cardData = await response.json();
        
        console.log(`📊 Formatos disponíveis para ${cardName}:`);
        console.log(`  🎨 art_crop: ${cardData.image_uris?.art_crop ? '✅' : '❌'}`);
        console.log(`  🖼️ large: ${cardData.image_uris?.large ? '✅' : '❌'}`);
        console.log(`  📷 normal: ${cardData.image_uris?.normal ? '✅' : '❌'}`);
        console.log(`  🖼️ border_crop: ${cardData.image_uris?.border_crop ? '✅' : '❌'}`);
        
        if (cardData.image_uris?.art_crop) {
          console.log(`  🎯 Art crop URL: ${cardData.image_uris.art_crop}`);
        }
        
        // Testar carregamento da imagem
        if (cardData.image_uris?.art_crop) {
          const img = new Image();
          img.onload = () => {
            console.log(`  ✅ Art crop carrega corretamente: ${img.width}x${img.height}`);
          };
          img.onerror = () => {
            console.log(`  ❌ Erro ao carregar art crop`);
          };
          img.src = cardData.image_uris.art_crop;
        }
        
      } else {
        console.log(`  ❌ Carta não encontrada: ${response.status}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao buscar ${cardName}:`, error);
    }
  }
}

// Função para testar a busca melhorada no app
function testEnhancedSearch() {
  console.log("\n🔍 === TESTE DE BUSCA MELHORADA ===");
  
  const searchInput = document.querySelector('input[placeholder*="carta"]');
  
  if (!searchInput) {
    console.log("❌ Modal de busca não está aberto");
    console.log("💡 Para abrir:");
    console.log("  1. Clique no botão ⚙ de um deck");
    console.log("  2. Clique em 'Alterar Capa'");
    return;
  }
  
  console.log("✅ Modal de busca encontrado!");
  
  // Testar busca
  const testQuery = "Lightning";
  console.log(`📝 Testando busca com: "${testQuery}"`);
  
  searchInput.value = testQuery;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Verificar após 3 segundos
  setTimeout(() => {
    const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
    console.log(`📋 Sugestões encontradas: ${suggestions.length}`);
    
    if (suggestions.length > 0) {
      console.log("✅ Busca funcionando!");
      
      suggestions.forEach((sug, i) => {
        const img = sug.querySelector('img');
        const cardName = sug.querySelector('.text-white').textContent;
        const artCropBadge = sug.querySelector('.text-green-400');
        const frameBadge = sug.querySelector('.text-yellow-400');
        
        console.log(`  ${i + 1}: ${cardName}`);
        console.log(`     📸 Imagem: ${img ? '✅' : '❌'}`);
        console.log(`     🎨 Art crop: ${artCropBadge ? '✅' : '❌'}`);
        console.log(`     🖼️ Com moldura: ${frameBadge ? '✅' : '❌'}`);
        
        if (img) {
          console.log(`     🔗 URL: ${img.src}`);
        }
      });
      
      // Testar clique na primeira sugestão
      if (suggestions.length > 0) {
        console.log("\n🖱️ Testando clique na primeira sugestão...");
        
        // Interceptar logs da função handleSelectCover
        const originalLog = console.log;
        console.log = function(...args) {
          if (args[0] && args[0].includes('COVER FUNCTION')) {
            console.warn("🖼️ COVER DEBUG:", ...args);
          }
          originalLog.apply(console, args);
        };
        
        suggestions[0].click();
        
        // Restaurar após 5 segundos
        setTimeout(() => {
          console.log = originalLog;
          console.log("✅ Teste de clique concluído");
        }, 5000);
      }
      
    } else {
      console.log("❌ Nenhuma sugestão encontrada");
      console.log("🔍 Possíveis problemas:");
      console.log("  - API do Scryfall não respondeu");
      console.log("  - Função handleSearchAutocomplete falhou");
      console.log("  - Rede lenta (aguarde mais tempo)");
    }
  }, 3000);
}

// Função para verificar melhorias visuais
function checkVisualImprovements() {
  console.log("\n🎨 === VERIFICANDO MELHORIAS VISUAIS ===");
  
  const searchInput = document.querySelector('input[placeholder*="carta"]');
  
  if (searchInput) {
    console.log("✅ Modal de busca ativo");
    
    // Verificar se há sugestões com imagens
    const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
    const suggestionsWithImages = Array.from(suggestions).filter(sug => sug.querySelector('img'));
    
    console.log(`📊 Estatísticas:`);
    console.log(`  📋 Total de sugestões: ${suggestions.length}`);
    console.log(`  🖼️ Com imagens: ${suggestionsWithImages.length}`);
    console.log(`  🎨 Art crop badges: ${document.querySelectorAll('.text-green-400').length}`);
    console.log(`  🖼️ Frame badges: ${document.querySelectorAll('.text-yellow-400').length}`);
    
    if (suggestionsWithImages.length > 0) {
      console.log("✅ Melhorias visuais funcionando!");
    } else {
      console.log("⚠️ Faça uma busca para ver as melhorias visuais");
    }
    
  } else {
    console.log("❌ Modal não está aberto");
  }
}

// Executar testes
setTimeout(() => {
  testScryfallArtCrop();
}, 1000);

setTimeout(() => {
  checkVisualImprovements();
}, 2000);

// Disponibilizar funções
window.testScryfallArtCrop = testScryfallArtCrop;
window.testEnhancedSearch = testEnhancedSearch;
window.checkVisualImprovements = checkVisualImprovements;

console.log("\n💡 === FUNÇÕES DISPONÍVEIS ===");
console.log("• testScryfallArtCrop() - Testa API do Scryfall");
console.log("• testEnhancedSearch() - Testa busca no app (abra modal primeiro)");
console.log("• checkVisualImprovements() - Verifica melhorias visuais");
console.log("\n🚀 Executando testes automáticos...");
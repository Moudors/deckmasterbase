// Teste específico para cartas de duas faces (dual-face cards)

console.log("🔄 === TESTE DE CARTAS DUAL-FACE ===");

// Lista de cartas de duas faces famosas para testar
const dualFaceCards = [
  'Delver of Secrets',
  'Huntmaster of the Fells',
  'Jace, Vryn\'s Prodigy',
  'Bloodline Keeper',
  'Village Messenger',
  'Daybreak Ranger',
  'Garruk Relentless',
  'Liliana, Heretical Healer'
];

// Função para testar cartas dual-face na API
async function testDualFaceCards() {
  console.log("🌐 Testando cartas dual-face na API do Scryfall...");
  
  for (const cardName of dualFaceCards) {
    try {
      console.log(`\n🔍 Testando: ${cardName}`);
      
      const response = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`
      );
      
      if (response.ok) {
        const cardData = await response.json();
        
        console.log(`📊 Estrutura da carta ${cardName}:`);
        console.log(`  🎴 Tem image_uris no root: ${!!cardData.image_uris ? '✅' : '❌'}`);
        console.log(`  🔄 Tem card_faces: ${!!cardData.card_faces ? '✅' : '❌'}`);
        console.log(`  📄 Número de faces: ${cardData.card_faces?.length || 0}`);
        
        if (cardData.card_faces) {
          cardData.card_faces.forEach((face, index) => {
            console.log(`    Face ${index + 1}: ${face.name}`);
            console.log(`      🎨 art_crop: ${face.image_uris?.art_crop ? '✅' : '❌'}`);
            console.log(`      🖼️ large: ${face.image_uris?.large ? '✅' : '❌'}`);
            console.log(`      📷 normal: ${face.image_uris?.normal ? '✅' : '❌'}`);
            
            if (face.image_uris?.art_crop) {
              console.log(`      🎯 Art crop URL: ${face.image_uris.art_crop.substring(0, 60)}...`);
            }
          });
        }
        
        if (cardData.image_uris) {
          console.log(`  ⚠️ ATENÇÃO: Carta dual-face com image_uris no root (incomum)`);
        }
        
      } else {
        console.log(`  ❌ Carta não encontrada: ${response.status}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao buscar ${cardName}:`, error);
    }
    
    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Função para testar no app
function testDualFaceInApp() {
  console.log("\n🎮 === TESTE NO APP ===");
  
  const searchInput = document.querySelector('input[placeholder*="carta"]');
  
  if (!searchInput) {
    console.log("❌ Modal de busca não está aberto");
    console.log("💡 Para testar cartas dual-face:");
    console.log("  1. Clique no botão ⚙ de um deck");
    console.log("  2. Clique em 'Alterar Capa'");
    console.log("  3. Digite 'Delver' ou 'Huntmaster'");
    return;
  }
  
  console.log("✅ Modal encontrado! Testando busca dual-face...");
  
  // Testar com carta dual-face
  const testCard = "Delver of Secrets";
  console.log(`📝 Testando busca com: "${testCard}"`);
  
  searchInput.value = testCard;
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  setTimeout(() => {
    const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
    console.log(`📋 Sugestões encontradas: ${suggestions.length}`);
    
    if (suggestions.length > 0) {
      suggestions.forEach((sug, i) => {
        const img = sug.querySelector('img');
        const cardName = sug.querySelector('.text-white').textContent;
        const dualFaceBadge = sug.querySelector('.text-blue-400');
        const artCropBadge = sug.querySelector('.text-green-400');
        
        console.log(`  ${i + 1}: ${cardName}`);
        console.log(`     🔄 Dual-face: ${dualFaceBadge ? '✅' : '❌'}`);
        console.log(`     🎨 Art crop: ${artCropBadge ? '✅' : '❌'}`);
        console.log(`     📸 Imagem: ${img ? '✅' : '❌'}`);
      });
      
      // Testar clique
      if (suggestions.length > 0) {
        console.log("\n🖱️ Testando seleção de carta dual-face...");
        
        // Interceptar logs
        const originalLog = console.log;
        console.log = function(...args) {
          if (args[0] && args[0].includes('COVER FUNCTION')) {
            console.warn("🔄 DUAL-FACE DEBUG:", ...args);
          }
          originalLog.apply(console, args);
        };
        
        suggestions[0].click();
        
        setTimeout(() => {
          console.log = originalLog;
          console.log("✅ Teste de dual-face concluído");
        }, 5000);
      }
    } else {
      console.log("❌ Nenhuma sugestão - aguarde ou teste conectividade");
    }
  }, 3000);
}

// Disponibilizar funções
window.testDualFaceCards = testDualFaceCards;
window.testDualFaceInApp = testDualFaceInApp;

console.log("\n💡 === FUNÇÕES PARA TESTE DUAL-FACE ===");
console.log("• testDualFaceCards() - Testa API com cartas dual-face");
console.log("• testDualFaceInApp() - Testa no app (abra modal primeiro)");
console.log("\n🚀 Executando teste automático...");

setTimeout(testDualFaceCards, 1000);
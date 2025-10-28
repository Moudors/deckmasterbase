// Script para testar função de capa - Cole no console do browser

console.log("🖼️ === TESTE DE FUNÇÃO DE CAPA ===");

// 1. Função para simular abertura do modal de capa
function openCoverModal() {
  console.log("🔍 Procurando botões de configuração...");
  
  // Procurar botões de gear (⚙)
  const gearButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('⚙') || btn.textContent.includes('🔧')
  );
  
  console.log(`📍 Encontrados ${gearButtons.length} botões de gear`);
  
  if (gearButtons.length > 0) {
    console.log("🖱️ Clicando no primeiro botão de gear...");
    gearButtons[0].click();
    
    // Aguardar o modal aparecer
    setTimeout(() => {
      const coverButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Alterar Capa') || btn.textContent.includes('Capa')
      );
      
      if (coverButton) {
        console.log("✅ Botão 'Alterar Capa' encontrado!");
        console.log("🖱️ Clicando em 'Alterar Capa'...");
        coverButton.click();
        
        setTimeout(() => {
          testCoverSearch();
        }, 1000);
      } else {
        console.log("❌ Botão 'Alterar Capa' não encontrado");
        console.log("💡 Verifique se o modal está aberto");
      }
    }, 1000);
  } else {
    console.log("❌ Nenhum botão de gear encontrado");
    console.log("💡 Certifique-se de que há decks na página");
  }
}

// 2. Função para testar a busca de capa
function testCoverSearch() {
  console.log("🔍 Testando busca de capa...");
  
  const searchInput = document.querySelector('input[placeholder*="carta"]') || 
                     document.querySelector('input[placeholder*="busca"]');
  
  if (searchInput) {
    console.log("✅ Campo de busca encontrado!");
    
    // Testar busca
    const testCard = "Lightning Bolt";
    console.log(`📝 Digitando: "${testCard}"`);
    
    searchInput.value = testCard;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Aguardar sugestões
    setTimeout(() => {
      const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
      console.log(`📋 Sugestões encontradas: ${suggestions.length}`);
      
      if (suggestions.length > 0) {
        console.log("✅ Busca funcionando!");
        
        suggestions.forEach((sug, i) => {
          console.log(`  ${i + 1}: ${sug.textContent}`);
        });
        
        // Testar clique na primeira sugestão
        console.log("🖱️ Clicando na primeira sugestão...");
        
        // Interceptar console.logs da função handleSelectCover
        const originalLog = console.log;
        console.log = function(...args) {
          if (args[0] && args[0].includes('COVER FUNCTION')) {
            console.warn("🖼️ COVER DEBUG:", ...args);
          }
          originalLog.apply(console, args);
        };
        
        suggestions[0].click();
        
        // Restaurar console.log após 5 segundos
        setTimeout(() => {
          console.log = originalLog;
          console.log("🔄 Console.log restaurado");
        }, 5000);
        
      } else {
        console.log("❌ Nenhuma sugestão encontrada");
        console.log("🔍 Verificando possíveis problemas...");
        
        // Verificar se há erros no console
        setTimeout(() => {
          console.log("💡 Verifique o console para erros de rede ou API");
        }, 2000);
      }
    }, 2000);
    
  } else {
    console.log("❌ Campo de busca não encontrado");
    console.log("💡 Certifique-se de que o modal de busca está aberto");
  }
}

// 3. Função para verificar estado atual
function checkCurrentState() {
  console.log("\n🔍 === VERIFICANDO ESTADO ATUAL ===");
  
  // Verificar se há decks na página
  const deckElements = document.querySelectorAll('[class*="deck"], [class*="card"]');
  console.log(`🃏 Elementos de deck encontrados: ${deckElements.length}`);
  
  // Verificar botões de gear
  const gearButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('⚙') || btn.textContent.includes('🔧')
  );
  console.log(`⚙️ Botões de gear encontrados: ${gearButtons.length}`);
  
  // Verificar se há modal aberto
  const modals = document.querySelectorAll('[class*="modal"], [class*="dialog"]');
  console.log(`📋 Modais encontrados: ${modals.length}`);
  
  // Verificar campo de busca
  const searchInput = document.querySelector('input[placeholder*="carta"]');
  console.log(`🔍 Campo de busca ativo: ${searchInput ? 'Sim' : 'Não'}`);
  
  if (searchInput) {
    console.log("✅ Modal de busca de capa está aberto - pode testar busca");
  } else if (gearButtons.length > 0) {
    console.log("💡 Use openCoverModal() para abrir o modal de capa");
  } else {
    console.log("❌ Nenhum deck encontrado - faça login e crie um deck primeiro");
  }
}

// 4. Executar verificação inicial
checkCurrentState();

// 5. Disponibilizar funções globalmente
window.openCoverModal = openCoverModal;
window.testCoverSearch = testCoverSearch;
window.checkCurrentState = checkCurrentState;

console.log("\n💡 === INSTRUÇÕES ===");
console.log("1. checkCurrentState() - Verificar estado atual");
console.log("2. openCoverModal() - Abrir modal de capa automaticamente");
console.log("3. testCoverSearch() - Testar busca (se modal já estiver aberto)");
console.log("\n🚀 Execute checkCurrentState() primeiro para ver o que está disponível");
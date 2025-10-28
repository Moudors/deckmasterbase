// Teste final das funcionalidades corrigidas da home page

console.log("🧪 === TESTE FINAL HOME PAGE ===");

function testHomeFunctionality() {
  console.log("🔧 Testando funcionalidades corrigidas...");
  
  // 1. Verificar background
  const homeDiv = document.querySelector('div[class*="bg-gradient-to-br"]');
  if (homeDiv) {
    console.log("✅ Background gradient aplicado");
  } else {
    console.log("❌ Background não encontrado");
  }
  
  // 2. Verificar se há decks
  const deckCards = document.querySelectorAll('[style*="background-image"]');
  console.log(`🎴 Decks encontrados: ${deckCards.length}`);
  
  if (deckCards.length === 0) {
    console.log("⚠️ Nenhum deck encontrado. Crie um deck primeiro para testar.");
    return;
  }
  
  // 3. Encontrar botão de opções
  const gearButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('⚙')
  );
  
  console.log(`⚙️ Botões de opções encontrados: ${gearButtons.length}`);
  
  if (gearButtons.length > 0) {
    console.log("✅ Botões de opções encontrados");
    console.log("🖱️ Clique manualmente no botão ⚙ para testar o modal");
    
    // Adicionar listener para detectar cliques
    gearButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        console.log(`🖱️ Clique detectado no botão ${index + 1}`);
        
        setTimeout(() => {
          // Verificar se modal abriu
          const modals = document.querySelectorAll('div[class*="fixed"][class*="inset-0"]');
          if (modals.length > 0) {
            console.log("✅ Modal abriu!");
            
            const modalButtons = modals[0].querySelectorAll('button');
            console.log(`🔘 Botões no modal: ${modalButtons.length}`);
            
            modalButtons.forEach((btn, btnIndex) => {
              const text = btn.textContent.trim();
              console.log(`  ${btnIndex + 1}. "${text}"`);
            });
            
            console.log("💡 Agora teste as funções:");
            console.log("  🏷️ Clique em 'Renomear Deck'");
            console.log("  🖼️ Clique em 'Alterar Capa'");
            console.log("  ⚙️ Clique em 'Mudar Formato'");
            
          } else {
            console.log("❌ Modal não abriu");
          }
        }, 500);
      });
    });
  } else {
    console.log("❌ Nenhum botão de opções encontrado");
  }
}

// Executar teste principal
setTimeout(testHomeFunctionality, 1000);

// Funções para execução manual
window.testHomeFunctionality = testHomeFunctionality;

console.log("⏱️ Iniciando teste em 1 segundo...");
console.log("💡 Use window.testHomeFunctionality() para executar manualmente");
// Teste das funcionalidades do modal de deck na home page

console.log("🏠 === TESTE MODAL HOME PAGE ===");

function testHomeDeckModal() {
  console.log("🧪 Testando funcionalidades do modal de deck...");
  
  // Encontrar botão de opções do deck (engrenagem)
  const optionsButtons = document.querySelectorAll('button');
  const deckOptionsButton = Array.from(optionsButtons).find(btn => 
    btn.textContent.includes('⚙') || 
    btn.classList.contains('gear') ||
    btn.getAttribute('aria-label')?.includes('opções')
  );
  
  if (!deckOptionsButton) {
    console.log("❌ Botão de opções do deck não encontrado");
    console.log("💡 Certifique-se de estar na home page com decks visíveis");
    console.log("💡 Clique manualmente no botão ⚙ de um deck para abrir o modal");
    return;
  }
  
  console.log("✅ Botão de opções encontrado");
  
  // Simular clique no botão de opções
  setTimeout(() => {
    console.log("🖱️ Clicando no botão de opções...");
    deckOptionsButton.click();
    
    // Verificar se o modal abriu
    setTimeout(() => {
      const modal = document.querySelector('div[class*="fixed"][class*="inset-0"]');
      if (modal) {
        console.log("✅ Modal aberto!");
        
        // Verificar botões do modal
        const modalButtons = modal.querySelectorAll('button');
        console.log(`📊 Botões no modal: ${modalButtons.length}`);
        
        modalButtons.forEach((btn, index) => {
          const text = btn.textContent.trim();
          console.log(`  Botão ${index + 1}: "${text}"`);
        });
        
        // Testar botão de renomear
        const renameBtn = Array.from(modalButtons).find(btn => 
          btn.textContent.includes('Renomear')
        );
        
        if (renameBtn) {
          console.log("🏷️ Testando botão Renomear...");
          setTimeout(() => {
            renameBtn.click();
            
            // Verificar se o modal de renomear abriu
            setTimeout(() => {
              const renameInput = document.querySelector('input[placeholder*="novo nome"]');
              if (renameInput) {
                console.log("✅ Modal de renomear aberto!");
                console.log("📝 Campo de input encontrado");
                
                // Testar preenchimento
                const testName = "Deck Teste " + Date.now();
                renameInput.value = testName;
                renameInput.dispatchEvent(new Event('input', { bubbles: true }));
                renameInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                console.log(`✏️ Nome inserido: "${testName}"`);
                
                // Verificar botão salvar
                setTimeout(() => {
                  const saveButton = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Salvar'));
                  
                  if (saveButton && !saveButton.disabled) {
                    console.log("✅ Botão Salvar habilitado e pronto!");
                    console.log("🚀 Teste manual: Clique em Salvar para confirmar");
                  } else {
                    console.log("❌ Botão Salvar não encontrado ou desabilitado");
                    console.log("🔍 Debug: Verificando estado do botão...");
                    if (saveButton) {
                      console.log("  Disabled:", saveButton.disabled);
                      console.log("  Classes:", saveButton.className);
                    }
                  }
                }, 100);
                
              } else {
                console.log("❌ Modal de renomear não abriu");
              }
            }, 500);
          }, 1000);
        } else {
          console.log("❌ Botão Renomear não encontrado no modal");
        }
        
      } else {
        console.log("❌ Modal não abriu");
      }
    }, 500);
  }, 1000);
}

// Função para testar busca de capa
function testCoverSearch() {
  console.log("\n🖼️ === TESTE BUSCA DE CAPA ===");
  
  setTimeout(() => {
    const coverInput = document.querySelector('input[class*="border-gray-700"]');
    if (coverInput) {
      console.log("✅ Campo de busca de capa encontrado");
      
      // Testar busca
      const testQuery = "Lightning Bolt";
      coverInput.value = testQuery;
      coverInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log(`🔍 Testando busca: "${testQuery}"`);
      
      // Verificar sugestões após delay
      setTimeout(() => {
        const suggestions = document.querySelectorAll('li[class*="cursor-pointer"]');
        console.log(`📋 Sugestões encontradas: ${suggestions.length}`);
        
        if (suggestions.length > 0) {
          console.log("✅ Busca funcionando!");
          suggestions.forEach((sug, index) => {
            console.log(`  ${index + 1}: ${sug.textContent}`);
          });
        } else {
          console.log("❌ Nenhuma sugestão encontrada");
          console.log("💡 Verifique se a busca está configurada corretamente");
        }
      }, 2000);
    } else {
      console.log("❌ Campo de busca de capa não encontrado");
      console.log("💡 Abra o modal de opções e clique em 'Alterar Capa' primeiro");
    }
  }, 500);
}

// Função para verificar erros no console
function checkConsoleErrors() {
  console.log("\n🐛 === VERIFICAÇÃO DE ERROS ===");
  
  // Interceptar erros
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} erros encontrados:`);
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}:`, error);
      });
    } else {
      console.log("✅ Nenhum erro encontrado");
    }
    
    // Restaurar console.error original
    console.error = originalError;
  }, 5000);
}

// Executar testes
setTimeout(testHomeDeckModal, 2000);
setTimeout(checkConsoleErrors, 1000);

// Funções para execução manual
window.testHomeDeckModal = testHomeDeckModal;
window.testCoverSearch = testCoverSearch;
window.checkConsoleErrors = checkConsoleErrors;

console.log("⏱️ Iniciando teste em 2 segundos...");
console.log("💡 Use window.testHomeDeckModal() para testar modal");
console.log("💡 Use window.testCoverSearch() para testar busca de capa");
console.log("💡 Use window.checkConsoleErrors() para verificar erros");
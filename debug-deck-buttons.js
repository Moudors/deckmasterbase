// Debug específico para botões do modal de deck

console.log("🔧 === DEBUG BOTÕES MODAL ===");

function debugDeckModalButtons() {
  console.log("🧪 Testando se os botões do modal respondem...");
  
  // Primeiro, vamos verificar se conseguimos encontrar um deck
  const deckCards = document.querySelectorAll('[style*="background-image"]');
  console.log(`🎴 Decks encontrados: ${deckCards.length}`);
  
  if (deckCards.length === 0) {
    console.log("❌ Nenhum deck encontrado. Certifique-se de estar na home page.");
    return;
  }
  
  // Procurar botão de opções (⚙)
  const gearButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
    btn.textContent.includes('⚙')
  );
  
  console.log(`⚙️ Botões de engrenagem encontrados: ${gearButtons.length}`);
  
  if (gearButtons.length === 0) {
    console.log("❌ Nenhum botão de opções encontrado");
    return;
  }
  
  const firstGearButton = gearButtons[0];
  console.log("✅ Testando primeiro botão de opções...");
  
  // Adicionar listener para verificar se o clique funciona
  firstGearButton.addEventListener('click', (e) => {
    console.log("🖱️ CLIQUE DETECTADO no botão de opções!");
    console.log("Event:", e);
    console.log("Button:", e.target);
  });
  
  // Simular clique
  setTimeout(() => {
    console.log("🖱️ Simulando clique no botão de opções...");
    firstGearButton.click();
    
    // Verificar se modal abriu
    setTimeout(() => {
      const modals = document.querySelectorAll('div[class*="fixed"][class*="inset-0"]');
      console.log(`📦 Modais abertos: ${modals.length}`);
      
      if (modals.length > 0) {
        const modal = modals[0];
        console.log("✅ Modal encontrado!");
        
        // Verificar botões no modal
        const modalButtons = modal.querySelectorAll('button');
        console.log(`🔘 Botões no modal: ${modalButtons.length}`);
        
        modalButtons.forEach((btn, index) => {
          const text = btn.textContent.trim();
          console.log(`  ${index + 1}. "${text}"`);
          
          // Adicionar listener a cada botão
          btn.addEventListener('click', (e) => {
            console.log(`🖱️ CLIQUE DETECTADO no botão: "${text}"`);
            console.log("Event:", e);
          });
        });
        
        // Testar botão de renomear especificamente
        const renameBtn = Array.from(modalButtons).find(btn => 
          btn.textContent.includes('Renomear')
        );
        
        if (renameBtn) {
          console.log("\n🏷️ Testando botão Renomear...");
          setTimeout(() => {
            console.log("🖱️ Clicando em Renomear...");
            renameBtn.click();
            
            setTimeout(() => {
              const renameModals = document.querySelectorAll('div[class*="fixed"][class*="inset-0"]');
              console.log(`📝 Modais após clicar Renomear: ${renameModals.length}`);
              
              const renameInput = document.querySelector('input[placeholder*="novo nome"]');
              if (renameInput) {
                console.log("✅ Modal de renomear abriu!");
                
                // Testar input
                const testName = `Deck Teste ${Date.now()}`;
                renameInput.value = testName;
                renameInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                console.log(`✏️ Texto inserido: "${testName}"`);
                
                // Verificar botão salvar
                setTimeout(() => {
                  const saveBtn = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Salvar'));
                  
                  if (saveBtn) {
                    console.log(`💾 Botão Salvar encontrado. Disabled: ${saveBtn.disabled}`);
                    
                    if (!saveBtn.disabled) {
                      console.log("🚀 Botão Salvar está habilitado!");
                      
                      // Adicionar listener ao botão salvar
                      saveBtn.addEventListener('click', (e) => {
                        console.log("💾 CLIQUE DETECTADO no botão Salvar!");
                        console.log("Event:", e);
                      });
                      
                      console.log("💡 Agora clique manualmente no botão Salvar para testar");
                    } else {
                      console.log("❌ Botão Salvar está desabilitado");
                    }
                  } else {
                    console.log("❌ Botão Salvar não encontrado");
                  }
                }, 200);
                
              } else {
                console.log("❌ Modal de renomear não abriu");
                console.log("🔍 Procurando inputs disponíveis...");
                const allInputs = document.querySelectorAll('input');
                console.log(`📝 Inputs encontrados: ${allInputs.length}`);
                allInputs.forEach((input, index) => {
                  console.log(`  ${index + 1}: placeholder="${input.placeholder}" value="${input.value}"`);
                });
              }
            }, 1000);
          }, 1000);
        } else {
          console.log("❌ Botão Renomear não encontrado");
        }
        
      } else {
        console.log("❌ Modal não abriu após clique");
        
        // Debug adicional
        console.log("🔍 Verificando se há listeners no botão...");
        const listeners = getEventListeners ? getEventListeners(firstGearButton) : "getEventListeners não disponível";
        console.log("Listeners:", listeners);
      }
    }, 1000);
  }, 2000);
}

// Função para verificar estado das funções
function checkFunctionState() {
  console.log("\n🔍 === VERIFICAÇÃO DE ESTADO ===");
  
  // Verificar se React está carregado
  if (window.React) {
    console.log("✅ React carregado");
  } else {
    console.log("❌ React não encontrado");
  }
  
  // Verificar erros no console
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.log(`📊 Erros capturados: ${errors.length}`);
    if (errors.length > 0) {
      console.log("❌ Erros encontrados:");
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}:`, error);
      });
    }
    console.error = originalError;
  }, 5000);
}

// Executar testes
setTimeout(debugDeckModalButtons, 2000);
setTimeout(checkFunctionState, 1000);

// Funções para execução manual
window.debugDeckModalButtons = debugDeckModalButtons;
window.checkFunctionState = checkFunctionState;

console.log("⏱️ Iniciando debug em 2 segundos...");
console.log("💡 Use window.debugDeckModalButtons() para executar manualmente");
console.log("💡 Use window.checkFunctionState() para verificar estado");
// 🧪 Teste dos modais de seleção de arte e deleção de cartas
// Execute este script no navegador após entrar em um deck com cartas

console.log("🔍 TESTE: Modais do Deckbuilder - Art Selector e Delete Dialog");

// Função para testar o modal de seleção de arte
async function testArtSelector() {
  console.log("\n🎨 1. Testando Art Selector...");
  
  // Verificar se há cartas no deck
  const cardElements = document.querySelectorAll('[data-testid*="card"], .card, [class*="card"]');
  console.log("🃏 Cartas encontradas na tela:", cardElements.length);
  
  if (cardElements.length === 0) {
    console.log("❌ Nenhuma carta encontrada. Adicione cartas ao deck primeiro.");
    return false;
  }
  
  // Procurar por gestos/eventos que ativam o art selector
  console.log("📝 Para testar Art Selector:");
  console.log("1. Faça triple-tap em uma carta");
  console.log("2. Ou segure pressionado uma carta (long press)");
  console.log("3. Verifique se o modal de seleção de arte abre");
  
  // Verificar se o componente ArtSelector está disponível
  const artSelectorElements = document.querySelectorAll('[role="dialog"], .art-selector, [data-testid*="art"]');
  console.log("🎨 Elementos de art selector encontrados:", artSelectorElements.length);
  
  return true;
}

// Função para testar o modal de deleção
async function testDeleteDialog() {
  console.log("\n🗑️ 2. Testando Delete Dialog...");
  
  // Procurar pelo botão de modo seleção (trash icon)
  const trashButtons = document.querySelectorAll('button[aria-label*="trash"], button[title*="delete"], svg[class*="trash"]');
  console.log("🗑️ Botões de lixeira encontrados:", trashButtons.length);
  
  // Procurar por elementos de seleção
  const selectionElements = document.querySelectorAll('[data-selected], .selected, [aria-selected]');
  console.log("✅ Elementos selecionáveis encontrados:", selectionElements.length);
  
  console.log("📝 Para testar Delete Dialog:");
  console.log("1. Clique no ícone de lixeira no header");
  console.log("2. Ative o modo de seleção");
  console.log("3. Selecione uma ou mais cartas");
  console.log("4. Clique novamente no ícone de lixeira para deletar");
  console.log("5. Verifique se o modal de confirmação abre");
  
  return trashButtons.length > 0;
}

// Função para simular abertura do art selector
async function simulateArtSelector() {
  console.log("\n🖱️ 3. Simulando abertura do Art Selector...");
  
  // Procurar pela primeira carta
  const firstCard = document.querySelector('[data-testid*="card"], .card, [class*="card"]');
  
  if (!firstCard) {
    console.log("❌ Nenhuma carta encontrada para simular");
    return false;
  }
  
  console.log("🃏 Simulando triple-tap na primeira carta...");
  
  // Simular triple-tap
  try {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      detail: 3 // triple click
    });
    
    firstCard.dispatchEvent(event);
    
    // Aguardar um pouco e verificar se modal abriu
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dialogs = document.querySelectorAll('[role="dialog"]');
    if (dialogs.length > 0) {
      console.log("✅ Modal detectado após simulação!");
      return true;
    } else {
      console.log("⚠️ Nenhum modal detectado. Pode ser necessário interação real do usuário.");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao simular triple-tap:", error);
    return false;
  }
}

// Função para simular modo de seleção
async function simulateSelectionMode() {
  console.log("\n🖱️ 4. Simulando modo de seleção...");
  
  // Procurar pelo botão de trash/lixeira
  const trashButton = document.querySelector('button svg[class*="trash"], button[aria-label*="trash"]');
  
  if (!trashButton) {
    console.log("❌ Botão de lixeira não encontrado");
    return false;
  }
  
  console.log("🗑️ Simulando clique no botão de lixeira...");
  
  try {
    // Clicar no botão pai (button element)
    const button = trashButton.closest('button');
    if (button) {
      button.click();
      
      // Aguardar um pouco e verificar mudanças na UI
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se o modo de seleção foi ativado
      const selectedElements = document.querySelectorAll('[data-selected="true"], .selected');
      const selectionUI = document.querySelectorAll('.selection-mode, [class*="selection"]');
      
      if (selectedElements.length > 0 || selectionUI.length > 0) {
        console.log("✅ Modo de seleção ativado!");
        return true;
      } else {
        console.log("⚠️ Modo de seleção pode ter sido ativado, mas não foi detectado visualmente.");
        return false;
      }
    } else {
      console.log("❌ Elemento button não encontrado");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao simular clique:", error);
    return false;
  }
}

// Função para verificar estado dos modais
async function checkModalState() {
  console.log("\n🔍 5. Verificando estado dos modais...");
  
  // Verificar se há diálogos abertos
  const openDialogs = document.querySelectorAll('[role="dialog"][aria-hidden="false"], [role="dialog"]:not([aria-hidden="true"])');
  
  console.log("📱 Diálogos abertos:", openDialogs.length);
  
  openDialogs.forEach((dialog, index) => {
    console.log(`Modal ${index + 1}:`, {
      classes: dialog.className,
      ariaLabel: dialog.getAttribute('aria-label'),
      id: dialog.id,
      visible: !dialog.hasAttribute('aria-hidden') || dialog.getAttribute('aria-hidden') === 'false'
    });
  });
  
  // Verificar overlay/backdrop
  const overlays = document.querySelectorAll('.overlay, .backdrop, [class*="overlay"], [class*="backdrop"]');
  console.log("🎭 Overlays encontrados:", overlays.length);
  
  return {
    openDialogs: openDialogs.length,
    overlays: overlays.length
  };
}

// Função principal
async function testAllModals() {
  console.log("🚀 Iniciando testes dos modais do Deckbuilder...\n");
  
  const artResult = await testArtSelector();
  const deleteResult = await testDeleteDialog();
  
  if (artResult) {
    await simulateArtSelector();
  }
  
  if (deleteResult) {
    await simulateSelectionMode();
  }
  
  const modalState = await checkModalState();
  
  console.log("\n📋 RESUMO DOS TESTES:");
  console.log("- Art Selector:", artResult ? "✅ Preparado" : "❌ Problema");
  console.log("- Delete Dialog:", deleteResult ? "✅ Preparado" : "❌ Problema");
  console.log("- Modais abertos:", modalState.openDialogs);
  
  console.log("\n🔧 COMO TESTAR MANUALMENTE:");
  console.log("1. **Art Selector**: Triple-tap ou long press em uma carta");
  console.log("2. **Delete Dialog**: Ativar modo seleção → selecionar cartas → confirmar deleção");
  console.log("3. **Verificar**: Modais devem abrir com animações suaves");
  
  console.log("\n⚠️ POSSÍVEIS PROBLEMAS:");
  console.log("- Gestos podem precisar de toque real (não simulação)");
  console.log("- Modais podem estar presentes mas invisíveis");
  console.log("- Componentes podem ter dependências não carregadas");
}

// Disponibilizar funções globalmente
if (typeof window !== 'undefined') {
  window.testModalFunctions = {
    testAllModals,
    testArtSelector,
    testDeleteDialog,
    simulateArtSelector,
    simulateSelectionMode,
    checkModalState
  };
  
  console.log("🧪 Funções de teste de modais carregadas!");
  console.log("Execute: testModalFunctions.testAllModals()");
}

export { 
  testAllModals,
  testArtSelector,
  testDeleteDialog,
  simulateArtSelector,
  simulateSelectionMode,
  checkModalState
};
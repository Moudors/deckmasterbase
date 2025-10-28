// 🧪 Teste específico das funções de arte do ArtSelector
// Execute este script no navegador após abrir o ArtSelector em um deck

console.log("🔍 TESTE: Funções de Arte - Mudar Arte e Adicionar Cópias");

// Função para testar mudança de arte
async function testChangeArt() {
  console.log("\n🎨 1. Testando mudança de arte...");
  
  // Verificar se o ArtSelector está aberto
  const artSelectorDialog = document.querySelector('[role="dialog"]');
  
  if (!artSelectorDialog) {
    console.log("❌ ArtSelector não está aberto. Abra primeiro com triple-tap em uma carta.");
    return false;
  }
  
  console.log("✅ ArtSelector detectado");
  
  // Procurar por versões de arte
  const artVersions = document.querySelectorAll('[data-version], .art-version, img[src*="scryfall"]');
  console.log("🖼️ Versões de arte encontradas:", artVersions.length);
  
  if (artVersions.length === 0) {
    console.log("❌ Nenhuma versão de arte encontrada");
    return false;
  }
  
  // Procurar pelo botão de confirmar mudança
  const confirmButtons = document.querySelectorAll('button');
  const confirmButton = Array.from(confirmButtons).find(btn => 
    btn.textContent.includes('Alterar') || 
    btn.textContent.includes('Confirmar') ||
    btn.textContent.includes('Change')
  );
  
  if (confirmButton) {
    console.log("✅ Botão de confirmar encontrado:", confirmButton.textContent);
  } else {
    console.log("⚠️ Botão de confirmar não encontrado claramente");
  }
  
  console.log("📝 Para testar mudança de arte:");
  console.log("1. Selecione uma versão diferente da arte");
  console.log("2. Clique no botão de confirmar");
  console.log("3. Verifique se a carta no deck mudou de visual");
  
  return true;
}

// Função para testar adição de cópias
async function testAddCopies() {
  console.log("\n📋 2. Testando adição de cópias...");
  
  // Verificar se o ArtSelector está aberto
  const artSelectorDialog = document.querySelector('[role="dialog"]');
  
  if (!artSelectorDialog) {
    console.log("❌ ArtSelector não está aberto");
    return false;
  }
  
  // Procurar por botões de adicionar
  const addButtons = document.querySelectorAll('button');
  const addCopyButton = Array.from(addButtons).find(btn => 
    btn.textContent.includes('Adicionar') || 
    btn.textContent.includes('Copy') ||
    btn.textContent.includes('Cópia') ||
    btn.innerHTML.includes('Copy') ||
    btn.innerHTML.includes('Plus')
  );
  
  if (addCopyButton) {
    console.log("✅ Botão de adicionar cópia encontrado:", addCopyButton.textContent || addCopyButton.innerHTML);
  } else {
    console.log("⚠️ Botão de adicionar cópia não encontrado claramente");
  }
  
  // Procurar por botão de arte diferente
  const addDifferentArtButton = Array.from(addButtons).find(btn => 
    btn.textContent.includes('Arte Diferente') || 
    btn.textContent.includes('Different') ||
    btn.innerHTML.includes('Plus')
  );
  
  if (addDifferentArtButton) {
    console.log("✅ Botão de adicionar arte diferente encontrado");
  } else {
    console.log("⚠️ Botão de adicionar arte diferente não encontrado");
  }
  
  console.log("📝 Para testar adição de cópias:");
  console.log("1. Clique em 'Adicionar Mais Cópias' para aumentar quantidade da carta atual");
  console.log("2. Clique em 'Adicionar com Arte Diferente' para criar nova entrada com arte selecionada");
  console.log("3. Verifique se as mudanças aparecem no deck");
  
  return true;
}

// Função para verificar props passadas
async function checkArtSelectorProps() {
  console.log("\n⚛️ 3. Verificando props do ArtSelector...");
  
  // Verificar se as funções foram passadas corretamente
  console.log("📝 Props esperadas:");
  console.log("- onSelectArt: Para alterar arte da carta existente");
  console.log("- onAddCard: Para adicionar nova carta com arte diferente");
  console.log("- onUpdateCard: Para aumentar quantidade da carta atual");
  
  // Tentar acessar props via React DevTools (se disponível)
  if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    console.log("✅ React DevTools podem estar disponíveis");
    console.log("📝 Use React DevTools para verificar props do ArtSelector");
  } else {
    console.log("⚠️ React DevTools não detectado");
  }
  
  return true;
}

// Função para simular cliques
async function simulateArtSelectorActions() {
  console.log("\n🖱️ 4. Simulando ações no ArtSelector...");
  
  try {
    // Procurar primeira versão de arte disponível
    const firstArtVersion = document.querySelector('[data-version], .art-version img, img[src*="scryfall"]');
    
    if (firstArtVersion) {
      console.log("🖼️ Simulando seleção da primeira arte...");
      firstArtVersion.click();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Procurar e clicar no botão confirmar
      const confirmButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Alterar') || btn.textContent.includes('Confirmar')
      );
      
      if (confirmButton) {
        console.log("✅ Simulando clique no botão confirmar...");
        confirmButton.click();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se modal fechou
        const isModalOpen = document.querySelector('[role="dialog"]');
        if (!isModalOpen) {
          console.log("✅ Modal fechou após ação - provavelmente funcionou!");
          return true;
        } else {
          console.log("⚠️ Modal ainda aberto - pode ter havido erro");
          return false;
        }
      } else {
        console.log("❌ Não foi possível encontrar botão para simular");
        return false;
      }
    } else {
      console.log("❌ Não foi possível encontrar versão de arte para simular");
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao simular ações:", error);
    return false;
  }
}

// Função para verificar erros no console
async function checkForErrors() {
  console.log("\n🔍 5. Verificando erros no console...");
  
  // Capturar erros do console
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Aguardar um pouco para capturar erros
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Restaurar console.error original
  console.error = originalError;
  
  if (errors.length > 0) {
    console.log("❌ Erros detectados:");
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log("✅ Nenhum erro detectado nos últimos 2 segundos");
  }
  
  return errors;
}

// Função principal
async function testArtSelectorFunctions() {
  console.log("🚀 Iniciando testes das funções de arte do ArtSelector...\n");
  
  const changeArtResult = await testChangeArt();
  const addCopiesResult = await testAddCopies();
  const propsResult = await checkArtSelectorProps();
  
  let simulationResult = false;
  if (changeArtResult) {
    simulationResult = await simulateArtSelectorActions();
  }
  
  const errors = await checkForErrors();
  
  console.log("\n📋 RESUMO DOS TESTES:");
  console.log("- Mudança de arte:", changeArtResult ? "✅ UI Detectada" : "❌ Problema");
  console.log("- Adição de cópias:", addCopiesResult ? "✅ UI Detectada" : "❌ Problema");
  console.log("- Simulação funcionou:", simulationResult ? "✅" : "❌");
  console.log("- Erros detectados:", errors.length);
  
  console.log("\n🔧 PRÓXIMOS PASSOS:");
  if (!changeArtResult || !addCopiesResult) {
    console.log("1. Verificar se ArtSelector está carregando versões corretamente");
    console.log("2. Verificar se botões estão sendo renderizados");
    console.log("3. Verificar props passadas do Deckbuilder");
  } else if (errors.length > 0) {
    console.log("1. Corrigir erros detectados no console");
    console.log("2. Verificar se funções onAddCard/onUpdateCard estão funcionando");
  } else {
    console.log("1. Tudo parece estar funcionando!");
    console.log("2. Teste manualmente para confirmar");
  }
}

// Disponibilizar funções globalmente
if (typeof window !== 'undefined') {
  window.testArtFunctions = {
    testArtSelectorFunctions,
    testChangeArt,
    testAddCopies,
    checkArtSelectorProps,
    simulateArtSelectorActions,
    checkForErrors
  };
  
  console.log("🧪 Funções de teste de arte carregadas!");
  console.log("Execute: testArtFunctions.testArtSelectorFunctions()");
}

export { 
  testArtSelectorFunctions,
  testChangeArt,
  testAddCopies,
  checkArtSelectorProps,
  simulateArtSelectorActions,
  checkForErrors
};
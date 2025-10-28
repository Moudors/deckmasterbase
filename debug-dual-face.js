// Debug do botão de faces duplas - Debug dual face button functionality

console.log("=== DEBUG FACES DUPLAS ===");

// Função para verificar cartas com faces duplas
function checkDualFaceCards() {
  console.log("\n🔍 Verificando cartas com faces duplas...");
  
  // Tentar encontrar elementos de cartas
  const cardElements = document.querySelectorAll('[data-card-id]');
  console.log(`📊 Total de cartas encontradas: ${cardElements.length}`);
  
  let dualFaceCount = 0;
  let cardsWithToggleButton = 0;
  
  cardElements.forEach((element, index) => {
    const cardId = element.getAttribute('data-card-id');
    console.log(`\n📋 Carta ${index + 1} (ID: ${cardId}):`);
    
    // Verificar se tem botão de alternar face
    const toggleButton = element.querySelector('button[aria-label="Alternar face da carta"]');
    if (toggleButton) {
      cardsWithToggleButton++;
      console.log("  ✅ Tem botão de alternar face");
      console.log("  📝 Título do botão:", toggleButton.getAttribute('title'));
      
      // Verificar se o botão está funcionando
      const testClick = () => {
        console.log("  🖱️ Testando clique no botão...");
        toggleButton.click();
      };
      
      // Adicionar evento para teste
      console.log("  🔧 Adicionando listener de teste...");
      toggleButton.addEventListener('click', () => {
        console.log("  ✅ Clique detectado no botão de face!");
      }, { once: true });
      
    } else {
      console.log("  ❌ Sem botão de alternar face");
    }
  });
  
  console.log(`\n📈 Resumo:`);
  console.log(`  Total de cartas: ${cardElements.length}`);
  console.log(`  Cartas com botão de face: ${cardsWithToggleButton}`);
}

// Função para verificar dados de carta dupla face via React
function checkReactCardData() {
  console.log("\n🔍 Verificando dados de cartas via React...");
  
  // Tentar acessar o estado do React (se disponível)
  try {
    const cardElements = document.querySelectorAll('[data-card-id]');
    
    cardElements.forEach((element, index) => {
      const cardId = element.getAttribute('data-card-id');
      
      // Tentar encontrar a instância do React
      const reactKey = Object.keys(element).find(key => key.startsWith('__reactInternalInstance'));
      if (reactKey) {
        const reactInstance = element[reactKey];
        console.log(`📋 Carta ${index + 1} - Dados React encontrados`);
      }
    });
  } catch (error) {
    console.log("❌ Não foi possível acessar dados do React:", error.message);
  }
}

// Função para simular clique em botão de face
function testToggleFace() {
  console.log("\n🧪 Testando funcionalidade de alternar face...");
  
  const toggleButtons = document.querySelectorAll('button[aria-label="Alternar face da carta"]');
  console.log(`🔍 Encontrados ${toggleButtons.length} botões de alternar face`);
  
  if (toggleButtons.length > 0) {
    const firstButton = toggleButtons[0];
    console.log("🖱️ Testando primeiro botão...");
    console.log("📍 Posição:", firstButton.getBoundingClientRect());
    console.log("👁️ Visível:", firstButton.offsetParent !== null);
    console.log("🔧 Disabled:", firstButton.disabled);
    
    // Simular clique
    setTimeout(() => {
      console.log("🖱️ Clicando no botão...");
      firstButton.click();
    }, 1000);
  } else {
    console.log("❌ Nenhum botão de alternar face encontrado");
  }
}

// Executar verificações
setTimeout(() => {
  checkDualFaceCards();
  checkReactCardData();
  testToggleFace();
}, 2000);

// Monitorar mudanças no DOM
const observer = new MutationObserver((mutations) => {
  const hasCardChanges = mutations.some(mutation => 
    Array.from(mutation.addedNodes).some(node => 
      node.nodeType === 1 && (
        node.querySelector && node.querySelector('[data-card-id]') ||
        node.getAttribute && node.getAttribute('data-card-id')
      )
    )
  );
  
  if (hasCardChanges) {
    console.log("🔄 Cartas foram atualizadas no DOM");
    setTimeout(checkDualFaceCards, 500);
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log("🚀 Debug de faces duplas inicializado!");
console.log("⏱️ Aguardando 2 segundos para verificar cartas...");
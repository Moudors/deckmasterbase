// Test script para verificar cartas dupla face no deckbuilder

console.log("=== TESTE CARTAS DUPLA FACE ===");

// Aguardar a aplicação carregar
setTimeout(() => {
  console.log("🔍 Verificando cartas dupla face...");
  
  // Verificar se estamos na página do deckbuilder
  const currentPath = window.location.pathname;
  console.log("📍 Página atual:", currentPath);
  
  if (!currentPath.includes('/deck/')) {
    console.log("❌ Não estamos na página de deck. Navegue para um deck primeiro.");
    return;
  }
  
  // Procurar por botões de alternar face
  const toggleButtons = document.querySelectorAll('[data-testid="dual-face-toggle"]');
  console.log(`🎭 Botões de face encontrados: ${toggleButtons.length}`);
  
  if (toggleButtons.length > 0) {
    toggleButtons.forEach((button, index) => {
      const cardId = button.getAttribute('data-card-id');
      const faceIndex = button.getAttribute('data-face-index');
      const title = button.getAttribute('title');
      
      console.log(`\n🎯 Botão ${index + 1}:`);
      console.log(`  Card ID: ${cardId}`);
      console.log(`  Face Index: ${faceIndex}`);
      console.log(`  Title: ${title}`);
      console.log(`  Visível: ${button.offsetParent !== null}`);
      console.log(`  Disabled: ${button.disabled}`);
      
      // Testar clique
      console.log("  🖱️ Testando clique...");
      button.addEventListener('click', (e) => {
        console.log(`✅ Clique detectado no botão da carta ${cardId}!`);
        console.log("Event:", e);
      });
      
      // Simular clique após 2 segundos
      setTimeout(() => {
        console.log(`🎯 Simulando clique no botão da carta ${cardId}...`);
        button.click();
      }, 2000 + (index * 1000));
    });
  } else {
    console.log("❌ Nenhum botão de alternar face encontrado.");
    console.log("💡 Isso pode significar que:");
    console.log("  - Não há cartas dupla face no deck");
    console.log("  - As cartas não têm a propriedade card_faces");
    console.log("  - Há um erro na detecção de faces múltiplas");
    
    // Verificar todas as cartas
    const allCards = document.querySelectorAll('[data-card-id]');
    console.log(`\n📊 Total de cartas no deck: ${allCards.length}`);
    
    // Tentar encontrar dados de cartas dupla face via console
    console.log("\n🔍 Verificando dados brutos de cartas...");
    
    // Se temos React DevTools, podemos tentar inspecionar
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log("🔧 React DevTools detectado - dados podem ser inspecionados");
    }
  }
  
  // Monitorar mudanças
  const observer = new MutationObserver((mutations) => {
    const hasNewToggleButtons = mutations.some(mutation => 
      Array.from(mutation.addedNodes).some(node => 
        node.nodeType === 1 && (
          (node.querySelector && node.querySelector('[data-testid="dual-face-toggle"]')) ||
          (node.getAttribute && node.getAttribute('data-testid') === 'dual-face-toggle')
        )
      )
    );
    
    if (hasNewToggleButtons) {
      console.log("🔄 Novos botões de face detectados!");
      setTimeout(() => {
        const newButtons = document.querySelectorAll('[data-testid="dual-face-toggle"]');
        console.log(`🎭 Total de botões agora: ${newButtons.length}`);
      }, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
}, 3000);

// Função para adicionar carta dupla face para teste (se necessário)
window.testDualFaceCard = () => {
  console.log("🧪 Testando adição de carta dupla face...");
  
  // Exemplo de carta dupla face para teste
  const testCard = {
    name: "Delver of Secrets // Insectile Aberration",
    card_faces: [
      {
        name: "Delver of Secrets",
        image_uris: {
          normal: "https://cards.scryfall.io/normal/front/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg"
        }
      },
      {
        name: "Insectile Aberration", 
        image_uris: {
          normal: "https://cards.scryfall.io/normal/back/1/1/11bf83bb-c95b-4b4f-9a56-ce7a1816307a.jpg"
        }
      }
    ]
  };
  
  console.log("📋 Carta de teste:", testCard);
  console.log("✅ Execute esta função no console para testar");
};

console.log("🚀 Teste inicializado!");
console.log("📝 Use window.testDualFaceCard() para testar carta dupla face");
console.log("⏱️ Aguardando 3 segundos para verificar...");
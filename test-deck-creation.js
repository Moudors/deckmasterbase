// Script para testar correção do problema de redirecionamento após criação de deck

console.log("🆕 === TESTE DE CRIAÇÃO E REDIRECIONAMENTO DE DECK ===");

// Função para verificar estado atual
function checkCurrentState() {
  console.log("\n🔍 === VERIFICANDO ESTADO ATUAL ===");
  
  const path = window.location.pathname;
  console.log(`📍 Caminho atual: ${path}`);
  
  if (path === '/') {
    console.log("🏠 Na página Home");
    const decks = document.querySelectorAll('[class*="deck"]');
    console.log(`📦 Decks visíveis: ${decks.length}`);
    
    const addButton = Array.from(document.querySelectorAll('button')).find(btn =>
      btn.textContent.includes('Adicionar') || btn.textContent.includes('novo deck')
    );
    console.log(`➕ Botão adicionar: ${addButton ? '✅' : '❌'}`);
  } 
  else if (path === '/create') {
    console.log("🆕 Na página de criação");
    
    const nameInput = document.querySelector('input[placeholder*="nome"]') || 
                     document.querySelector('input[type="text"]');
    const formatSelect = document.querySelector('[role="combobox"]');
    const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Criar') || btn.textContent.includes('Adicionar')
    );
    
    console.log("🔍 Elementos encontrados:");
    console.log(`  📝 Campo nome: ${nameInput ? '✅' : '❌'}`);
    console.log(`  📋 Seletor formato: ${formatSelect ? '✅' : '❌'}`);
    console.log(`  🔘 Botão submit: ${submitButton ? '✅' : '❌'}`);
  } 
  else if (path.includes('/deckbuilder/')) {
    const deckId = path.split('/deckbuilder/')[1];
    console.log(`🔧 No Deckbuilder do deck: ${deckId}`);
    
    const notFoundMsg = document.querySelector('[class*="text-yellow-400"]');
    const loadingMsg = document.querySelector('[class*="text-blue-400"]');
    
    if (notFoundMsg && notFoundMsg.textContent.includes('não encontrado')) {
      console.log("❌ Mostrando 'Deck não encontrado'");
    } else if (loadingMsg) {
      console.log("⏳ Mostrando loading/procurando deck");
    } else {
      console.log("✅ Deck carregado com sucesso");
    }
  }
}

// Função para interceptar navegação
function setupNavigationTracking() {
  console.log("🔧 Configurando rastreamento de navegação...");
  
  // Interceptar console.log para capturar logs de criação
  const originalLog = console.log;
  console.log = function(...args) {
    const message = args[0];
    if (typeof message === 'string') {
      if (message.includes('Deck criado') || 
          message.includes('Redirecionando') || 
          message.includes('createDeck')) {
        console.warn("🎯 DECK CREATION:", ...args);
      }
    }
    originalLog.apply(console, args);
  };
  
  // Interceptar mudanças de URL
  const originalPushState = history.pushState;
  
  history.pushState = function(...args) {
    console.warn("🧭 NAVIGATION:", args[2]);
    return originalPushState.apply(this, args);
  };
  
  console.log("✅ Rastreamento ativo");
}

// Executar
setTimeout(() => {
  setupNavigationTracking();
  checkCurrentState();
  
  console.log("\n💡 === COMO TESTAR ===");
  console.log("1. Vá para /create");
  console.log("2. Preencha nome e formato");
  console.log("3. Clique em 'Criar Deck'");
  console.log("4. Observe os logs de navegação");
  console.log("5. Verifique se aparece loading ao invés de 'não encontrado'");
}, 1000);

window.checkCurrentState = checkCurrentState;
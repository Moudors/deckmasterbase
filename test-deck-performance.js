// Script para testar performance da criação de deck

console.log("⚡ === TESTE DE PERFORMANCE - CRIAÇÃO DE DECK ===");

// Função para monitorar performance de rede
function setupPerformanceMonitoring() {
  console.log("📊 Configurando monitoramento de performance...");
  
  // Interceptar fetch para medir tempo de resposta
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    const startTime = performance.now();
    
    if (url.includes('supabase') && options?.method === 'POST') {
      console.log("🗄️ Iniciando inserção no Supabase...");
      console.log("📡 URL:", url);
      console.log("📝 Body:", options.body);
    }
    
    try {
      const response = await originalFetch.apply(this, args);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (url.includes('supabase') && options?.method === 'POST') {
        console.log(`✅ Inserção concluída em ${duration}ms`);
        console.log(`📊 Status: ${response.status}`);
        
        if (duration > 1000) {
          console.warn(`⚠️ Inserção lenta: ${duration}ms (>1s)`);
        } else if (duration > 500) {
          console.warn(`🐌 Inserção moderada: ${duration}ms (>500ms)`);
        } else {
          console.log(`🚀 Inserção rápida: ${duration}ms`);
        }
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      console.error(`❌ Erro na requisição após ${duration}ms:`, error);
      throw error;
    }
  };
  
  console.log("✅ Monitoramento de rede ativo");
}

// Função para interceptar logs de criação
function setupCreationLogging() {
  console.log("📝 Configurando logs de criação...");
  
  const originalLog = console.log;
  const creationLogs = [];
  
  console.log = function(...args) {
    const message = args[0];
    if (typeof message === 'string') {
      if (message.includes('Criando deck') || 
          message.includes('Deck criado') ||
          message.includes('createDeck')) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        creationLogs.push({ timestamp, message: args });
        console.warn(`⏰ [${timestamp}] CREATION:`, ...args);
      }
    }
    originalLog.apply(console, args);
  };
  
  // Função para mostrar resumo
  window.showCreationSummary = () => {
    console.log("\n📋 === RESUMO DE CRIAÇÃO ===");
    if (creationLogs.length === 0) {
      console.log("❌ Nenhum log de criação encontrado");
      return;
    }
    
    creationLogs.forEach((log, i) => {
      console.log(`${i + 1}. [${log.timestamp}]`, ...log.message);
    });
    
    console.log(`\n📊 Total de logs: ${creationLogs.length}`);
  };
  
  console.log("✅ Logging de criação ativo");
}

// Função para testar criação automática (apenas se estiver na página)
function testAutomaticCreation() {
  const isCreatePage = window.location.pathname === '/create';
  
  if (!isCreatePage) {
    console.log("💡 Para testar automaticamente:");
    console.log("  1. Vá para /create");
    console.log("  2. Execute testAutomaticCreation() novamente");
    return;
  }
  
  console.log("🤖 Testando criação automática...");
  
  // Preencher campos
  const nameInput = document.querySelector('input[type="text"]');
  const formatButton = document.querySelector('[role="combobox"]');
  
  if (nameInput) {
    nameInput.value = `Test Deck ${Date.now()}`;
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log("✅ Nome preenchido");
  }
  
  if (formatButton) {
    formatButton.click();
    setTimeout(() => {
      const commanderOption = Array.from(document.querySelectorAll('[role="option"]'))
        .find(opt => opt.textContent.includes('Commander'));
      
      if (commanderOption) {
        commanderOption.click();
        console.log("✅ Formato selecionado");
        
        // Aguardar um pouco e tentar submeter
        setTimeout(() => {
          const submitButton = document.querySelector('button[type="submit"]');
          if (submitButton && !submitButton.disabled) {
            console.log("🚀 Iniciando criação automática...");
            const startTime = performance.now();
            
            // Marcar tempo de início
            window.creationStartTime = startTime;
            
            submitButton.click();
          } else {
            console.log("❌ Botão submit não disponível");
          }
        }, 500);
      }
    }, 200);
  }
}

// Função para verificar estado da página
function checkPageState() {
  console.log("\n🔍 === ESTADO DA PÁGINA ===");
  
  const path = window.location.pathname;
  console.log(`📍 Caminho: ${path}`);
  
  if (path === '/create') {
    const nameInput = document.querySelector('input[type="text"]');
    const formatButton = document.querySelector('[role="combobox"]');
    const submitButton = document.querySelector('button[type="submit"]');
    
    console.log("📋 Elementos da página:");
    console.log(`  📝 Campo nome: ${nameInput ? '✅' : '❌'}`);
    console.log(`  📋 Seletor formato: ${formatButton ? '✅' : '❌'}`);
    console.log(`  🔘 Botão submit: ${submitButton ? '✅' : '❌'}`);
    console.log(`  🚫 Submit desabilitado: ${submitButton?.disabled ? '✅' : '❌'}`);
    
    if (nameInput) {
      console.log(`  📝 Nome atual: "${nameInput.value}"`);
    }
    
    const loadingSpinner = document.querySelector('.animate-spin');
    if (loadingSpinner) {
      console.log("⏳ Estado: Criando deck...");
    } else {
      console.log("✅ Estado: Pronto para criar");
    }
  }
}

// Função principal
function runPerformanceTest() {
  console.log("🚀 Iniciando teste de performance...");
  
  setupPerformanceMonitoring();
  setupCreationLogging();
  checkPageState();
  
  console.log("\n💡 === FUNÇÕES DISPONÍVEIS ===");
  console.log("• checkPageState() - Verificar estado atual");
  console.log("• testAutomaticCreation() - Teste automático (apenas em /create)");
  console.log("• showCreationSummary() - Mostrar resumo de logs");
  
  console.log("\n🎯 === MÉTRICAS A OBSERVAR ===");
  console.log("• ⚡ Rápido: <500ms");
  console.log("• 🐌 Moderado: 500ms-1s");
  console.log("• ⚠️ Lento: >1s");
}

// Disponibilizar funções
window.setupPerformanceMonitoring = setupPerformanceMonitoring;
window.testAutomaticCreation = testAutomaticCreation;
window.checkPageState = checkPageState;
window.runPerformanceTest = runPerformanceTest;

// Executar automaticamente
setTimeout(runPerformanceTest, 1000);

console.log("⏱️ Teste será executado em 1 segundo...");
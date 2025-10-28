// 🧪 Teste específico para mudança de arte - Visual Debug
// Execute este script no navegador após fazer mudança de arte

console.log("🔍 TESTE: Debug Visual da Mudança de Arte");

// Função para monitorar mudanças de arte em tempo real
function monitorArtChanges() {
  console.log("\n🎨 1. Monitorando mudanças de arte...");
  
  // Observar mudanças nas imagens do grid
  const images = document.querySelectorAll('.card-image, img[src*="scryfall"]');
  console.log("🖼️ Imagens encontradas:", images.length);
  
  images.forEach((img, index) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          console.log(`✅ Imagem ${index + 1} URL mudou:`, {
            old: mutation.oldValue,
            new: img.src,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    observer.observe(img, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['src']
    });
    
    console.log(`📌 Observando imagem ${index + 1}:`, img.src);
  });
  
  return images.length;
}

// Função para verificar estado do cache React Query
function checkReactQueryCache() {
  console.log("\n⚛️ 2. Verificando cache do React Query...");
  
  // Tentar acessar queryClient se disponível
  if (window.queryClient) {
    console.log("✅ QueryClient disponível globalmente");
    
    // Verificar cache de cartas
    const queries = window.queryClient.getQueryCache().getAll();
    const cardQueries = queries.filter(q => q.queryKey[0] === 'cards');
    
    console.log("📋 Queries de cartas encontradas:", cardQueries.length);
    
    cardQueries.forEach((query, index) => {
      console.log(`Query ${index + 1}:`, {
        key: query.queryKey,
        state: query.state.status,
        dataLength: query.state.data?.length || 0,
        lastUpdated: query.state.dataUpdatedAt
      });
      
      // Mostrar primeiro card como exemplo
      if (query.state.data && query.state.data.length > 0) {
        const firstCard = query.state.data[0];
        console.log("Primeira carta:", {
          id: firstCard.id,
          name: firstCard.card_name,
          image_url: firstCard.image_url,
          scryfall_id: firstCard.scryfall_id
        });
      }
    });
  } else {
    console.log("❌ QueryClient não disponível globalmente");
    console.log("📝 Tente expor via: window.queryClient = useQueryClient()");
  }
}

// Função para verificar cache de imagem local
function checkImageCache() {
  console.log("\n🖼️ 3. Verificando cache de imagem local...");
  
  // Verificar IndexedDB para cache de imagens
  if (window.indexedDB) {
    const request = indexedDB.open('image-cache', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log("✅ IndexedDB acessível");
      
      if (db.objectStoreNames.contains('images')) {
        const transaction = db.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const countRequest = store.count();
        
        countRequest.onsuccess = () => {
          console.log("📊 Imagens em cache:", countRequest.result);
        };
      } else {
        console.log("⚠️ Object store 'images' não encontrado");
      }
    };
    
    request.onerror = () => {
      console.log("❌ Erro ao acessar IndexedDB");
    };
  } else {
    console.log("❌ IndexedDB não suportado");
  }
}

// Função para simular mudança de arte e verificar resultado
async function testArtChangeFlow() {
  console.log("\n🔄 4. Testando fluxo completo de mudança de arte...");
  
  // Verificar se há cartas no grid
  const cards = document.querySelectorAll('[data-testid*="card"], .card, [class*="card"]');
  
  if (cards.length === 0) {
    console.log("❌ Nenhuma carta encontrada no grid");
    return false;
  }
  
  console.log("🃏 Cartas no grid:", cards.length);
  
  // Pegar informações da primeira carta
  const firstCard = cards[0];
  const firstImage = firstCard.querySelector('img');
  
  if (!firstImage) {
    console.log("❌ Imagem não encontrada na primeira carta");
    return false;
  }
  
  const originalSrc = firstImage.src;
  console.log("📷 URL original da primeira carta:", originalSrc);
  
  // Instruções para teste manual
  console.log("\n📝 INSTRUÇÕES PARA TESTE MANUAL:");
  console.log("1. Triple-tap na primeira carta para abrir ArtSelector");
  console.log("2. Selecione uma versão de arte diferente");
  console.log("3. Clique em 'Alterar Arte'");
  console.log("4. Observe os logs abaixo para verificar se a mudança foi detectada");
  
  // Monitorar mudanças na primeira imagem
  let changeDetected = false;
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        if (firstImage.src !== originalSrc) {
          console.log("🎉 MUDANÇA DE ARTE DETECTADA!");
          console.log("📷 URL anterior:", originalSrc);
          console.log("📷 URL nova:", firstImage.src);
          changeDetected = true;
        }
      }
    });
  });
  
  observer.observe(firstImage, {
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['src']
  });
  
  // Aguardar um tempo para o teste manual
  setTimeout(() => {
    observer.disconnect();
    if (!changeDetected) {
      console.log("⚠️ Nenhuma mudança detectada. Possíveis problemas:");
      console.log("- Cache não foi atualizado");
      console.log("- Componente não re-renderizou");
      console.log("- Mutation falhou silenciosamente");
    }
  }, 30000); // 30 segundos para teste manual
  
  return true;
}

// Função para verificar logs de debug
function checkDebugLogs() {
  console.log("\n🔍 5. Verificando logs de debug...");
  
  // Interceptar console.log para capturar logs relevantes
  const originalLog = console.log;
  const artLogs = [];
  
  console.log = function(...args) {
    const message = args.join(' ');
    if (message.includes('🎨') || message.includes('arte') || message.includes('Art')) {
      artLogs.push(message);
    }
    originalLog.apply(console, args);
  };
  
  // Verificar se há logs de arte nos últimos minutos
  console.log("📝 Para capturar logs, faça uma mudança de arte agora...");
  
  setTimeout(() => {
    console.log = originalLog;
    
    if (artLogs.length > 0) {
      console.log("📋 Logs de arte capturados:");
      artLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    } else {
      console.log("⚠️ Nenhum log de arte capturado");
    }
  }, 10000); // 10 segundos
}

// Função principal
async function debugArtChanges() {
  console.log("🚀 Iniciando debug visual da mudança de arte...\n");
  
  const imagesCount = monitorArtChanges();
  checkReactQueryCache();
  checkImageCache();
  
  if (imagesCount > 0) {
    const testResult = await testArtChangeFlow();
    if (testResult) {
      checkDebugLogs();
    }
  }
  
  console.log("\n📋 RESUMO DO DEBUG:");
  console.log("- Imagens monitoradas:", imagesCount);
  console.log("- Cache React Query: Verificado");
  console.log("- Cache de imagem: Verificado");
  console.log("- Fluxo de teste: Configurado");
  
  console.log("\n🔧 POSSÍVEIS SOLUÇÕES:");
  console.log("1. Verificar se updates chegam ao cache React Query");
  console.log("2. Verificar se CardGridItem re-renderiza com nova props");
  console.log("3. Verificar se useImageCache limpa cache ao mudar URL");
  console.log("4. Verificar se browser cache está interferindo");
  console.log("5. Adicionar timestamp à URL para forçar reload: ?t=" + Date.now());
}

// Disponibilizar funções globalmente
if (typeof window !== 'undefined') {
  window.debugArt = {
    debugArtChanges,
    monitorArtChanges,
    checkReactQueryCache,
    checkImageCache,
    testArtChangeFlow,
    checkDebugLogs
  };
  
  console.log("🧪 Funções de debug de arte carregadas!");
  console.log("Execute: debugArt.debugArtChanges()");
}

export { 
  debugArtChanges,
  monitorArtChanges,
  checkReactQueryCache,
  checkImageCache,
  testArtChangeFlow,
  checkDebugLogs
};
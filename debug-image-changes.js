// Debug para verificar mudanças de imagem em cartas dupla face

console.log("🖼️ === DEBUG MUDANÇA DE IMAGEM ===");

function debugImageChanges() {
  const buttons = document.querySelectorAll('[data-testid="dual-face-toggle"]');
  console.log(`🎭 Encontrados ${buttons.length} botões de face dupla`);
  
  if (buttons.length === 0) {
    console.log("❌ Nenhum botão encontrado");
    return;
  }
  
  buttons.forEach((button, index) => {
    const cardId = button.getAttribute('data-card-id');
    console.log(`\n📋 === CARTA ${index + 1} (ID: ${cardId}) ===`);
    
    // Encontrar elementos relacionados
    const cardContainer = button.closest('.relative');
    const img = cardContainer?.querySelector('img.card-image');
    
    if (!img) {
      console.log("❌ Imagem não encontrada");
      return;
    }
    
    // Estado inicial
    const initialSrc = img.src;
    const initialFaceIndex = button.getAttribute('data-face-index');
    const initialTitle = button.getAttribute('title');
    
    console.log(`📊 Estado inicial:`);
    console.log(`  Face: ${initialFaceIndex}`);
    console.log(`  Título: ${initialTitle}`);
    console.log(`  URL: ${initialSrc}`);
    console.log(`  URL final: ${initialSrc.split('/').pop()}`);
    
    // Adicionar listener para mudanças
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'src') {
            const newSrc = img.src;
            console.log(`🔄 SRC mudou: ${newSrc.split('/').pop()}`);
          }
          if (mutation.attributeName === 'data-face-index') {
            const newFaceIndex = button.getAttribute('data-face-index');
            console.log(`🔄 Face Index mudou: ${initialFaceIndex} → ${newFaceIndex}`);
          }
          if (mutation.attributeName === 'title') {
            const newTitle = button.getAttribute('title');
            console.log(`🔄 Título mudou: ${newTitle}`);
          }
        }
      });
    });
    
    // Observar mudanças na imagem e no botão
    observer.observe(img, { attributes: true, attributeFilter: ['src', 'key'] });
    observer.observe(button, { attributes: true, attributeFilter: ['data-face-index', 'title'] });
    
    // Testar clique após delay
    setTimeout(() => {
      console.log(`\n🖱️ Clicando no botão da carta ${cardId}...`);
      button.click();
      
      // Verificar após clique
      setTimeout(() => {
        const newSrc = img.src;
        const newFaceIndex = button.getAttribute('data-face-index');
        const newTitle = button.getAttribute('title');
        
        console.log(`\n📊 Estado após clique:`);
        console.log(`  Face: ${initialFaceIndex} → ${newFaceIndex}`);
        console.log(`  Título: ${newTitle}`);
        console.log(`  URL: ${newSrc}`);
        console.log(`  URL final: ${newSrc.split('/').pop()}`);
        
        // Análise das mudanças
        const faceChanged = initialFaceIndex !== newFaceIndex;
        const imageChanged = initialSrc !== newSrc;
        
        console.log(`\n✅ Resultado:`);
        console.log(`  Face mudou: ${faceChanged ? 'SIM ✅' : 'NÃO ❌'}`);
        console.log(`  Imagem mudou: ${imageChanged ? 'SIM ✅' : 'NÃO ❌'}`);
        
        if (faceChanged && !imageChanged) {
          console.log(`⚠️ PROBLEMA: Face mudou mas imagem não!`);
          console.log(`  Isso indica que a URL não está sendo recalculada corretamente`);
        } else if (faceChanged && imageChanged) {
          console.log(`🎉 SUCESSO: Face e imagem mudaram!`);
        } else if (!faceChanged) {
          console.log(`❌ ERRO: Face não mudou - há problema no state`);
        }
        
      }, 1000);
      
    }, 2000 + (index * 3000));
  });
}

// Executar teste
setTimeout(debugImageChanges, 2000);

// Função para executar manualmente
window.debugImages = debugImageChanges;

console.log("⏱️ Iniciando debug em 2 segundos...");
console.log("💡 Use window.debugImages() para executar manualmente");
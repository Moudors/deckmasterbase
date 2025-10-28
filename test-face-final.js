// Teste final para verificar se as faces estão alternando visualmente

console.log("🧪 === TESTE FINAL FACES DUPLAS ===");

function testDualFaceToggle() {
  const buttons = document.querySelectorAll('[data-testid="dual-face-toggle"]');
  console.log(`🎭 Encontrados ${buttons.length} botões de face dupla`);
  
  if (buttons.length === 0) {
    console.log("❌ Nenhum botão encontrado. Certifique-se que há cartas dupla face no deck.");
    return;
  }
  
  buttons.forEach((button, index) => {
    const cardId = button.getAttribute('data-card-id');
    const faceIndex = button.getAttribute('data-face-index');
    
    console.log(`\n🎯 Testando carta ${index + 1} (ID: ${cardId})`);
    console.log(`   Face atual: ${faceIndex}`);
    
    // Encontrar a imagem correspondente
    const cardContainer = button.closest('[data-card-id]') || button.closest('.relative');
    const img = cardContainer?.querySelector('img.card-image');
    
    if (img) {
      const currentSrc = img.src;
      const currentKey = img.getAttribute('key');
      console.log(`   🖼️ Imagem atual: ${currentSrc.split('/').pop()}`);
      console.log(`   🔑 Key atual: ${currentKey}`);
      
      // Simular clique e verificar mudança
      setTimeout(() => {
        console.log(`   🖱️ Clicando no botão da carta ${cardId}...`);
        button.click();
        
        // Verificar mudanças após um delay
        setTimeout(() => {
          const newFaceIndex = button.getAttribute('data-face-index');
          const newSrc = img.src;
          const newKey = img.getAttribute('key');
          
          console.log(`   ✅ Resultado:`);
          console.log(`     Face anterior: ${faceIndex} → Face atual: ${newFaceIndex}`);
          console.log(`     Imagem mudou: ${currentSrc !== newSrc ? 'SIM' : 'NÃO'}`);
          console.log(`     Key mudou: ${currentKey !== newKey ? 'SIM' : 'NÃO'}`);
          console.log(`     Nova imagem: ${newSrc.split('/').pop()}`);
          
          if (currentSrc !== newSrc) {
            console.log(`   🎉 SUCESSO! A imagem foi atualizada!`);
          } else if (faceIndex !== newFaceIndex) {
            console.log(`   ⚠️ Face mudou mas imagem não atualizou`);
          } else {
            console.log(`   ❌ Nenhuma mudança detectada`);
          }
        }, 500);
        
      }, 1000 + (index * 2000)); // Delay entre testes
    } else {
      console.log(`   ❌ Imagem não encontrada para carta ${cardId}`);
    }
  });
}

// Aguardar carregamento e executar teste
setTimeout(testDualFaceToggle, 2000);

// Função para testar manualmente
window.testFaces = testDualFaceToggle;

console.log("⏱️ Aguardando 2 segundos para iniciar teste...");
console.log("💡 Use window.testFaces() para executar manualmente");
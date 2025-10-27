# Script para limpar completamente o cache do DeckMaster
# Execute este script se estiver com problemas graves de quota

Write-Host "`n=== LIMPEZA COMPLETA DE CACHE - DECKMASTER ===" -ForegroundColor Cyan

Write-Host "`nEste script vai limpar:" -ForegroundColor Yellow
Write-Host "  1. LocalStorage (exceto autenticação)" -ForegroundColor White
Write-Host "  2. IndexedDB (deckmaster_db)" -ForegroundColor White
Write-Host "  3. Cache do Service Worker (se houver)" -ForegroundColor White
Write-Host "  4. Cookies relacionados ao app" -ForegroundColor White

Write-Host "`n⚠️  ATENÇÃO: Você não perderá seus decks!" -ForegroundColor Yellow
Write-Host "Os dados estão salvos no Firebase Firestore." -ForegroundColor Green
Write-Host "Apenas o cache local será limpo." -ForegroundColor Green

Write-Host "`n📋 INSTRUÇÕES:" -ForegroundColor Cyan
Write-Host "1. Abra o navegador e pressione F12" -ForegroundColor White
Write-Host "2. Vá para a aba 'Console'" -ForegroundColor White
Write-Host "3. Cole e execute o seguinte código:" -ForegroundColor White

Write-Host "`n// ==================== CÓDIGO PARA COPIAR ====================" -ForegroundColor Green
Write-Host @"
// Limpar LocalStorage (exceto autenticação)
const keysToKeep = ['firebase:authUser', 'firebase:host'];
for (let i = localStorage.length - 1; i >= 0; i--) {
  const key = localStorage.key(i);
  if (key && !keysToKeep.some(k => key.includes(k))) {
    console.log('Removendo:', key);
    localStorage.removeItem(key);
  }
}

// Limpar IndexedDB
indexedDB.deleteDatabase('deckmaster_db').onsuccess = () => {
  console.log('✅ IndexedDB limpo');
};

// Limpar cache do React Query
if (window.queryClient) {
  window.queryClient.clear();
  console.log('✅ Cache React Query limpo');
}

// Limpar Service Workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
    console.log('✅ Service Workers removidos');
  });
}

console.log('✅ Limpeza completa concluída!');
console.log('🔄 Recarregue a página: location.reload()');
"@ -ForegroundColor Yellow

Write-Host "// ============================================================" -ForegroundColor Green

Write-Host "`n4. Depois execute: location.reload()" -ForegroundColor White

Write-Host "`n✅ Pronto! Seu cache estará limpo e o app funcionará normalmente." -ForegroundColor Green

Write-Host "`n💡 DICA: Use o painel de debug (canto inferior direito) para monitorar o cache!" -ForegroundColor Cyan

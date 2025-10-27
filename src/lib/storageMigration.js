// Utilitário para migrar dados do localStorage para IndexedDB
import storage from './indexedDBStorage';

const KEYS_TO_MIGRATE = [
  'deckmaster_pending_sync',
  // Adicione outras chaves do DeckMaster aqui se necessário
];

export async function migrateToIndexedDB() {
  console.log("🔄 Iniciando migração localStorage → IndexedDB...");
  
  let migratedCount = 0;
  let errors = 0;
  
  for (const key of KEYS_TO_MIGRATE) {
    try {
      const value = localStorage.getItem(key);
      
      if (value) {
        // Tenta fazer parse se for JSON
        let parsedValue;
        try {
          parsedValue = JSON.parse(value);
        } catch {
          parsedValue = value; // Mantém como string se não for JSON
        }
        
        // Salva no IndexedDB
        await storage.setItem(key, parsedValue);
        
        // Remove do localStorage após migração bem-sucedida
        localStorage.removeItem(key);
        
        migratedCount++;
        console.log(`✅ Migrado: ${key}`);
      }
    } catch (error) {
      console.error(`❌ Erro ao migrar ${key}:`, error);
      errors++;
    }
  }
  
  console.log(`
🎉 Migração concluída!
  ✅ Itens migrados: ${migratedCount}
  ❌ Erros: ${errors}
  `);
  
  return { migratedCount, errors };
}

// Limpa localStorage de itens do DeckMaster
export function clearDeckMasterLocalStorage() {
  console.log("🗑️ Limpando localStorage do DeckMaster...");
  
  let clearedCount = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    if (key.startsWith('deckmaster_')) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  console.log(`✅ ${clearedCount} itens removidos do localStorage`);
  return clearedCount;
}

// Exporta globalmente para uso no console
if (typeof window !== 'undefined') {
  window.migrateToIndexedDB = migrateToIndexedDB;
  window.clearDeckMasterLocalStorage = clearDeckMasterLocalStorage;
  console.log("💡 Use window.migrateToIndexedDB() para migrar dados do localStorage");
  console.log("💡 Use window.clearDeckMasterLocalStorage() para limpar localStorage");
}

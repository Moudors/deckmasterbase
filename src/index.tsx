import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "mana-font/css/mana.min.css";

import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 🔄 Migração automática para IndexedDB
import { migrateToIndexedDB } from "./lib/storageMigration";

// 🧹 Sistema de gerenciamento de cache
import "./lib/cacheManager"; // Apenas importa para executar (side effect)

// ✅ Importar e expor Supabase globalmente
import { supabase } from "./supabase";

// 🧹 Limpar localStorage se estiver corrompido (one-time fix)
try {
  const testKey = '_firestore_test';
  localStorage.setItem(testKey, 'test');
  localStorage.removeItem(testKey);
  
  // Migra dados do localStorage para IndexedDB automaticamente
  migrateToIndexedDB().catch(err => {
    console.error("Erro na migração:", err);
  });
} catch (e) {
  console.warn('localStorage cheio, limpando dados antigos...');
  localStorage.clear();
  window.location.reload();
}

// 🔥 Configuração OTIMIZADA para economizar quota do Firebase
// Prioriza cache local e minimiza requisições ao servidor
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Cache válido por 5 minutos (era Infinity)
      gcTime: 10 * 60 * 1000, // Mantém cache por 10 minutos (era 24h - muito tempo!)
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      refetchOnReconnect: false, // Não refetch ao reconectar internet
      refetchOnMount: false, // Não refetch ao montar componente
      retry: 1, // Apenas 1 retry em caso de erro (reduz requisições)
      retryDelay: 3000, // 3 segundos entre retries
    },
  },
});

// Torna queryClient acessível globalmente para o cacheManager
if (typeof window !== 'undefined') {
  window.queryClient = queryClient;
  // ✅ Expor Supabase globalmente para debug
  window.supabase = supabase;
  console.log('✅ Supabase exposto globalmente para debug');
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* Ferramenta de debug do React Query */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);

// Medição de performance
reportWebVitals();

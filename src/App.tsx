// src/App.tsx
import React, { useEffect, ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "./hooks/useAuthState";

// Páginas
import Home from "@/pages/Home";
import Deckbuilder from "@/pages/Deckbuilder";
import CreateDeck from "@/pages/CreateDeck";
import LoginPage from "@/pages/LoginPage"; // ✅ nome correto

// Componente de debug (apenas em desenvolvimento)
import { CacheDebugPanel } from "@/components/ui/CacheDebugPanel";

// 🚀 Sistema de inicialização offline-first
import appInitializer from "@/lib/appInitializer";

// Componente de rota protegida
function ProtectedRoute({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState();
  const [forceShow, setForceShow] = React.useState(false);

  // Timeout de segurança para evitar loading infinito
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('⚠️ ProtectedRoute - Timeout de segurança atingido, forçando exibição');
        setForceShow(true);
      }
    }, 5000); // 5 segundos

    return () => clearTimeout(timeoutId);
  }, [loading]);

  if (loading && !forceShow) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4">Carregando...</div>
          <div className="text-sm text-gray-400">
            Verificando autenticação...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  console.log('🚀 App inicializando...');
  
  const [user, loading] = useAuthState();

  console.log('👤 App - user:', user ? user.email : 'sem usuário', 'loading:', loading);

  useEffect(() => {
    console.log('🔧 Inicializando appInitializer...');
    try {
      // 🚀 Inicializa sistema offline-first
      appInitializer.initialize();
      console.log('✅ appInitializer inicializado');
    } catch (error) {
      console.error('❌ Erro no appInitializer:', error);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      console.log('✅ Usuário logado:', user.email);
      // ✅ Perfil do usuário é criado automaticamente no supabase.ts
      // quando o onAuthStateChanged é disparado
    }
  }, [user, loading]);

  // ✅ Detecta callback do OAuth
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (accessToken) {
      console.log('🔄 Callback OAuth detectado, processando tokens...');
      // O supabase já está processando automaticamente através do onAuthStateChange
    }
  }, []);

  return (
    <>
      <Routes>
        {/* Rota pública */}
        <Route 
          path="/login" 
          element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando login...</div>}>
              <LoginPage />
            </React.Suspense>
          } 
        />

        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deckbuilder/:id"
          element={
            <ProtectedRoute>
              <Deckbuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create"
          element={
            <ProtectedRoute>
              <CreateDeck />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Painel de debug - apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && <CacheDebugPanel />}
    </>
  );
}

export default App;

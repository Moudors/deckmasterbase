// src/App.tsx
import React, { useEffect, ReactNode } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuthState } from "./hooks/useAuthState";

// Páginas
import Home from "@/pages/Home";
import Deckbuilder from "@/pages/Deckbuilder";
import CreateDeck from "@/pages/CreateDeck";
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import FriendDecksPage from "@/pages/FriendDecksPage";
import Collection from "@/pages/Collection";
import Trade from "@/pages/Trade";

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
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <img src="/logo192.png" alt="Logo" className="mx-auto mb-6 w-24 h-24" />
          <div className="mb-4 text-xl font-bold">Carregando...</div>
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
  const navigate = useNavigate();

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

  // ✅ Detecta callback do OAuth e redireciona para home
  useEffect(() => {
    // Supabase usa hash fragments (#) ao invés de query params (?)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    if (accessToken || type === 'recovery') {
      console.log('🔄 Callback OAuth detectado, processando tokens...', { type });
      // O supabase já está processando automaticamente através do onAuthStateChange
      // Aguardar um pouco para o estado ser atualizado e então redirecionar
      setTimeout(() => {
        console.log('✅ Redirecionando para home após OAuth...');
        // Limpar hash da URL
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { replace: true });
      }, 1500);
    }
  }, [navigate]);

  return (
    <>
      <Routes>
        {/* Rotas públicas */}
        <Route 
          path="/login" 
          element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando login...</div>}>
              <LoginPage />
            </React.Suspense>
          } 
        />
        
        <Route 
          path="/signup" 
          element={
            <React.Suspense fallback={<div className="flex items-center justify-center h-screen bg-gray-900 text-white">Carregando cadastro...</div>}>
              <SignUpPage />
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

        <Route
          path="/friend/:friendId/decks"
          element={
            <ProtectedRoute>
              <FriendDecksPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/collection"
          element={
            <ProtectedRoute>
              <Collection />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/trade"
          element={
            <ProtectedRoute>
              <Trade />
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

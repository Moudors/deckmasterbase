// src/App.tsx
import React, { useEffect, ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";

// Páginas
import Home from "@/pages/Home";
import Deckbuilder from "@/pages/Deckbuilder";
import CreateDeck from "@/pages/CreateDeck";
import LoginPage from "@/pages/LoginPage"; // ✅ nome correto

// Função utilitária
import { ensureUserProfile } from "@/utils/userUtils";

// Componente de debug (apenas em desenvolvimento)
import { CacheDebugPanel } from "@/components/ui/CacheDebugPanel";

// 🚀 Sistema de inicialização offline-first
import appInitializer from "@/lib/appInitializer";

// Componente de rota protegida
function ProtectedRoute({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // 🚀 Inicializa sistema offline-first
    appInitializer.initialize();
  }, []);

  useEffect(() => {
    if (user && !loading) {
      // ✅ Garante que o perfil do usuário exista no Firestore
      ensureUserProfile(user);
    }
  }, [user, loading]);

  return (
    <>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<LoginPage />} />

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

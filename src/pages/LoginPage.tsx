import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signInWithGoogle } from "../authSupabase"; // ✅ Agora usa Supabase
import { Button } from "../components/ui/button";
import { useAuthState } from "../hooks/useAuthState";
import { User } from '@supabase/supabase-js';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, loading] = useAuthState() as [User | null, boolean];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Redireciona automaticamente se já estiver logado
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ Usuário já logado, redirecionando para home...', user?.email);
      setTimeout(() => {
        navigate("/", { replace: true }); // ✅ Replace para evitar loop
      }, 100);
    }
  }, [user, loading, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoginLoading(true);
    
    try {
      console.log('🔐 Iniciando login...');
      const result = await signIn(email, password);
      console.log('✅ Login realizado:', result);
      
      // Pequeno delay para garantir que o estado seja atualizado
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      setError("Falha no login: " + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoginLoading(true);
    try {
      console.log('🔄 Iniciando login com Google...');
      await signInWithGoogle();
      // Para OAuth, o redirect é automático. O useEffect vai detectar quando voltar logado
    } catch (err: any) {
      console.error('❌ Erro no login Google:', err);
      setError("Erro no login com Google: " + err.message);
      setLoginLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-lg border border-gray-200 mx-auto mt-20">
      <div className="flex flex-col items-center mb-6">
        <img src="/logo192.png" alt="Logo" className="w-16 h-16 mb-2" />
        <h1 className="text-2xl font-semibold text-gray-800">Entrar na sua conta</h1>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-xl transition hover:bg-gray-100"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Entrar com Google</span>
        </Button>
      </form>
    </div>
  );
};

export default LoginPage;

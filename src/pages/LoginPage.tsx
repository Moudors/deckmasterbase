import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
      navigate("/", { replace: true }); // ✅ Replace para evitar loop
    }
  }, [user, loading, navigate]);

  // Mostra loading enquanto processa callback OAuth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <img src="/logo192.png" alt="Logo" className="mx-auto mb-6 w-24 h-24" />
          <div className="mb-4 text-xl font-bold">Autenticando...</div>
          <div className="text-sm text-gray-400">
            Processando login...
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo192.png" alt="Logo" className="w-16 h-16 mb-3" />
          <h1 className="text-3xl font-bold text-white mb-1">Entrar</h1>
          <p className="text-gray-400 text-sm">Acesse sua conta</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loginLoading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginLoading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">ou</span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 border border-gray-600 text-white py-3 rounded-xl transition hover:bg-gray-600"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Entrar com Google</span>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Não tem uma conta?{" "}
            <Link
              to="/signup"
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Criar Conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signUp, signInWithGoogle } from "../authSupabase";
import { Button } from "../components/ui/button";
import { useAuthState } from "../hooks/useAuthState";
import { User } from '@supabase/supabase-js';
import { supabase } from "../supabase";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, loading] = useAuthState() as [User | null, boolean];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (user && !loading) {
      console.log('✅ Usuário já logado, redirecionando para home...', user?.email);
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <img src="/logo192.png" alt="Logo" className="mx-auto mb-6 w-24 h-24" />
          <div className="mb-4 text-xl font-bold">Carregando...</div>
        </div>
      </div>
    );
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    // Validações
    if (!email || !password || !displayName) {
      setError("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setSignUpLoading(true);
    
    try {
      console.log('🔐 Criando nova conta...');
      
      // Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            full_name: displayName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        console.log('✅ Conta criada no Auth:', authData.user.email);

        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            uuid: authData.user.id,
            email: authData.user.email,
            display_name: displayName,
            username: displayName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('⚠️ Erro ao criar perfil:', profileError);
          // Não falha completamente, o perfil pode ser criado pelo trigger automático
        } else {
          console.log('✅ Perfil criado na tabela users');
        }

        setSuccess("Conta criada com sucesso! Você pode fazer login agora.");
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('❌ Erro ao criar conta:', err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    try {
      console.log('🔄 Iniciando cadastro com Google...');
      await signInWithGoogle();
    } catch (err: any) {
      console.error('❌ Erro no cadastro Google:', err);
      setError("Erro no cadastro com Google: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo192.png" alt="Logo" className="w-16 h-16 mb-3" />
          <h1 className="text-3xl font-bold text-white mb-1">Criar Conta</h1>
          <p className="text-gray-400 text-sm">Junte-se ao DeckMaster</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
              Nome de Exibição *
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="Como você quer ser chamado"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              E-mail *
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Senha * <span className="text-xs text-gray-500">(mínimo 6 caracteres)</span>
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Senha *
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm text-center">{success}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={signUpLoading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signUpLoading ? "Criando conta..." : "Criar Conta"}
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
            onClick={handleGoogleSignUp}
            disabled={signUpLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-700 border border-gray-600 text-white py-3 rounded-xl transition hover:bg-gray-600"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span>Cadastrar com Google</span>
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Já tem uma conta?{" "}
            <Link
              to="/login"
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Fazer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

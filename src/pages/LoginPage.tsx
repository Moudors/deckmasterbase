import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signIn, signInWithGoogle } from "../auth"; // usa o auth.ts
import { Button } from "../components/ui/button";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/home");
    } catch (err: any) {
      setError("Falha no login: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/home");
    } catch (err: any) {
      setError("Erro no login com Google: " + err.message);
    } finally {
      setLoading(false);
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

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../authSupabase";
import { Button } from "../components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.error("❌ Erro ao enviar email:", err);
      setError(err.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-3">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Esqueci a Senha</h1>
          <p className="text-gray-400 text-sm text-center">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-green-400 text-sm text-center">
                ✅ Email enviado com sucesso!
              </p>
              <p className="text-gray-400 text-xs text-center mt-2">
                Verifique sua caixa de entrada e spam
              </p>
            </div>

            <Link to="/login">
              <Button className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl transition hover:bg-gray-600 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                required
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
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Enviando..." : "Enviar Link de Recuperação"}
            </Button>

            <Link to="/login">
              <Button
                type="button"
                className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl transition hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o Login
              </Button>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

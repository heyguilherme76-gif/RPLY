import React, { useState } from "react";
import { Mail, Lock, User as UserIcon, Loader2, ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";

export const LoginScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // User profile is handled by AuthContext useEffect onAuthStateChanged
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Gmail Já Cadastrado");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("E-mail ou senha incorretos");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail inválido");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Insira seu e-mail primeiro");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Link de recuperação enviado para seu e-mail!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center px-6 py-12 max-w-sm mx-auto h-full">
      <div className="mb-12 text-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-brand-purple to-brand-pink rounded-3xl rotate-12 flex items-center justify-center shadow-lg shadow-brand-purple/20 mx-auto mb-6">
          <MessageSquareIcon className="text-white -rotate-12" size={32} />
        </div>
        <h1 className="text-4xl font-black gradient-text italic">RPLY</h1>
        <p className="text-gray-400 text-sm mt-2">
          {isLogin ? "Bem-vindo de volta" : "Crie sua conta gratuita"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {!isLogin && (
          <div className="relative">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Nome"
              className="w-full bg-dark-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-purple transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="email"
            placeholder="E-mail"
            required
            className="w-full bg-dark-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-purple transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="password"
            placeholder="Senha"
            required
            className="w-full bg-dark-card border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-purple transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isLogin && (
          <button 
            type="button"
            onClick={handleResetPassword}
            className="text-xs text-brand-pink font-medium hover:underline w-full text-right"
          >
            Esqueci minha senha
          </button>
        )}

        <button
          disabled={loading}
          className="w-full py-4 gradient-bg rounded-2xl font-bold flex items-center justify-center gap-2 mt-4 hover:scale-[1.01] transition-transform active:scale-95 disabled:opacity-50"
          id="btn-auth"
        >
          {loading ? <Loader2 className="animate-spin" /> : (isLogin ? "Entrar" : "Criar Conta")}
          {!loading && <ArrowRight size={18} />}
        </button>
      </form>

      {error && <p className="text-red-500 text-xs mt-4 text-center">{error}</p>}
      {message && <p className="text-green-500 text-xs mt-4 text-center">{message}</p>}

      <div className="mt-8 flex flex-col items-center gap-4 text-sm">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-gray-400"
        >
          {isLogin ? (
            <>Não tem uma conta? <span className="text-brand-purple font-bold">Cadastre-se</span></>
          ) : (
            <>Já tem uma conta? <span className="text-brand-purple font-bold">Entrar</span></>
          )}
        </button>
      </div>
    </div>
  );
};

const MessageSquareIcon = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

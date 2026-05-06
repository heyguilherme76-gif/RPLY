import React from "react";
import { Check, Zap, MessageSquare, ShieldCheck, Star, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";

interface PremiumScreenProps {
  onBack?: () => void;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const checkoutUrl = `https://pay.kiwify.com.br/GGiYxB4?ext_user_id=${user?.uid || ""}`;

  const benefits = [
    { icon: <MessageSquare size={20} />, text: "Análises ilimitadas", desc: "Sem restrição de 3 por dia" },
    { icon: <Zap size={20} />, text: "Respostas mais inteligentes", desc: "Algoritmo avançado de persuasão" },
    { icon: <ShieldCheck size={20} />, text: "Análise mais detalhada", desc: "Insights psicológicos profundos" },
    { icon: <Star size={20} />, text: "Estilos exclusivos", desc: "Romântico, Assertivo ou Engraçado" },
  ];

  return (
    <div className="flex flex-col items-center px-4 py-12 max-w-lg mx-auto overflow-y-auto h-full">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full flex justify-start mb-4"
      >
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-400 group"
        >
          <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-block p-1 rounded-full bg-gradient-to-r from-brand-purple to-brand-pink mb-4">
          <div className="bg-dark-bg rounded-full px-4 py-1 flex items-center gap-2">
            <Star size={16} className="text-brand-pink fill-brand-pink" />
            <span className="text-xs font-bold uppercase tracking-wider">Premium Access</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-4">
          RPLY <span className="gradient-text">Premium</span>
        </h1>
        <p className="text-gray-400">
          Domine suas conversas e nunca mais fique no vácuo.
        </p>
      </motion.div>

      <div className="w-full space-y-4 mb-10">
        {benefits.map((benefit, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 p-4 bg-dark-card rounded-2xl border border-white/5"
          >
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
              {benefit.icon}
            </div>
            <div>
              <h3 className="font-semibold">{benefit.text}</h3>
              <p className="text-xs text-gray-500">{benefit.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="w-full bg-dark-card p-6 rounded-3xl border border-brand-purple/30 card-shadow mb-8">
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm mb-1">Acesso Vitallício (Mensal)</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl font-bold italic opacity-50">R$</span>
            <span className="text-5xl font-bold">9,90</span>
            <span className="text-gray-400">/mês</span>
          </div>
        </div>

        <button 
          onClick={() => window.open(checkoutUrl, "_blank")}
          className="w-full py-5 rounded-2xl gradient-bg font-bold text-lg hover:scale-[1.02] transition-all active:scale-95 glow-purple shadow-xl"
          id="btn-subscribe"
        >
          Assinar Agora
        </button>
      </div>

      <button 
        onClick={onBack}
        className="text-gray-500 text-sm font-medium hover:text-white transition-colors"
      >
        Continuar como usuário grátis
      </button>
    </div>
  );
};

import React, { useState, useRef } from "react";
import { Upload, Send, MessageSquare, Image as ImageIcon, Loader2, Sparkles, Search, BarChart3, Lock, Crown, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

interface HomeScreenProps {
  onAnalyze: (text: string, image?: string, style?: string) => void;
  isLoading: boolean;
  remainingAnalyses: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onAnalyze, isLoading, remainingAnalyses }) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [style, setStyle] = useState("equilibrado");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkoutUrl = `https://pay.kiwify.com.br/GGiYxB4?ext_user_id=${user?.uid || ""}`;

  const styles = [
    { id: "equilibrado", label: "Equilibrado", icon: "⚖️" },
    { id: "romantico", label: "Romântico", icon: "❤️" },
    { id: "direto", label: "Direto", icon: "🎯" },
    { id: "engracado", label: "Engraçado", icon: "😂" },
    { id: "misterioso", label: "Misterioso", icon: "🔮" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if ((text.trim() || image) && !isLoading) {
      onAnalyze(text, image || undefined, style);
    }
  };

  const features = [
    { icon: <Search size={18} />, label: "Análise inteligente" },
    { icon: <BarChart3 size={18} />, label: "Nível de interesse %" },
    { icon: <MessageSquare size={18} />, label: "Respostas prontas" },
    { icon: <Lock size={18} />, label: "Privacidade total" },
  ];

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      {/* Header Fixo */}
      <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-lg glow-purple">
            <MessageSquare size={18} className="text-white fill-white/20" />
          </div>
          <span className="text-xl font-black italic tracking-tighter">RPLY</span>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors">
          <UserIcon size={20} className="text-gray-400" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-32 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-bold uppercase tracking-widest"
          >
            Powered by AI Deep Analysis
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold leading-tight"
          >
            Descubra o que a pessoa <br />
            <span className="gradient-text">realmente quer dizer</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-sm max-w-[280px] mx-auto"
          >
            Cole a conversa e receba uma análise completa em segundos.
          </motion.p>
        </section>

        {/* Input Area */}
        <section className="space-y-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 gradient-bg rounded-[32px] opacity-0 group-focus-within:opacity-30 blur-md transition-opacity" />
            <div className="relative bg-dark-card border border-white/10 rounded-[32px] overflow-hidden focus-within:border-brand-purple/50 transition-all">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole o print ou texto da conversa..."
                className="w-full h-56 bg-transparent p-6 outline-none text-gray-200 placeholder:text-gray-600 resize-none leading-relaxed text-sm"
              />
              <div className="absolute bottom-4 right-4 flex gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-all hover:scale-110 active:scale-95 border border-white/5"
                >
                  <ImageIcon size={20} />
                </button>
              </div>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />

          <AnimatePresence>
            {image && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative rounded-2xl overflow-hidden border border-brand-purple/50 glow-purple aspect-video"
              >
                <img src={image} className="w-full h-full object-cover" alt="Print" />
                <button 
                  onClick={() => setImage(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white text-sm"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                Tom da Resposta:
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                      style === s.id 
                        ? "bg-brand-purple border-brand-purple text-white glow-purple" 
                        : "bg-white/5 border-white/10 text-gray-400"
                    }`}
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!text.trim() && !image) || isLoading || remainingAnalyses <= 0}
              className="w-full py-5 rounded-2xl gradient-bg font-bold text-lg flex items-center justify-center gap-3 shadow-xl glow-purple hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Analisar Conversa
                  <Send size={18} />
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <span>Créditos Grátis:</span>
              <div className="flex gap-1">
                {[1, 2].map((i) => (
                  <div 
                    key={i} 
                    className={`w-4 h-1 rounded-full ${i <= remainingAnalyses ? "gradient-bg" : "bg-white/10"}`} 
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features list */}
        <section className="grid grid-cols-2 gap-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-dark-card/50 rounded-2xl border border-white/5">
              <div className="text-brand-purple">
                {feature.icon}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                {feature.label}
              </span>
            </div>
          ))}
        </section>

        {/* Premium Banner */}
        <section className="relative px-6 py-8 rounded-[32px] premium-card overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-125 transition-transform">
             <Crown size={80} className="text-brand-pink" />
          </div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-xl font-bold">Desbloqueie o <br /><span className="gradient-text italic font-black">RPLY Premium</span></h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-xs text-gray-300">
                <Sparkles size={14} className="text-brand-purple" />
                Análises ilimitadas
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-300">
                <Sparkles size={14} className="text-brand-purple" />
                Respostas mais avançadas
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-300">
                <Sparkles size={14} className="text-brand-purple" />
                Melhor precisão de IA
              </li>
            </ul>
            <button 
              onClick={() => window.open(checkoutUrl, "_blank")}
              className="w-full py-4 mt-2 bg-white text-black font-bold rounded-xl hover:bg-brand-pink hover:text-white transition-all active:scale-95 shadow-lg"
            >
              Assinar por R$ 9,90/mês
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

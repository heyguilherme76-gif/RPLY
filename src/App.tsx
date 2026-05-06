import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HomeScreen } from "./components/HomeScreen";
import { ResultScreen } from "./components/ResultScreen";
import { PremiumScreen } from "./components/PremiumScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { LoginScreen } from "./components/LoginScreen";
import { Crown, Home, User, LogOut, Loader2, Sparkles, Clock } from "lucide-react";
import { doc, updateDoc, increment, collection, addDoc } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { motion, AnimatePresence } from "motion/react";

import { analyzeConversation } from "./services/geminiService";

const AppContent = () => {
  const { user, userData, loading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<"home" | "result" | "premium" | "profile" | "history">("home");
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-redirect if not logged in
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <Loader2 className="text-brand-purple animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // If we have a user but no userData yet, wait a bit
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-bg">
        <Loader2 className="text-brand-purple animate-spin" size={48} />
      </div>
    );
  }

  const handleAnalyze = async (text: string, image?: string, style: string = "equilibrado") => {
    if (!userData.isPremium && (userData.totalUsage || userData.dailyUsage || 0) >= 2) {
      setCurrentScreen("premium");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeConversation(text, image, style);
      
      // Save to Firestore History
      const analysisRef = collection(db, "users", user.uid, "analyses");
      await addDoc(analysisRef, {
        ...result,
        userId: user.uid,
        content: text.substring(0, 500), // Store snippet of the conversation
        createdAt: new Date().toISOString(),
      });

      setAnalysisResult(result);
      setCurrentScreen("result");

      // Update usage if not premium
      if (!userData.isPremium) {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          totalUsage: increment(1)
        });
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao analisar. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-white selection:bg-brand-purple/30 max-w-md mx-auto relative overflow-hidden">
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === "home" && (
            <motion.div 
              key="home" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <HomeScreen 
                onAnalyze={handleAnalyze} 
                isLoading={isAnalyzing} 
                remainingAnalyses={userData?.isPremium ? Infinity : Math.max(0, 2 - (userData?.totalUsage || userData?.dailyUsage || 0))} 
              />
            </motion.div>
          )}
          {currentScreen === "result" && analysisResult && (
            <motion.div 
              key="result" 
              initial={{ opacity: 0, x: 100 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -100 }}
              className="h-full"
            >
              <ResultScreen data={analysisResult} onBack={() => setCurrentScreen("home")} />
            </motion.div>
          )}
          {currentScreen === "premium" && (
            <motion.div 
              key="premium"
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }}
              className="h-full"
            >
              <PremiumScreen onBack={() => setCurrentScreen("home")} />
            </motion.div>
          )}
           {currentScreen === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-brand-purple to-brand-pink mb-6 flex items-center justify-center text-4xl font-bold">
                {userData?.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold mb-1">{userData?.email}</h2>
              <p className="text-gray-500 mb-8">{userData?.isPremium ? "Usuário Premium" : "Plano Gratuito"}</p>
              
              <div className="w-full bg-dark-card rounded-2xl p-6 mb-8 text-left border border-white/5">
                 <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Total de análises</span>
                    <span className="text-sm font-bold">{(userData?.totalUsage || userData?.dailyUsage || 0)}/2</span>
                 </div>
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-bg transition-all duration-500" 
                      style={{ width: `${Math.min(100, ((userData?.totalUsage || userData?.dailyUsage || 0) / 2) * 100)}%` }} 
                    />
                 </div>
              </div>

              <button 
                onClick={() => auth.signOut()}
                className="flex items-center gap-2 text-red-500 font-bold hover:bg-red-500/10 px-6 py-3 rounded-xl transition-colors"
              >
                <LogOut size={20} /> Sair da conta
              </button>
            </motion.div>
          )}
          {currentScreen === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <HistoryScreen onSelect={(item) => {
                setAnalysisResult(item);
                setCurrentScreen("result");
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="h-20 bg-dark-card/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 pb-4 sticky bottom-0 z-40">
        <NavButton 
          active={currentScreen === "home"} 
          onClick={() => setCurrentScreen("home")} 
          icon={<Home size={20} />} 
          label="Home" 
        />
        <NavButton 
          active={currentScreen === "result"} 
          onClick={() => {
            if (analysisResult) setCurrentScreen("result");
            else setCurrentScreen("home");
          }} 
          icon={<Sparkles size={20} />} 
          label="Análise" 
        />
        <NavButton 
          active={currentScreen === "history"} 
          onClick={() => setCurrentScreen("history")} 
          icon={<Clock size={20} />} 
          label="Histórico" 
        />
        <NavButton 
          active={currentScreen === "premium"} 
          onClick={() => setCurrentScreen("premium")} 
          icon={<Crown size={20} className={userData?.isPremium ? "text-yellow-500" : ""} />} 
          label="Premium" 
        />
        <NavButton 
          active={currentScreen === "profile"} 
          onClick={() => setCurrentScreen("profile")} 
          icon={<User size={20} />} 
          label="Perfil" 
        />
      </nav>

      {isAnalyzing && (
        <div className="absolute inset-0 bg-dark-bg/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mb-8"
            >
              <Sparkles className="text-brand-purple" size={64} />
            </motion.div>
            <h2 className="text-2xl font-bold mb-4">Lendo as entrelinhas...</h2>
            <p className="text-gray-400 max-w-[250px]">Nossa IA está analisando cada sinal e tom da conversa.</p>
        </div>
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all ${active ? "text-brand-purple scale-110" : "text-gray-500 hover:text-gray-300"}`}
  >
    <div className={`p-2 rounded-xl ${active ? "bg-brand-purple/10" : ""}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

import React, { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import { Calendar, ChevronRight, MessageSquare, TrendingUp, HelpCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface HistoryItem {
  id: string;
  nivel_interesse: number;
  classificacao: string;
  explicacao: string;
  respostas: string[];
  content: string;
  createdAt: string;
}

interface HistoryScreenProps {
  onSelect: (item: any) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "users", user.uid, "analyses"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as HistoryItem[];
        setHistory(items);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="text-brand-purple animate-spin" size={32} />
        <p className="text-gray-500 text-sm mt-4 uppercase tracking-widest font-bold">Carregando Histórico...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
          <MessageSquare size={32} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-bold mb-2">Nenhuma análise ainda</h3>
        <p className="text-gray-500 text-sm">
          Suas conversas analisadas aparecerão aqui para você consultar as respostas sugeridas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-dark-bg">
      <header className="px-6 py-6 border-b border-white/5">
        <h1 className="text-2xl font-bold italic">Seu <span className="gradient-text">Histórico</span></h1>
        <p className="text-gray-500 text-xs mt-1">Últimas 20 análises realizadas</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {history.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(item)}
            className="p-4 sm:p-5 bg-dark-card border border-white/5 rounded-[20px] sm:rounded-[24px] flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-brand-purple/30"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 transform -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-white/5 sm:hidden"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 18}
                    strokeDashoffset={2 * Math.PI * 18 * (1 - item.nivel_interesse / 100)}
                    className="text-brand-purple sm:hidden"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-white/5 hidden sm:block"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - item.nivel_interesse / 100)}
                    className="text-brand-purple hidden sm:block"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] font-black">{item.nivel_interesse}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                   {item.nivel_interesse >= 70 ? (
                    <TrendingUp size={12} className="text-green-500" />
                   ) : item.nivel_interesse >= 40 ? (
                    <HelpCircle size={12} className="text-yellow-500" />
                   ) : (
                    <AlertCircle size={12} className="text-red-500" />
                   )}
                   <h4 className="text-sm font-bold truncate max-w-[150px]">{item.classificacao}</h4>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-medium">
                  <Calendar size={10} />
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>

            <ChevronRight size={20} className="text-gray-600 group-hover:text-white transition-colors" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

import React from "react";
import { CheckCircle2, ChevronLeft, Copy, AlertCircle, TrendingUp, HelpCircle } from "lucide-react";
import { motion } from "motion/react";

interface ResultData {
  nivel_interesse: number;
  classificacao: string;
  explicacao: string;
  respostas: string[];
}

interface ResultScreenProps {
  data: ResultData;
  onBack: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ data, onBack }) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full px-4 pt-6 pb-20 max-w-lg mx-auto overflow-y-auto">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-6 group w-fit"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Voltar à análise
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="relative inline-flex items-center justify-center p-1 rounded-full mb-6 mx-auto">
           <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/5"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - data.nivel_interesse / 100)}
              className={`text-brand-purple transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black">{data.nivel_interesse}%</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-1">{data.classificacao}</h2>
        <div className="flex justify-center gap-4 text-xs font-medium uppercase tracking-widest text-gray-500">
           {data.nivel_interesse >= 70 ? (
             <span className="text-green-500 flex items-center gap-1"><TrendingUp size={14} /> Recomenda-se prosseguir</span>
           ) : data.nivel_interesse >= 40 ? (
             <span className="text-yellow-500 flex items-center gap-1"><HelpCircle size={14} /> Proceda com cautela</span>
           ) : (
             <span className="text-red-500 flex items-center gap-1"><AlertCircle size={14} /> Mude de estratégia</span>
           )}
        </div>
      </motion.div>

      <section className="mb-8 p-5 bg-dark-card rounded-3xl border border-white/5 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
          Análise do Comportamento
        </h3>
        <p className="text-gray-300 leading-relaxed text-sm">
          {data.explicacao}
        </p>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 ml-1">Sugestões de Resposta (Copie e envie):</h3>
        <div className="space-y-4">
          {data.respostas.map((sug, i) => (
            <motion.div 
              key={i}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 + (i * 0.1) }}
              className="p-5 bg-dark-card border border-white/5 rounded-2xl group relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer"
              onClick={() => copyToClipboard(sug)}
            >
              <div className="absolute top-0 left-0 w-1 h-full gradient-bg opacity-50 group-hover:opacity-100 transition-opacity" />
              <p className="text-base text-gray-200 mb-4 font-medium leading-relaxed">
                "{sug}"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-gray-500">Pronta para enviar</span>
                <button 
                  className="flex items-center gap-2 text-xs font-bold uppercase text-brand-pink hover:opacity-80 transition-opacity"
                >
                  <Copy size={14} /> Copiar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

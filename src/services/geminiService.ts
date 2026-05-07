import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  nivel_interesse: number;
  classificacao: string;
  explicacao: string;
  respostas: string[];
}

export const analyzeConversation = async (text: string, imageBase64?: string, style: string = "equilibrado"): Promise<AnalysisResult> => {
  const model = "gemini-3-flash-preview";

  const prompt = `
    Você é um assistente especialista em relacionamentos e análise de conversas.
    Sua tarefa é analisar uma conversa de chat e retornar um JSON com a análise e sugestões de respostas REAIS.

    ESTILO DE RESPOSTA DESEJADO: ${style}

    REGRAS PARA AS RESPOSTAS:
    1. Devem seguir o estilo "${style}".
    2. Devem ser mensagens prontas para enviar (como no zap).
    3. Linguagem natural, curta (1-2 linhas no máximo).
    4. Use gírias leves se o clima permitir, soe como um humano real.
    5. NÃO inclua análises, explicações ou "Você deveria..." dentro da lista de respostas.
    6. NÃO fale sobre "nível de interesse" nas respostas enviáveis.
    
    EXEMPLO DE RESPOSTA BOA: "Tranquilo, quando tiver tempo me chama"
    EXEMPLO DE RESPOSTA RUIM: "Você deve demonstrar que não se importa tanto para ela sentir sua falta..."

    Retorne EXATAMENTE este formato JSON:
    {
      "nivel_interesse": number (0-100),
      "classificacao": "string",
      "explicacao": "análise detalhada do comportamento",
      "respostas": ["mensagem 1", "mensagem 2", "mensagem 3"]
    }
  `;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }

    const parts: any[] = [{ text: prompt }];
    
    if (text.trim()) {
      parts.push({ text: `Conversa em texto:\n${text}` });
    }

    if (imageBase64) {
      let mimeType = "image/png";
      let imageData = imageBase64;

      if (imageBase64.includes(";base64,")) {
        const match = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
        if (match) mimeType = match[1];
        imageData = imageBase64.split(",")[1];
      }

      parts.push({ 
        inlineData: { 
          data: imageData, 
          mimeType 
        } 
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nivel_interesse: { type: Type.INTEGER },
            classificacao: { type: Type.STRING },
            explicacao: { type: Type.STRING },
            respostas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["nivel_interesse", "classificacao", "explicacao", "respostas"]
        }
      }
    });

    const analysisText = response.text;
    if (!analysisText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    return JSON.parse(analysisText.trim());
  } catch (error: any) {
    console.error("Erro na GeminiService:", error);
    throw new Error(error.message || "Erro desconhecido na análise da IA");
  }
};

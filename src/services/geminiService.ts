
export interface AnalysisResult {
  nivel_interesse: number;
  classificacao: string;
  explicacao: string;
  respostas: string[];
}

export const analyzeConversation = async (text: string, imageBase64?: string, style: string = "equilibrado"): Promise<AnalysisResult> => {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        imageBase64,
        style
      }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha na comunicação com o servidor de IA");
      } else {
        const errorText = await response.text();
        console.error("Servidor retornou erro não-JSON:", errorText);
        throw new Error(`Erro do servidor (${response.status}): Resposta inesperada do servidor.`);
      }
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Resposta não é JSON:", text);
      throw new Error("O servidor não retornou um formato de dados válido (JSON).");
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erro na analyzeConversation:", error);
    throw new Error(error.message || "Erro desconhecido ao processar a análise");
  }
};

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase config
let firebaseConfig: any = null;
try {
  const configRaw = fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf-8");
  firebaseConfig = JSON.parse(configRaw);
} catch (error) {
  console.error("Could not read firebase-applet-config.json:", error);
}

// Initialize Firebase Admin lazily
let adminApp: admin.app.App | null = null;
const getAdminApp = () => {
  if (adminApp) return adminApp;
  try {
    if (!admin.apps.length) {
      adminApp = admin.initializeApp({
        projectId: firebaseConfig?.projectId,
      });
      console.log("Firebase Admin initialized with project:", firebaseConfig?.projectId);
    } else {
      adminApp = admin.apps[0]!;
    }
    return adminApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    return null;
  }
};

// Get DB reference - handle potential initialization failure
const getDb = () => {
  try {
    const app = getAdminApp();
    if (!app) return null;
    return admin.firestore(firebaseConfig?.firestoreDatabaseId || "(default)");
  } catch (error) {
    console.error("Error getting Firestore reference:", error);
    return null;
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("NODE_ENV:", process.env.NODE_ENV);

  app.use(express.json());

  // API routes
  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", firebase: !!admin.apps.length });
  });

  // Gemini Analysis Endpoint
  apiRouter.post("/analyze", async (req, res) => {
    const { text, imageBase64, style } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not defined in the environment");
      return res.status(500).json({ error: "Configuração do servidor incompleta (chave de API ausente na Vercel)" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Você é um assistente especialista em relacionamentos e análise de conversas.
        Sua tarefa é analisar uma conversa de chat e retornar um JSON com a análise e sugestões de respostas REAIS.

        ESTILO DE RESPOSTA DESEJADO: ${style || "equilibrado"}

        REGRAS PARA AS RESPOSTAS:
        1. Devem seguir o estilo "${style || "equilibrado"}".
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

      const parts: any[] = [{ text: prompt }];
      
      if (text && text.trim()) {
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

      const result = await ai.models.generateContent({
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

      const analysisText = result.text;
      if (!analysisText) {
        throw new Error("A IA retornou uma resposta vazia.");
      }

      res.json(JSON.parse(analysisText.trim()));
    } catch (error: any) {
      console.error("Erro na análise do Gemini:", error);
      res.status(500).json({ error: error.message || "Erro interno ao processar análise" });
    }
  });

  // Kiwify Webhook Endpoint
  apiRouter.post("/webhook/kiwify", async (req, res) => {
    console.log(req.body);
    
    const body = req.body;
    const status = body.order_status || body.status;
    const email = body.customer?.email;

    if (status === "approved" && email) {
      try {
        const db = getDb();
        if (!db) throw new Error("Firestore not available");

        // Encontrar usuário pelo email
        const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
        
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          // Ativar plano premium
          await userDoc.ref.update({
            isPremium: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`User ${email} upgraded to Premium via Kiwify (approved)`);
        } else {
          console.warn("User not found for email:", email);
        }
      } catch (error) {
        console.error("Error processing Kiwify webhook:", error);
      }
    }

    res.status(200).send("OK");
  });

  // Mount API router
  app.use("/api", apiRouter);

  // Global 404 for API routes to return JSON instead of HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});

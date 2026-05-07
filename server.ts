import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import * as admin from "firebase-admin";
import fs from "fs";

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

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebase: !!admin.apps.length });
  });

  // Kiwify Webhook Endpoint
  app.post("/api/webhook/kiwify", async (req, res) => {
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

    // Retornar 200
    res.status(200).send("OK");
  });

  // Remove the old/redundant plural endpoint if it exists to avoid confusion
  // (The previous view_file showed it, I'll replace the whole block)

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

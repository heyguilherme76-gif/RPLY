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

  // Kiwify Webhook Endpoint (Singular version requested by user)
  app.post("/api/webhook/kiwify", async (req, res) => {
    console.log("Kiwify Webhook received (singular):", req.body);
    
    const { order_status, status: body_status, customer, ext_user_id } = req.body;
    const status = order_status || body_status;
    const email = customer?.email;
    const userId = ext_user_id;

    // The user wants to activate premium if status is "approved"
    if (status === "approved") {
      try {
        const db = getDb();
        if (!db) throw new Error("Firestore not available");

        let userRef: admin.firestore.DocumentReference | null = null;

        // Try identifying by ext_user_id (uid) first if available
        if (userId) {
          userRef = db.collection("users").doc(userId);
        } else if (email) {
          // If no userId, try finding by email
          const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
          if (!userSnapshot.empty) {
            userRef = userSnapshot.docs[0].ref;
          }
        }

        if (userRef) {
          await userRef.update({
            isPremium: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`User ${userRef.id} upgraded to Premium via Kiwify (approved)`);
          return res.status(200).send("User upgraded");
        } else {
          console.warn("User not found for email:", email);
          return res.status(404).send("User not found");
        }
      } catch (error) {
        console.error("Error upgrading user:", error);
        return res.status(500).send("Internal Server Error");
      }
    }

    res.status(200).send("Webhook received (no action taken)");
  });

  // Kiwify Webhook Endpoint (Plural version - legacy)
  app.post("/api/webhooks/kiwify", async (req, res) => {
    console.log("Kiwify Webhook received:", req.body);
    
    const { order_status, ext_user_id } = req.body;
    const userId = ext_user_id;

    if (order_status === "paid" && userId) {
      try {
        const db = getDb();
        if (!db) throw new Error("Firestore not available");

        const userRef = db.collection("users").doc(userId);
        await userRef.update({
          isPremium: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`User ${userId} upgraded to Premium via Kiwify`);
        return res.status(200).send("User upgraded");
      } catch (error) {
        console.error("Error upgrading user:", error);
        return res.status(500).send("Internal Server Error");
      }
    }

    res.status(200).send("Webhook received (no action taken)");
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

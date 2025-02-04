const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Environment Variables**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config()?.app?.allowed_origins || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',') : [];

// **2. CORS Configuration**
const corsOptions = cors({
  origin: function (origin, callback) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      callback(null, true);
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

exports.setupuser = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
    }

    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Missing required fields: userId and email." });
    }

    try {
      const db = admin.firestore();
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`Creating new user entry for ${userId}...`);
        await userRef.set({
          email: email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          favorites: { players: [], teams: [] },
          language: "en",
          points: 0,
        });

        console.log(`User ${userId} setup completed.`);
      } else {
        console.log(`User ${userId} already exists.`);
      }

      return res.status(200).json({ success: true, message: "User setup completed successfully." });

    } catch (error) {
      console.error("Error setting up user:", error);
      return res.status(500).json({ error: "Failed to setup user." });
    }
  });
});

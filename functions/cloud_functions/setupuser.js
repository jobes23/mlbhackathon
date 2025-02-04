const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config().app?.allowed_origins;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

// **CORS Configuration**
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


// **3. Secure Setup User API**
exports.setupuser = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    if (req.method !== "POST") {
      console.warn(" Method Not Allowed. Only POST is accepted.");
      return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
    }

    const { userId, email } = req.body;

    if (!userId || !email) {
      console.warn("Missing required fields:", { userId, email });
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
        return res.status(201).json({ success: true, message: "User setup completed successfully." });
      } else {
        console.log(`User ${userId} already exists.`);
        return res.status(200).json({ success: true, message: "User already exists." });
      }

    } catch (error) {
      console.error("Error setting up user:", error);
      return res.status(500).json({ error: "Failed to setup user." });
    }
  });
});

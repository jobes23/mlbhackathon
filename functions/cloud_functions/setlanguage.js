const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

if (!admin.apps.length) {
  admin.initializeApp();
}

const corsOptions = cors({
  origin: function (origin, callback) {
    const allowedOrigins = functions.config().app?.allowed_origins?.split(",") || [];
    if (process.env.FUNCTIONS_EMULATOR === "true" || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

exports.setlanguage = functions.https.onRequest((req, res) => {
    corsOptions(req, res, async () => {
      try {
        const { userId, language } = req.body;
  
        if (!userId || !language) {
          return res.status(400).json({ error: "Missing userId or language." });
        }
  
        const db = admin.firestore();
        const userRef = db.collection("users").doc(userId);
  
        await userRef.set({ language }, { merge: true });
  
        return res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error updating language:", error);
        return res.status(500).json({ error: "Failed to update language." });
      }
    });
  });
  
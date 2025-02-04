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

exports.setfavorites = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    try {
      const { userId, favorites } = req.body;

      if (!userId || !favorites) {
        return res.status(400).json({ error: "Missing userId or favorites." });
      }

      const db = admin.firestore();
      const userRef = db.collection("users").doc(userId);

      await userRef.set({ favorites }, { merge: true });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error updating favorites:", error);
      return res.status(500).json({ error: "Failed to update favorites." });
    }
  });
});

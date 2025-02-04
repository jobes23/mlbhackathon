const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// **Environment Variables Handling for Allowed Origins**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config().app?.allowed_origins;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

// **CORS Configuration**
const corsOptions = cors({
  origin: function (origin, callback) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      callback(null, true); // Allow all origins in local development
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow specified origins in production
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

exports.fetchuserdata = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    const db = admin.firestore();

    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      console.log(`Fetching user data for userId: ${userId}`);

      const userRef = db.collection("users").doc(userId);
      const docSnapshot = await userRef.get();

      if (!docSnapshot.exists) {
        console.log(`No user found for userId: ${userId}`);
        return res.status(404).json({ error: "User not found." });
      }

      const userData = docSnapshot.data();

      return res.status(200).json({
        id: userId,
        username: userData.username || "Unknown",
        points: userData.points || 0,
        favorites: userData.favorites || { players: [], teams: [] },
        language: userData.language || "en",
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return res.status(500).json({ error: "Failed to fetch user data." });
    }
  });
});

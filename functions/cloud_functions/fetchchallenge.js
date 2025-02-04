const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// **Environment Variables Handling**
const allowedOriginsString = functions.config()?.app?.allowed_origins || process.env.VITE_APP_ALLOWED_ORIGINS || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];


// **CORS Configuration**
const corsOptions = cors({
  origin: function (origin, callback) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      callback(null, true); // Allow all origins when running Firebase Emulator
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow only specified origins in production
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

exports.fetchchallenge = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
    }

    const db = admin.firestore();

    try {
      const { userId, challengeId, language } = req.body;

      // Fetch all challenges if no challengeId is provided
      if (!challengeId) {
        const challengesSnapshot = await db.collection("challenges").get();
        const challengesList = challengesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json(challengesList);
      }

      // Validate request parameters
      if (!userId || !language) {
        return res.status(400).json({ error: "Missing required parameters: userId and language." });
      }

      // Fetch challenge details
      const challengeRef = db.collection("challenges").doc(challengeId);
      const challengeDoc = await challengeRef.get();

      if (!challengeDoc.exists) {
        return res.status(404).json({ error: "Challenge not found." });
      }

      const challengeData = challengeDoc.data() || {};

      // Fetch user's challenge progress
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const userChallenges = userDoc.exists ? userDoc.data()?.challenges || {} : {};

      // Prepare translated challenge response
      const translatedChallenge = {
        id: challengeId,
        name: challengeData.name?.[language] || challengeData.name?.["en"] || "Challenge",
        description: challengeData.description?.[language] || challengeData.description?.["en"] || "Complete this challenge",
        points: challengeData.points || 0,
        category: challengeData.category || "General",
        icon: challengeData.icon || "",
        status: {
          completed: userChallenges[challengeId]?.completed || false,
          redeemed: userChallenges[challengeId]?.redeemed || false,
        },
      };

      return res.status(200).json(translatedChallenge);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      return res.status(500).json({ error: "Failed to fetch challenges." });
    }
  });
});

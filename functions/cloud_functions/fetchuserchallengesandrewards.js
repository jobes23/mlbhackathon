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
  methods: ["GET", "POST", "OPTIONS"], // Ensure OPTIONS is allowed
  allowedHeaders: ["Content-Type", "Authorization"], // Explicitly allow headers
  credentials: true, // Allow cookies and credentials
});

exports.fetchuserchallengesandrewards = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    console.log("Incoming request:", req.method, req.headers, req.body); // Debugging

    if (req.method === "OPTIONS") {
      return res.status(204).send(""); // Handle CORS preflight
    }

    const db = admin.firestore();

    try {
      const { userId, language } = req.body;

      if (!userId || !language) {
        console.error("Missing userId or language in request body", req.body);
        return res.status(400).json({ error: "Missing required parameters: userId and language." });
      }

      console.log(`Fetching challenges and rewards for userId: ${userId}`);

      // Fetch challenges
      const challengesSnapshot = await db.collection("challenges").get();
      const challenges = challengesSnapshot.docs.map((doc) => {
        const challengeData = doc.data();
        return {
          id: doc.id,
          name: challengeData.name?.[language] || challengeData.name?.["en"] || "Challenge",
          description: challengeData.description?.[language] || challengeData.description?.["en"] || "Complete this challenge",
          points: challengeData.points || 0,
          icon: challengeData.icon || "",
          category: challengeData.category || "General",
        };
      });

      // Fetch rewards
      const rewardsSnapshot = await db.collection("rewards").get();
      const rewards = rewardsSnapshot.docs.map((doc) => {
        const rewardData = doc.data();
        return {
          id: doc.id,
          description: rewardData.description?.[language] || rewardData.description?.["en"] || "Earn this reward",
          cost: rewardData.cost || 0,
        };
      });

      // Fetch user's challenge progress from Firestore
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        console.log(`No user found for userId: ${userId}`);
        return res.status(404).json({ error: "User not found." });
      }

      const userData = userDoc.data();
      const userChallenges = userData.challenges || {};
      const userRewards = userData.rewards || {};

      // Mark completion status for challenges
      const userChallengesWithStatus = challenges.map((challenge) => ({
        ...challenge,
        status: {
          completed: userChallenges[challenge.id]?.completed || false,
          redeemed: userChallenges[challenge.id]?.redeemed || false,
        },
      }));

      // Add reward code to rewards
      const userRewardsWithStatus = rewards.map((reward) => ({
        ...reward,
        code: userRewards[reward.id] || "",
      }));

      return res.status(200).json({
        challenges: userChallengesWithStatus,
        rewards: userRewardsWithStatus,
      });
    } catch (error) {
      console.error("Error fetching user challenges and rewards:", error);
      return res.status(500).json({ error: "Failed to fetch user data." });
    }
  });
});

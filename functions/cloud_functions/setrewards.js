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

exports.setrewards = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    // The middleware now handles OPTIONS preflight requests

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed. Use POST instead." });
    }

    const db = admin.firestore();

    try {
      const { userId, rewardId, action } = req.body;

      if (!userId || !rewardId || !action) {
        return res.status(400).json({ error: "Missing required parameters: userId, rewardId, action." });
      }

      if (action !== "redeemed") {
        return res.status(400).json({ error: "Invalid action. Must be 'redeemed'." });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      let userData = userDoc.data();
      let userPoints = userData.points || 0;

      const rewardRef = db.collection("rewards").doc(rewardId);
      const rewardDoc = await rewardRef.get();

      if (!rewardDoc.exists) {
        return res.status(404).json({ error: "Reward not found." });
      }

      const rewardData = rewardDoc.data();
      const pointsRequired = rewardData.cost || 0;
      const rewardCode = rewardData.code || "";

      // Check if the user has enough points
      if (userPoints < pointsRequired) {
        return res.status(400).json({ error: "Not enough points to redeem this reward." });
      }

      // Deduct points
      const newPoints = userPoints - pointsRequired;

      // Ensure rewards is an object (not an array)
      let updatedRewards = userData.rewards || {};

      // Check if the reward already exists
      if (updatedRewards[rewardId]) {
        return res.status(400).json({ error: "Reward has already been redeemed." });
      }

      // Add the new reward
      updatedRewards[rewardId] = rewardCode;

      // Update user's document with new points balance and rewards object
      await userRef.update({
        points: newPoints,
        rewards: updatedRewards
      });

      return res.status(200).json({
        message: "Reward redeemed successfully.",
        rewards: updatedRewards,
      });

    } catch (error) {
      console.error("Error redeeming reward:", error);
      return res.status(500).json({ error: "Failed to redeem reward." });
    }
  });
});
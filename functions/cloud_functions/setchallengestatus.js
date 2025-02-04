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

exports.setchallengestatus = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    const db = admin.firestore();

    try {
      const { userId, challengeId, action } = req.body;

      if (!userId || !challengeId || !action) {
        return res.status(400).json({ error: "Missing required parameters: userId, challengeId, action." });
      }

      if (!["completed", "redeemed"].includes(action)) {
        return res.status(400).json({ error: "Invalid action. Must be 'completed' or 'redeemed'." });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      let userData = userDoc.data();
      let userChallenges = userData.challenges || {};

      // Ensure the challenge exists in the user's profile
      if (!userChallenges[challengeId]) {
        userChallenges[challengeId] = { completed: false, redeemed: false };
      }

      // If already completed/redeemed, exit early
      if (action === "completed" && userChallenges[challengeId].completed) {
        return res.status(200).json({ message: "Challenge already completed." });
      }
      if (action === "redeemed" && userChallenges[challengeId].redeemed) {
        return res.status(200).json({ message: "Challenge already redeemed." });
      }

      // If redeeming, add points to the user's balance
      if (action === "redeemed") {
        const challengeRef = db.collection("challenges").doc(challengeId);
        const challengeDoc = await challengeRef.get();

        if (!challengeDoc.exists) {
          return res.status(404).json({ error: "Challenge not found." });
        }

        const challengeData = challengeDoc.data();
        const pointsToAdd = challengeData.points || 0;

        // Update the user's points balance
        const newPoints = (userData.points || 0) + pointsToAdd;
        await userRef.update({ points: newPoints });

        // Update challenge status
        userChallenges[challengeId].redeemed = true;
      } else if (action === "completed") {
        // Update challenge status for completed
        userChallenges[challengeId].completed = true;
      }

      // Save updated challenges
      await userRef.update({ challenges: userChallenges });

      return res.status(200).json({ message: `Challenge ${action} successfully!` });
    } catch (error) {
      console.error("Error updating challenge status:", error);
      return res.status(500).json({ error: "Failed to update challenge status." });
    }
  });
});
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Load Allowed Origins from Firebase Config
const allowedOriginsString = functions.config().app?.allowed_origins || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

exports.syncuserchallenges = functions.https.onRequest(async (req, res) => {
  const origin = req.get("Origin");

  // Handle CORS Preflight for OPTIONS request
  if (req.method === "OPTIONS") {
    if (origin && allowedOrigins.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Max-Age", "3600"); // Cache preflight response
      return res.status(204).send(""); // No Content
    }
    return res.status(403).send("CORS Not Allowed");
  }

  // Allow CORS for matched origins in production
  if (origin && allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  } else {
    return res.status(403).json({ error: "CORS Not Allowed" });
  }

  try {
    const db = admin.firestore();
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required parameter: userId." });
    }

    // Fetch all challenges from Firestore
    const challengesSnapshot = await db.collection("challenges").get();
    const allChallenges = challengesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch user's challenge progress
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    const userChallenges = userData.challenges || {};

    // Sync user challenges
    let updatedChallenges = { ...userChallenges };
    let hasNewTasks = false;

    allChallenges.forEach((challenge) => {
      if (!updatedChallenges[challenge.id]) {
        updatedChallenges[challenge.id] = { completed: false, redeemed: false };
        hasNewTasks = true;
      }
    });

    // Update Firestore only if new challenges were added
    if (hasNewTasks) {
      await userRef.set({ challenges: updatedChallenges }, { merge: true });
    }

    return res.status(200).json({
      message: "Challenges synced successfully.",
      newTasksAdded: hasNewTasks,
    });
  } catch (error) {
    console.error("Error syncing challenges:", error);
    return res.status(500).json({ error: "Failed to sync challenges." });
  }
});

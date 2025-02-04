const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.syncuserchallenges = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const db = admin.firestore();

    try {
      const { userId } = req.body;

      if (!userId) {
        res.set("Access-Control-Allow-Origin", "*");
        return res.status(400).json({ error: "Missing required parameter: userId." });
      }

      // Fetch all challenges from Firestore
      const challengesSnapshot = await db.collection("challenges").get();
      const allChallenges = challengesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch user's progress from Firestore
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

      res.set("Access-Control-Allow-Origin", "*");
      return res.status(200).json({
        message: "Challenges synced successfully.",
        newTasksAdded: hasNewTasks,
      });
    } catch (error) {
      console.error("Error syncing challenges:", error);
      res.set("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ error: "Failed to sync challenges." });
    }
  });
});

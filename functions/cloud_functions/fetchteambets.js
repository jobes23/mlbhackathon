const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp();
}

// **Dynamic Allowed Origins Handling**
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

exports.fetchteambets = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {

    if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FUNCTIONS_EMULATOR) {
      process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8080"; // Default port 8080
      console.log(`Using Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    }
    
    const db = admin.firestore();
    try {
      const { teamName, language = "en" } = req.body;

      if (!teamName) {
        return res.status(400).json({ error: "Team name is required." });
      }

      // **Ensure Case-Insensitive Firestore Keys**
      const teamKey = 'Philadelphia Phillies';

      console.log(`🔍 Fetching bets for team: ${teamKey}, language: ${language}`);

      const betsRef = db.collection("teamBets");
      const docSnapshot = await betsRef.doc(teamKey).get();

      if (!docSnapshot.exists) {
        console.log(`⚠️ No bets found for team: ${teamKey}`);
        return res.status(200).json({ team: teamKey, bets: [] });
      }

      const data = docSnapshot.data();

      // **Ensure Bets Exist in Expected Format**
      if (!Array.isArray(data.bets)) {
        console.warn(`⚠️ Unexpected data format in Firestore for team: ${teamKey}`);
        return res.status(200).json({ team: teamKey, bets: [] });
      }

      const formattedBets = data.bets.map((bet) => {
        return {
          bet_label: bet.bet_label?.[language] || bet.bet_label?.en || "No Label",
          odds: { ...bet.odds },
        };
      });

      console.log(`✅ Found ${formattedBets.length} bets for team: ${teamKey}`);

      return res.status(200).json({ team: teamKey, bets: formattedBets });
    } catch (error) {
      console.error("❌ Error fetching team bets:", error);
      return res.status(500).json({ error: "Failed to fetch team bets." });
    }
  });
});

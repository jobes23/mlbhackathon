const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// **Fixed Environment Variables Handling**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config().app?.allowed_origins;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

// **CORS Configuration**
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

exports.getarticles = functions.https.onRequest((req, res) => {
  corsOptions(req, res, async () => {
    const db = admin.firestore();

    try {
      const { playerName, teamName, language } = req.body;

      if ((!playerName && !teamName) || !language) {
        return res.status(400).json({
          error: "You must provide either playerName or teamName along with language.",
        });
      }

      const articles = [];
      let subcollectionPath;

      // Determine which subcollection to query
      if (playerName) {
        subcollectionPath = `playerArticles/${playerName}/articles`;
      } else if (teamName) {
        subcollectionPath = `teamArticles/${teamName}/articles`;
      }

      const articlesCollectionRef = db.collection(subcollectionPath);

      // Query the subcollection
      const querySnapshot = await articlesCollectionRef.get();

      if (querySnapshot.empty) {
        console.log(`No articles found in ${subcollectionPath}`);
        return res.status(404).json([]);
      }

      // Parse and format the article data
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articles.push({
          id: doc.id,
          title: data.titles?.[language] || data.titles?.en || "No Title",
          summary: data.summary?.[language]
            ? data.summary[language].split("\n").filter((p) => p.trim() !== "")
            : [],
          link: data.link || null,
          team: data.team || null,
          published: data.published || null,
        });
      });

      return res.status(200).json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      return res.status(500).json({ error: "Failed to fetch articles." });
    }
  });
});


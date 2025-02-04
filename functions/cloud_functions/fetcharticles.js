const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");

// Initialize Firebase Admin once outside the handler
if (!admin.apps.length) {
  admin.initializeApp();
}

// **Fixed Environment Variables Handling**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config().app?.allowed_origins;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(',') : [];

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

      const articlesRef = db.collection("articles");
      let query;

      if (playerName) {
        query = articlesRef.where(`entities.${playerName}`, "==", "player");
      } else if (teamName) {
        query = articlesRef.where("team", "==", teamName);
      }

      const querySnapshot = await query.get();

      if (querySnapshot.empty) {
        console.log(
          `No articles found for ${playerName ? `player: ${playerName}` : `team: ${teamName}`}`
        );
        return res.status(200).json([]); // Return empty array
      }

      const articles = {};
      const searchKey = (playerName || teamName).toLowerCase();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(data.title); // Log the raw title structure
        const summaryEn = data.summary?.["en"];
        
        if (summaryEn) {
          const paragraphs = summaryEn.split("\n").filter((p) => p.trim() !== "");
          const searchKeyInSummary = summaryEn.toLowerCase().includes(searchKey);
          const searchKeyInLastParagraph =
            paragraphs.length > 0 ? paragraphs[paragraphs.length - 1].toLowerCase().includes(searchKey) : false;

          if (searchKeyInSummary && !searchKeyInLastParagraph) {
            let translatedKey = playerName || teamName;
            for (const entityName in data.entities) {
              if (entityName.toLowerCase() === searchKey) {
                translatedKey = entityName;
                break;
              }
            }

            let mlbLink = data.link && data.link.includes("mlb.com/news/") ? data.link : "";
            const articleTitle = data.titles?.[language] || data.titles?.en || "No Title";

            if (!articles[articleTitle] || (mlbLink && !articles[articleTitle].link)) {
              articles[articleTitle] = {
                id: doc.id,
                title: articleTitle,
                summary: data.summary?.[language]
                  ? data.summary[language].split("\n").filter((p) => p.trim() !== "")
                  : [],
                link: mlbLink,
                translatedKey,
              };
            }
          }
        }
      });

      return res.status(200).json(Object.values(articles));
    } catch (error) {
      console.error("Error fetching articles:", error);
      return res.status(500).json({ noArticles: "Failed to fetch articles." });
    }
  });
});

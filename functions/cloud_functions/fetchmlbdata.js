require("dotenv").config(); // Load environment variables
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");

if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Load Environment Variables**
const projectId = functions.config().app?.project_id || process.env.VITE_APP_PROJECT_ID
const datasetId = functions.config().app?.dataset_id || process.env.VITE_APP_DATASET_ID;
const tableId = functions.config().app?.mlb_players_table || process.env.VITE_APP_MLB_PLAYERS_TABLE;

// **2. Allowed Origins (CORS)**
const allowedOriginsString = process.env.VITE_APP_ALLOWED_ORIGINS || functions.config().app?.allowed_origins;
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];

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

// **3. BigQuery Client Initialization**
const bigquery = new BigQuery({
  projectId: projectId, // Use the project ID from environment variables
});

exports.fetchmlbdata = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    try {
      const language = req.body.language;

      // **4. Dynamic Query with Parameterized Language**
      const query = `
        SELECT 
          player_id,
          CASE 
            WHEN @language = 'en' THEN name
            WHEN @language = 'ja' THEN japanese_name
            ELSE name  -- Default to English name for es and de
          END AS name,
          CASE 
            WHEN @language = 'en' THEN team_name
            WHEN @language = 'ja' THEN japanese_team_name
            WHEN @language = 'es' THEN spanish_team_names
            WHEN @language = 'de' THEN german_team_name
          END AS team,
          CASE 
            WHEN @language = 'en' THEN english_position
            WHEN @language = 'ja' THEN japanese_position
            WHEN @language = 'es' THEN spanish_position
            WHEN @language = 'de' THEN german_position
          END AS position,
          name AS name_en
        FROM \`${projectId}.${datasetId}.${tableId}\`
      `;

      // **5. Query Parameters for Security**
      const queryOptions = {
        query: query,
        params: { language: language }, // Pass language as a parameter
      };

      const [rows] = await bigquery.query(queryOptions);

      const players_data = rows.map((row) => ({
        player_id: row.player_id,
        name: row.name,
        team: row.team,
        position: row.position,
        name_en: row.name_en,
      }));

      res.status(200).json({ players: players_data });
    } catch (error) {
      console.error("Error fetching player data:", error);
      return res.status(500).json({ error: "Failed to fetch player data." });
    }
  });
});

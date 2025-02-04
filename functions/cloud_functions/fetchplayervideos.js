const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");

if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Environment Variables**
const projectId = functions.config().app?.project_id || process.env.VITE_APP_PROJECT_ID
const datasetId = functions.config()?.app?.dataset_id || process.env.VITE_APP_DATASET_ID;
const tableTeams = functions.config()?.app?.mlb_teams_table || process.env.VITE_APP_MLB_TEAMS_TABLE;
const tablePlayers = functions.config()?.app?.mlb_players_table || process.env.VITE_APP_MLB_PLAYERS_TABLE;
const tablePlayerVideos =  functions.config()?.app?.mlb_player_home_runs_table || process.env.VITE_APP_MLB_PLAYER_HOME_RUNS_TABLE;
const allowedOriginsString = functions.config()?.app?.allowed_origins || process.env.VITE_APP_ALLOWED_ORIGINS || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];


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

// **3. BigQuery Client**
const bigquery = new BigQuery({
  projectId: projectId,
});

exports.fetchplayervideos = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    try {
      const { player_id, team_id, language } = req.body;

      // Validate Inputs
      if ((!player_id && !team_id) || (player_id && team_id)) {
        // No need to set headers manually, cors handles it
        return res.status(400).json({ error: "Provide either player_id or team_id, but not both." });
      }

      if (player_id && !Number.isInteger(player_id)) {
        // No need to set headers manually, cors handles it
        return res.status(400).json({ error: "Valid player_id is required." });
      }

      if (team_id && !Number.isInteger(team_id)) {
        // No need to set headers manually, cors handles it
        return res.status(400).json({ error: "Valid team_id is required." });
      }

      if (!language || !["en", "ja", "es", "de"].includes(language)) {
        // No need to set headers manually, cors handles it
        return res.status(400).json({ error: "Valid language is required." });
      }

      let query;
      let params;

      // Define Queries
      if (player_id) {
        query = `
          SELECT 
            CASE 
              WHEN @language = 'ja' THEN ja_translation_ssml
              WHEN @language = 'es' THEN es_translation_ssml
              ELSE transcription
            END AS transcription, 
            CASE 
              WHEN @language = 'ja' THEN ja_title
              WHEN @language = 'es' THEN es_title
              ELSE title
            END AS title,
            video_url, totalDistance, hitCordinatesX, hitCordinatesY
          FROM \`${projectId}.${datasetId}.${tablePlayerVideos}\`
          WHERE player_id = @player_id;
        `;
        params = { player_id, language };
      } else if (team_id) {
        query = `
          SELECT 
            CASE 
              WHEN @language = 'ja' THEN ja_translation_ssml
              WHEN @language = 'es' THEN es_translation_ssml
              ELSE transcription
            END AS transcription,
            CASE 
              WHEN @language = 'ja' THEN ja_title
              WHEN @language = 'es' THEN es_title
              ELSE title
            END AS title,
            video_url, totalDistance, hitCordinatesX, hitCordinatesY
          FROM \`${projectId}.${datasetId}.${tableTeams}\` mt
          JOIN \`${projectId}.${datasetId}.${tablePlayers}\` mp
          ON mt.team_name = mp.team_name
          JOIN \`${projectId}.${datasetId}.${tablePlayerVideos}\` mpv
          ON mp.player_id = mpv.player_id
          WHERE mt.team_id = @team_id;
        `;
        params = { team_id, language };
      }

      // Execute the Query
      const options = {
        query,
        params,
        location: "US", // Make sure this matches your BQ dataset location
      };

      const [rows] = await bigquery.query(options);

      // Handle No Results
      if (!rows.length) {
        // No need to set headers manually, cors handles it
        return res.status(200).json({ results: [] }); // Return empty array
      }

      // Return the Results
      return res.status(200).json({ results: rows });

    } catch (error) {
      console.error(`Error fetching data:`, error);
      // No need to set headers manually, cors handles it
      return res.status(500).json({ error: "Failed to fetch data." });
    }
  });
});
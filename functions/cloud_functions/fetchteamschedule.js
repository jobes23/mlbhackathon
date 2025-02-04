const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");

if (process.env.FUNCTIONS_EMULATOR) {
  require("dotenv").config();
}

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Environment Variables Handling**
const projectId = functions.config().app?.project_id || process.env.VITE_APP_PROJECT_ID
const datasetId = functions.config()?.app?.dataset_id || process.env.VITE_APP_DATASET_ID;
const tableGameData = functions.config()?.app?.mlb_game_data_table || process.env.VITE_APP_MLB_GAME_DATA_TABLE;
const tableTeams = functions.config()?.app?.mlb_teams_table || process.env.VITE_APP_MLB_TEAMS_TABLE;
const tableTeamStatsGame = functions.config()?.app?.mlb_team_stats_game_table || process.env.VITE_APP_MLB_TEAM_STATS_GAME_TABLE;
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

exports.fetchteamschedule = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    // No need to manually set CORS headers; the middleware handles it

    try {
      const { teamId, year, language, seasonType } = req.body;

      if (!teamId || !year || !language || !seasonType) {
        return res.status(400).json({ error: "teamId, year, language, and seasonType are required." });
      }

      // Determine the correct team name column
      const teamNameColumn = {
        ja: "ja_team_name",
        es: "es_team_name",
        en: "team_name",
      }[language] || "team_name";

      // Define season type filter
      let seasonFilter = "";
      if (seasonType === "spring-training") {
        seasonFilter = "mgd.game_type IN ('S', 'Spring Training')";
      } else if (seasonType === "regular-season") {
        seasonFilter = "mgd.game_type IN ('R', 'Regular Season')";
      } else if (seasonType === "postseason") {
        seasonFilter = `mgd.game_type IN ('World Series', 'Wild Card Game', 'Division Series', 'League Championship Series')`;
      }

      // Construct the query
      const query = `
        SELECT 
          mgd.game_pk,
          game_date,
          CASE
            WHEN @language = 'ja' THEN CONCAT(
              SUBSTR('日月火水木金土', EXTRACT(DAYOFWEEK FROM mgd.game_date), 1),
              '曜日, ',
              CAST(EXTRACT(MONTH FROM mgd.game_date) AS STRING),
              '月',
              CAST(EXTRACT(DAY FROM mgd.game_date) AS STRING),
              '日'
            )
            WHEN @language = 'es' THEN INITCAP(
              FORMAT_DATE('%A, %d de %B', mgd.game_date)
            )
            ELSE FORMAT_DATE('%a, %b %d', mgd.game_date)
          END AS game_date_formatted,
          mgd.home_team_id,
          mgd.away_team_id,
          ht.${teamNameColumn} AS home_team_name,
          ats.${teamNameColumn} AS away_team_name,
          mgd.home_score,
          mgd.away_score,
          mgd.game_type,
          htmtsg.bat_hits home_team_hits,
          htmtsg.fld_errors home_team_errors,
          atmtsg.bat_hits away_team_hits,
          atmtsg.fld_errors away_team_errors,
          game_date < CURRENT_DATETIME() isCompleted
        FROM \`${projectId}.${datasetId}.${tableGameData}\` mgd
        JOIN \`${projectId}.${datasetId}.${tableTeams}\` ht
          ON mgd.home_team_id = ht.team_id
        JOIN \`${projectId}.${datasetId}.${tableTeams}\` ats
          ON mgd.away_team_id = ats.team_id
        LEFT JOIN \`${projectId}.${datasetId}.${tableTeamStatsGame}\` htmtsg
          ON mgd.game_pk = htmtsg.game_pk AND mgd.home_team_id = htmtsg.team_id
        LEFT JOIN \`${projectId}.${datasetId}.${tableTeamStatsGame}\` atmtsg
          ON mgd.game_pk = atmtsg.game_pk AND mgd.away_team_id = atmtsg.team_id
        WHERE (mgd.home_team_id = @teamId OR mgd.away_team_id = @teamId)
          AND EXTRACT(YEAR FROM mgd.game_date) = @year
          AND ${seasonFilter}
        ORDER BY mgd.game_date ASC
      `;

      const options = {
        query: query,
        params: { teamId, year, language },
      };

      // Execute the query
      const [rows] = await bigquery.query(options);

      if (!rows.length) {
        return res.status(404).json({ error: "No games found for the specified filters." });
      }

      // Convert game_date to local time and add additional flags
      const now = new Date();
      const convertedRows = rows.map((row) => ({
        ...row,
      }));

      // Send response
      return res.status(200).json({ games: convertedRows });

    } catch (error) {
      console.error("Error fetching game schedule:", error);
      return res.status(500).json({ error: "Failed to fetch game schedule." });
    }
  });
});
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const { BigQuery } = require("@google-cloud/bigquery");

if (!admin.apps.length) {
  admin.initializeApp();
}

// **1. Environment Variables Handling**
const projectId = functions.config().app?.project_id || process.env.VITE_APP_PROJECT_ID
const datasetId = functions.config()?.app?.dataset_id || process.env.VITE_APP_DATASET_ID;
const tableTeamStats = functions.config()?.app?.mlb_team_stats_table || process.env.VITE_APP_MLB_TEAM_STATS_TABLE;
const tableGameData = functions.config()?.app?.mlb_game_data_table || process.env.VITE_APP_MLB_GAME_DATA_TABLE;
const tableTeams = functions.config()?.app?.mlb_teams_table || process.env.VITE_APP_MLB_TEAMS_TABLE;
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

exports.fetchteamstatsgame = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    // No need to manually set CORS headers

    try {
      const { team_name, language } = req.body;

      if (!team_name) {
        return res.status(400).json({ error: "A team_name is required." });
      }

      // Define language-based team name selection
      const languageColumn = {
        ja: "mt.ja_team_name",
        es: "mt.es_team_name",
        en: "mt.team_name",
      }[language] || "mt.team_name";

      // Construct the query
      const query = `
        SELECT 
          CASE WHEN mgd.game_type = 'R' THEN 'Regular Season' ELSE game_type END game_type, 
          mgd.game_date, 
          ${languageColumn} AS opponent,
          mgd.away_score, 
          mgd.home_score, 
          bat_hits, bat_homeRuns, bat_doubles, bat_triples, bat_baseOnBalls, bat_stolenBases,
          bat_strikeOuts, bat_obp, bat_slg, bat_ops, bat_totalBases, bat_rbi, bat_leftOnBase,
          pit_strikeOuts, pit_baseOnBalls, pit_hits, pit_doubles, pit_triples, pit_homeRuns, 
          pit_era, pit_hitByPitch,pit_stolenBases, pit_pitchesThrown, pit_hitBatsmen, pit_pickoffs,
          fld_caughtStealing, fld_assists, fld_putOuts, fld_errors, fld_chances
        FROM \`${projectId}.${datasetId}.${tableTeamStats}\` mtsbg
        JOIN \`${projectId}.${datasetId}.${tableGameData}\` mgd
          ON mtsbg.game_pk = mgd.game_pk
        JOIN \`${projectId}.${datasetId}.${tableTeams}\` mt
          ON CASE 
            WHEN mtsbg.is_home = TRUE THEN mgd.away_team_id = mt.team_id 
            ELSE mgd.home_team_id = mt.team_id 
          END
        WHERE mtsbg.team_name = @team_name AND game_type NOT IN ('Exhibition', 'Spring Training')
        ORDER BY mgd.game_date ASC
      `;

      const options = {
        query: query,
        params: { team_name },
      };

      // Execute the BigQuery query
      const [rows] = await bigquery.query(options);

      if (!rows.length) {
        return res.status(404).json({ error: "No data found for this team." });
      }

      // Send response
      return res.status(200).json({ rows });

    } catch (error) {
      console.error("Error fetching team stats:", error);
      return res.status(500).json({ error: "Failed to fetch team stats." });
    }
  });
});
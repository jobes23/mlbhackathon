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
const mlb_players_table = functions.config()?.app?.mlb_players_table || process.env.VITE_APP_MLB_PLAYERS_TABLE;
const mlb_players_stats_table = functions.config()?.app?.mlb_players_stats_table || process.env.VITE_APP_MLB_PLAYERS_STATS_TABLE;
const mlb_top_four_stats_table = functions.config()?.app?.mlb_top_four_stats_table || process.env.VITE_APP_MLB_TOP_FOUR_STATS_TABLE;
const mlb_player_stats_game_table = functions.config()?.app?.mlb_player_stats_game_table || process.env.VITE_APP_MLB_PLAYER_STATS_GAME_TABLE;
const mlb_game_data_table = functions.config()?.app?.mlb_game_data_table || process.env.VITE_APP_MLB_GAME_DATA_TABLE;
const mlb_teams_table = functions.config()?.app?.mlb_teams_table || process.env.VITE_APP_MLB_TEAMS_TABLE;
const allowedOriginsString = functions.config()?.app?.allowed_origins || process.env.VITE_APP_ALLOWED_ORIGINS || "";
const allowedOrigins = allowedOriginsString ? allowedOriginsString.split(",") : [];


// **2. CORS Configuration**
const corsOptions = cors({
  origin: function (origin, callback) {
    if (process.env.FUNCTIONS_EMULATOR === "true") {
      callback(null, true); // Allow all origins in development (emulator)
    } else if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow only specified origins in production
    } else {
      callback(new Error("CORS Not Allowed"));
    }
  },
});

// **3. BigQuery Client**
const bigquery = new BigQuery({
  projectId: projectId,
});

exports.fetchplayerstats = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    try {
      const { player_id, game_pk, language, statType } = req.body;

      // Validate inputs
      if (!language || !["en", "ja", "es"].includes(language)) {
        return res.status(400).json({ error: "Valid language is required." });
      }

      let query = "";
      let params = {};

      if (game_pk) {
        // Fetch all player stats for a specific game
        query = `
            SELECT 
                mpsbg.player_id,
                CASE 
                    WHEN @language = 'ja' THEN japanese_name
                    ELSE name
                END AS player_name,
                mp.team_name,
                batting hitting,
                pitching,
                team_id
            FROM \`${projectId}.${datasetId}.${mlb_player_stats_game_table}\` mpsbg
            JOIN \`${projectId}.${datasetId}.${mlb_players_table}\` mp
                ON mpsbg.player_id = mp.player_id
            JOIN \`${projectId}.${datasetId}.${mlb_teams_table}\` mt
                ON mpsbg.team = mt.team_name
            WHERE mpsbg.game_pk = @game_pk
            ORDER BY hitting, player_name
          `;
        params = { game_pk, language };
      } else if (player_id) {
        // Normalize player_id to always be an array
        const normalizedPlayerId = Array.isArray(player_id) ? player_id : [player_id];

        if (statType === "top_4_stats") {
          query = `
              SELECT 
                  mp.player_id,
                  CASE 
                      WHEN @language = 'ja' THEN japanese_name
                      ELSE name
                  END AS player_name,
                  name AS player_name_en,
                  CASE 
                      WHEN @language = 'en' THEN team_name
                      WHEN @language = 'ja' THEN japanese_team_name
                      WHEN @language = 'es' THEN spanish_team_names
                      ELSE team_name
                  END AS team,
                  top_4_stats,
                  ARRAY_AGG(
                      CASE 
                          WHEN pitching = '{}' THEN JSON_EXTRACT_SCALAR(batting, '$.summary')
                          ELSE JSON_EXTRACT_SCALAR(pitching, '$.summary')
                      END 
                      ORDER BY game_date DESC
                  )[OFFSET(0)] AS last_game_summary
              FROM 
                  \`${projectId}.${datasetId}.${mlb_players_table}\` mp
              JOIN 
                  \`${projectId}.${datasetId}.${mlb_top_four_stats_table}\` ptfs
              ON 
                  mp.player_id = ptfs.player_id
              LEFT JOIN 
                  \`${projectId}.${datasetId}.${mlb_player_stats_game_table}\` mpsbg
              ON 
                  mp.player_id = mpsbg.player_id
              LEFT JOIN 
                  \`${projectId}.${datasetId}.${mlb_game_data_table}\` mgd
              ON 
                  mpsbg.game_pk = mgd.game_pk
              WHERE 
                  mp.player_id IN UNNEST(@player_id)
              GROUP BY 
                  mp.player_id, player_name, player_name_en, team, top_4_stats
            `;
        } else {
            query = `
            SELECT 
                season,
                mps.gamesPlayed,
                mps.runs,
                mps.hits,
                baseOnBalls,
                -- Dynamic stats based on position
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.wins
                    ELSE NULL
                END AS wins,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.losses
                    ELSE NULL
                END AS losses,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.winPercentage
                    ELSE NULL
                END AS winPercentage,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.era
                    ELSE NULL
                END AS era,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.whip
                    ELSE NULL
                END AS whip,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.inningsPitched
                    ELSE NULL
                END AS inningsPitched,
                CASE 
                    WHEN mp.position = 'Baseball Pitcher' THEN mps.strikeOuts
                    ELSE NULL
                END AS strikeOuts,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.atBats
                    ELSE NULL
                END AS atBats,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.avg
                    ELSE NULL
                END AS avg,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.doubles
                    ELSE NULL
                END AS doubles,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.triples
                    ELSE NULL
                END AS triples,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.homeruns
                    ELSE NULL
                END AS homeruns,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.rbi
                    ELSE NULL
                END AS rbi,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.hitByPitch
                    ELSE NULL
                END AS hitByPitch,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.stolenBases
                    ELSE NULL
                END AS stolenBases,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.caughtStealing
                    ELSE NULL
                END AS caughtStealing,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.obp
                    ELSE NULL
                END AS obp,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.slg
                    ELSE NULL
                END AS slg,
                CASE 
                    WHEN mp.position != 'Baseball Pitcher' THEN mps.ops
                    ELSE NULL
                END AS ops
            FROM 
                \`${projectId}.${datasetId}.${mlb_players_table}\` mp
            JOIN 
                \`${projectId}.${datasetId}.${mlb_players_stats_table}\` mps
            ON 
                mp.player_id = mps.player_id
            WHERE 
                mp.player_id IN UNNEST(@player_id)
            ORDER BY season DESC
          `;
      }
      params = { player_id: normalizedPlayerId, language };
      } else {
        return res.status(400).json({ error: "Either player_id or game_pk must be provided." });
      }

      // Execute the query
      const options = {
        query,
        params,
      };

      const [rows] = await bigquery.query(options);

      if (!rows.length) {
        return res.status(404).json({ error: `No data found.` });
      }

      // Return the result
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json({ data: rows });
    } catch (error) {
      console.error(`Error fetching data:`, error.message);
      return res.status(500).json({ error: "Failed to fetch data." });
    }
  });
});

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
const tableTeams = functions.config()?.app?.mlb_teams_table || process.env.VITE_APP_MLB_TEAMS_TABLE;
const tableTeamStats = functions.config()?.app?.mlb_team_stats_table || process.env.VITE_APP_MLB_TEAM_STATS_TABLE;
const tableTeamGameLogs = functions.config()?.app?.mlb_game_data_table || process.env.VITE_APP_MLB_GAME_DATA_TABLE;
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

exports.fetchteamstats = functions.https.onRequest(async (req, res) => {
  corsOptions(req, res, async () => {
    try {
      const { team_ids: teamIds, language } = req.body;
      let { stats } = req.body;

      if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
        return res.status(400).json({ error: "An array of team_ids is required." });
      }

      if (!Array.isArray(stats) || stats.length === 0) {
        stats = ["win_loss", "division_win_loss", "hitting_homeruns", "hitting_runs"];
      }

      const languageColumn = {
        ja: "mt.ja_team_name",
        es: "mt.es_team_name",
        de: "mt.de_team_name",
        en: "mt.team_name",
      }[language] || "mt.team_name";

      const baseColumns = ["mt.team_id", `${languageColumn} AS team_name`, "mt.team_name as team_name_en"];
      const validStats = [
        "year", "team_id", "team", "games", "home_games",
        "wins", "losses", "runs", "doubles", "triples",
        "home_runs", "strikeouts", "base_on_balls", "hits",
        "era", "innings_pitched", "saves", "opponent_home_runs",
        "opponent_strikeouts", "opponent_base_on_balls", "opponent_hits",
        "win_loss", "division_win_loss", "pitching_runs", "hitting_runs", "hitting_homeruns",
      ];

      const dynamicColumns = stats
        .filter((stat) => validStats.includes(stat))
        .map((stat) => `mts.${stat}`)
        .join(", ");

      const teamStatsQuery = `
        SELECT ${baseColumns.join(", ")}, ${dynamicColumns}
        FROM \`${projectId}.${datasetId}.${tableTeams}\` mt
        JOIN \`${projectId}.${datasetId}.${tableTeamStats}\` mts
        ON mt.team_id = mts.team_id
        WHERE mt.team_id IN UNNEST(@teamIds)
      `;

      const gameLogQuery = `
        WITH last_game AS (
          SELECT 
            gl.game_pk, 
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team_id
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team_id
            END AS team_id,
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team
            END AS team_name,
            ${languageColumn} AS opponent_name,
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN 'Home'
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN 'Away'
            END AS location,
            gl.game_date,
            CASE
              WHEN @language = 'ja' THEN FORMAT_DATE('%m月%d日', gl.game_date)
              WHEN @language = 'es' THEN FORMAT_DATE('%d de %b', gl.game_date)
              WHEN @language = 'de' THEN FORMAT_DATE('%d. %b', gl.game_date)
              ELSE FORMAT_DATE('%b %d', gl.game_date)
            END AS game_date_formatted,
            gl.home_score,
            gl.away_score,
            'last_game' AS game_status,
            ROW_NUMBER() OVER (
              PARTITION BY 
                CASE
                  WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team_id
                  WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team_id
                END
              ORDER BY gl.game_date DESC
            ) AS rank
          FROM \`${projectId}.${datasetId}.${tableTeamGameLogs}\` gl
          JOIN \`${projectId}.${datasetId}.${tableTeams}\` mt
          ON CASE
            WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.away_team
            WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.home_team
          END = mt.team_name
          WHERE gl.game_date <= CURRENT_DATE()
            AND (gl.home_team_id IN UNNEST(@teamIds) OR gl.away_team_id IN UNNEST(@teamIds))
        ),
        next_game AS (
          SELECT 
            gl.game_pk, 
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team_id
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team_id
            END AS team_id,
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team
            END AS team_name,
            ${languageColumn} AS opponent_name,
            CASE
              WHEN gl.home_team_id IN UNNEST(@teamIds) THEN 'Home'
              WHEN gl.away_team_id IN UNNEST(@teamIds) THEN 'Away'
            END AS location,
            gl.game_date,
            CASE
              WHEN @language = 'ja' THEN FORMAT_DATE('%m月%d日', gl.game_date)
              WHEN @language = 'es' THEN FORMAT_DATE('%d de %b', gl.game_date)
              WHEN @language = 'de' THEN FORMAT_DATE('%d. %b', gl.game_date)
              ELSE FORMAT_DATE('%b %d', gl.game_date)
            END AS game_date_formatted,
            gl.home_score,
            gl.away_score,
            'next_game' AS game_status,
            ROW_NUMBER() OVER (
              PARTITION BY 
                CASE
                  WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.home_team_id
                  WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.away_team_id
                END
              ORDER BY gl.game_date ASC
            ) AS rank
          FROM \`${projectId}.${datasetId}.${tableTeamGameLogs}\` gl
          JOIN \`${projectId}.${datasetId}.${tableTeams}\` mt
          ON CASE
            WHEN gl.home_team_id IN UNNEST(@teamIds) THEN gl.away_team
            WHEN gl.away_team_id IN UNNEST(@teamIds) THEN gl.home_team
          END = mt.team_name
          WHERE gl.game_date > CURRENT_DATE()
            AND (gl.home_team_id IN UNNEST(@teamIds) OR gl.away_team_id IN UNNEST(@teamIds))
        )
        SELECT * FROM last_game WHERE rank = 1
        UNION ALL
        SELECT * FROM next_game WHERE rank = 1;
      `;

      const [teamStatsRows] = await bigquery.query({
        query: teamStatsQuery,
        params: { teamIds },
      });

      const [gameLogRows] = await bigquery.query({
        query: gameLogQuery,
        params: { teamIds, language },
      });

      const translations = {
        en: { won: "Won", lost: "Lost", vs: "vs.", at: "@", no_data: "No last game data." },
        es: { won: "Ganado", lost: "Perdido", vs: "vs.", at: "@", no_data: "Sin datos del último juego." },
        ja: { won: "勝ち", lost: "負け", vs: "対", at: "@", no_data: "最後の試合データなし。" },
      };

      const lang = language in translations ? language : "en";
      const { won, lost, vs, at, no_data } = translations[lang];

      const responseData = teamStatsRows.map((team) => {
        const teamId = team.team_id;
        const lastGame = gameLogRows.find((row) => row.team_id === teamId && row.game_status === "last_game");
        const nextGame = gameLogRows.find((row) => row.team_id === teamId && row.game_status === "next_game");

        return {
          team_id: teamId,
          team_name: team.team_name,
          team_name_en: team.team_name_en,
          stats: stats.reduce((obj, stat) => {
            obj[stat] = team[stat] || null;
            return obj;
          }, {}),
          last_game: lastGame
          ? `${
              (lastGame.location === "Home" && lastGame.home_score > lastGame.away_score) ||
              (lastGame.location === "Away" && lastGame.away_score > lastGame.home_score)
                ? won
                : lost
            }. ${Math.max(lastGame.home_score, lastGame.away_score)}-${Math.min(lastGame.home_score, lastGame.away_score)} ${
              lastGame.location === "Home" ? vs : at
            } ${lastGame.opponent_name}`
          : no_data,

          next_game: nextGame && nextGame.game_date
            ? `${nextGame.game_date_formatted} - ${nextGame.location === "Home" ? vs : at} ${nextGame.opponent_name}`
            : "No next game scheduled.",
        };
      });

      return res.status(200).json({ teams: responseData });
    } catch (error) {
      console.error("Error fetching team stats:", error);
      return res.status(500).json({ error: "Failed to fetch team stats." });
    }
  });
});
import google.auth
from google.cloud import bigquery
import requests
import time

# Authenticate using gcloud CLI login
project_id = "mlbhackathon-445616"
bq_client = bigquery.Client(project=project_id)

# BigQuery Dataset & Table Details
dataset_id = "mlbplayerstats"
game_table = "mlbgamedata"
stats_table = "mlbteamstatsbygame"
game_data_table = f"{project_id}.{dataset_id}.{game_table}"
stats_table_full = f"{project_id}.{dataset_id}.{stats_table}"

# API Endpoint for team stats
TEAM_STATS_API = "https://statsapi.mlb.com/api/v1/game/{game_pk}/boxscore"

def create_table_if_not_exists():
    """Creates the `mlbteamstatsbygame` table in BigQuery if it doesn't exist."""
    print("Checking if table exists...")

    schema = [
        bigquery.SchemaField("game_pk", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("team_id", "INTEGER", mode="REQUIRED"),
        bigquery.SchemaField("team_name", "STRING", mode="REQUIRED"),
        bigquery.SchemaField("is_home", "BOOLEAN", mode="REQUIRED"),
    ]

    # Define categories with stat prefixes
    categories = {
        "batting": "bat_",
        "pitching": "pit_",
        "fielding": "fld_"
    }

    stats_list = {
        "batting": [
            "flyOuts", "groundOuts", "airOuts", "runs", "doubles", "triples", "homeRuns",
            "strikeOuts", "baseOnBalls", "intentionalWalks", "hits", "hitByPitch", "avg",
            "atBats", "obp", "slg", "ops", "caughtStealing", "stolenBases", "stolenBasePercentage",
            "groundIntoDoublePlay", "groundIntoTriplePlay", "plateAppearances", "totalBases",
            "rbi", "leftOnBase", "sacBunts", "sacFlies", "catchersInterference", "pickoffs",
            "atBatsPerHomeRun", "popOuts", "lineOuts"
        ],
        "pitching": [
            "flyOuts", "groundOuts", "airOuts", "runs", "doubles", "triples", "homeRuns",
            "strikeOuts", "baseOnBalls", "intentionalWalks", "hits", "hitByPitch", "atBats",
            "obp", "caughtStealing", "stolenBases", "stolenBasePercentage", "numberOfPitches",
            "era", "inningsPitched", "saveOpportunities", "earnedRuns", "whip", "battersFaced",
            "outs", "completeGames", "shutouts", "pitchesThrown", "balls", "strikes",
            "strikePercentage", "hitBatsmen", "balks", "wildPitches", "pickoffs",
            "groundOutsToAirouts", "rbi", "pitchesPerInning", "runsScoredPer9", "homeRunsPer9",
            "inheritedRunners", "inheritedRunnersScored", "catchersInterference", "sacBunts",
            "sacFlies", "passedBall", "popOuts", "lineOuts"
        ],
        "fielding": [
            "caughtStealing", "stolenBases", "stolenBasePercentage", "assists", "putOuts",
            "errors", "chances", "passedBall", "pickoffs"
        ]
    }

    for category, prefix in categories.items():
        for stat in stats_list[category]:
            schema.append(bigquery.SchemaField(f"{prefix}{stat}", "FLOAT"))

    table_ref = bq_client.dataset(dataset_id).table(stats_table)

    try:
        bq_client.get_table(table_ref)  
        print(f"Table {stats_table_full} already exists.")
    except Exception:
        print(f"Creating table {stats_table_full}...")
        table = bigquery.Table(table_ref, schema=schema)
        bq_client.create_table(table)
        print(f"Table {stats_table_full} created successfully.")

def fetch_game_pks():
    """Fetches game_pks from BigQuery (mlbgamedata table)."""
    print("Fetching game_pks from BigQuery...")
    query = f"SELECT DISTINCT game_pk FROM `{game_data_table}` WHERE game_date < '2025-01-01'"
    query_job = bq_client.query(query)
    
    game_pks = [row.game_pk for row in query_job]
    print(f"Found {len(game_pks)} games to process.")
    return game_pks

def fetch_team_stats(game_pk):
    """Fetches team stats for a specific game."""
    url = TEAM_STATS_API.format(game_pk=game_pk)
    print(f"Fetching stats for game {game_pk}...")

    retries = 3
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Error fetching stats for game {game_pk}: {e}. Retrying ({attempt+1}/{retries})...")
            time.sleep(2)

    print(f"Failed to fetch stats for game {game_pk} after {retries} attempts.")
    return None

def format_stats(game_pk, team_data, is_home):
    """Formats team stats with correct prefixes and structure."""
    team = team_data['team']
    stats = team_data['teamStats']

    formatted_data = {
        "game_pk": game_pk,
        "team_id": team["id"],
        "team_name": team["name"],
        "is_home": is_home
    }

    for category, prefix in {"batting": "bat_", "pitching": "pit_", "fielding": "fld_"}.items():
        if category in stats:
            for stat, value in stats[category].items():
                try:
                    formatted_data[f"{prefix}{stat}"] = float(value) if value not in ["-", ".---"] else None
                except ValueError:
                    formatted_data[f"{prefix}{stat}"] = None  

    return formatted_data

def store_game_stats_in_bigquery(game_stats):
    """Inserts stats for a single game into BigQuery."""
    print(f"Inserting stats for game {game_stats[0]['game_pk']}...")

    retries = 3
    for attempt in range(retries):
        try:
            errors = bq_client.insert_rows_json(stats_table_full, game_stats, timeout=120)
            if not errors:
                print(f"Successfully inserted stats for game {game_stats[0]['game_pk']}.")
                return
            print(f"BigQuery Insert Errors: {errors}")
        except Exception as e:
            print(f"Error inserting stats for game {game_stats[0]['game_pk']}: {e}. Retrying ({attempt+1}/{retries})...")
            time.sleep(2)

    print(f"Failed to insert stats for game {game_stats[0]['game_pk']} after {retries} attempts.")

def main():
    print("Starting script...")
    create_table_if_not_exists()

    game_pks = fetch_game_pks()
    if not game_pks:
        print("No game_pks found. Exiting.")
        return

    for game_pk in game_pks:
        game_stats = fetch_team_stats(game_pk)
        if not game_stats:
            continue
        
        home_team_stats = format_stats(game_pk, game_stats["teams"]["home"], is_home=True)
        away_team_stats = format_stats(game_pk, game_stats["teams"]["away"], is_home=False)

        store_game_stats_in_bigquery([home_team_stats, away_team_stats])

if __name__ == "__main__":
    main()

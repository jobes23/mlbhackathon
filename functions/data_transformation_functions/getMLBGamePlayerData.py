from google.cloud import bigquery
import requests
import json

# BigQuery client setup
client = bigquery.Client()

# BigQuery table details
GAME_TABLE_ID = "mlbhackathon-445616.mlbplayerstats.mlbgamedata"
PLAYER_TABLE_ID = "mlbhackathon-445616.mlbplayerstats.staging_mlbplayerstatsbygame"

def get_unprocessed_game_pks():
    """Retrieve game_pk values for unprocessed games from BigQuery."""
    query = f"""
    SELECT game_pk
    FROM `{GAME_TABLE_ID}`
    WHERE processed = FALSE
    """
    query_job = client.query(query)
    return [row["game_pk"] for row in query_job]  # BigQuery returns INT64 directly

def fetch_player_stats(game_pk):
    """Fetch player stats for the given game_pk."""
    url = f"https://statsapi.mlb.com/api/v1/game/{game_pk}/boxscore"
    response = requests.get(url)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch boxscore for gamePk {game_pk}: {response.status_code}")
    return response.json()

def parse_player_stats(game_pk, data):
    """Parse player stats from the boxscore."""
    player_stats = []
    teams = ["home", "away"]
    for team in teams:
        team_data = data["teams"][team]
        team_name = team_data["team"]["name"]
        players = team_data["players"]
        for player_id, player_data in players.items():
            person = player_data["person"]
            stats = player_data.get("stats", {})
            batting = stats.get("batting", {})
            pitching = stats.get("pitching", {})
            player_stats.append({
                "game_pk": game_pk,
                "team": team_name,
                "player_id": person["id"],
                "player_name": person["fullName"],
                "position": player_data["position"]["name"],
                "batting": json.dumps(batting),  # Serialize to JSON string
                "pitching": json.dumps(pitching),  # Serialize to JSON string
            })
    return player_stats

def store_player_stats_in_bigquery(player_stats):
    """Insert player stats into BigQuery."""
    errors = client.insert_rows_json(PLAYER_TABLE_ID, player_stats)
    if errors:
        raise Exception(f"Failed to insert player stats: {errors}")
    print(f"Inserted {len(player_stats)} player stats into BigQuery.")

def mark_game_as_processed(game_pk):
    """Update the processed status for a game in BigQuery."""
    query = f"""
    UPDATE `{GAME_TABLE_ID}`
    SET processed = TRUE
    WHERE game_pk = {game_pk}  -- No single quotes for INT64
    """
    query_job = client.query(query)
    query_job.result()  # Wait for the query to complete
    print(f"Marked game_pk {game_pk} as processed.")


def main():
    try:
        # Get unprocessed game_pks
        game_pks = get_unprocessed_game_pks()
        if not game_pks:
            print("No unprocessed games found.")
            return

        for game_pk in game_pks:
            print(f"Processing game_pk: {game_pk}")
            try:
                # Fetch boxscore data
                data = fetch_player_stats(game_pk)
                
                # Parse player stats
                player_stats = parse_player_stats(game_pk, data)
                
                # Store player stats in BigQuery
                store_player_stats_in_bigquery(player_stats)
                
                # Mark the game as processed
                mark_game_as_processed(game_pk)
            except Exception as e:
                print(f"Error processing game {game_pk}: {e}")
    except Exception as e:
        print(f"Error retrieving game_pks: {e}")

if __name__ == "__main__":
    main()

import requests
from google.cloud import bigquery
from google.api_core.retry import Retry

def fetch_games_data(api_url):
    """Fetch games data from the given API URL."""
    response = requests.get(api_url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch data: {response.status_code}")
        return None

def process_game_data(game):
    """Process a single game entry and extract required fields."""
    
    return {
        "game_pk": game.get("gamePk"),
        "game_date": game.get("gameDate").split("T")[0],
        "game_type": game.get("gameType"),
        "home_team": game["teams"]["home"]["team"]["name"],
        "home_team_id": game["teams"]["home"]["team"]["id"],
        "away_team": game["teams"]["away"]["team"]["name"],
        "away_team_id": game["teams"]["away"]["team"]["id"],
        "home_score": 0,  # Default score
        "away_score": 0,  # Default score
        "processed": False,  # Default value
    }

def insert_into_bigquery(project_id, dataset_id, table_id, rows):
    """Insert rows into BigQuery table."""
    client = bigquery.Client(project=project_id)
    table_ref = f"{project_id}.{dataset_id}.{table_id}"

    try:
        errors = client.insert_rows_json(table_ref, rows, retry=Retry())
        if errors:
            print(f"Encountered errors while inserting rows: {errors}")
        else:
            print(f"Successfully inserted {len(rows)} rows into {table_ref}.")
    except Exception as e:
        print(f"Insert operation failed: {e}")

def main():
    """Main function to fetch, process, and insert games data into BigQuery."""
    project_id = "mlbhackathon-445616"
    dataset_id = "mlbplayerstats"
    table_id = "mlbgamedata"
    api_url = "https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=2025-01-28&endDate=2025-10-29" 

    # Fetch and process games data
    data = fetch_games_data(api_url)
    if not data or "dates" not in data:
        print("No games data found.")
        return

    rows_to_insert = []
    for date_entry in data["dates"]:
        for game in date_entry.get("games", []):
            processed_game = process_game_data(game)
            rows_to_insert.append(processed_game)

    # Insert processed data into BigQuery
    if rows_to_insert:
        insert_into_bigquery(project_id, dataset_id, table_id, rows_to_insert)

if __name__ == "__main__":
    main()

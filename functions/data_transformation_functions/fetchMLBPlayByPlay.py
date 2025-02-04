from google.cloud import bigquery
import requests
from google.api_core.retry import Retry

def fetch_play_by_play(game_pk):
    """Fetch play-by-play data for a given game_pk."""
    url = f"https://statsapi.mlb.com/api/v1/game/{game_pk}/playByPlay"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch data for game_pk {game_pk}: {response.status_code}")
        return None

def process_play_data(play, existing_play_ids):
    """Process a single play and extract required fields."""
    play_id = play["playEvents"][-1]["playId"] if play["playEvents"] and play["playEvents"][-1].get("playId") else None
    video_url = dict(existing_play_ids).get(play_id, "")  # Get the video_url for the play_id

    result = {
        "play_id": play_id,
        "video_url": video_url,  # Include video_url
        "title": play["result"]["description"],
        "inning_half": play["about"]["halfInning"],
        "current_away_score": play["result"]["awayScore"],
        "current_home_score": play["result"]["homeScore"],
        "start_away_score": play["result"]["awayScore"] - play["result"].get("rbi", 0) if play["about"]["halfInning"] == "top" else play["result"]["awayScore"],
        "start_home_score": play["result"]["homeScore"] - play["result"].get("rbi", 0) if play["about"]["halfInning"] == "bottom" else play["result"]["homeScore"],
        "balls": play["count"]["balls"],
        "strikes": play["count"]["strikes"],
        "outs": play["count"]["outs"],
        "batter": play["matchup"]["batter"]["fullName"],
        "player_id": play["matchup"]["batter"]["id"],
        "pitcher": play["matchup"]["pitcher"]["fullName"],
        "pitcher_id": play["matchup"]["pitcher"]["id"],
        "inning": play["about"]["inning"],
        "launchSpeed": play["playEvents"][-1].get("hitData", {}).get("launchSpeed"),
        "totalDistance": play["playEvents"][-1].get("hitData", {}).get("totalDistance"),
        "launchAngle": play["playEvents"][-1].get("hitData", {}).get("launchAngle"),
        "hardness": play["playEvents"][-1].get("hitData", {}).get("hardness"),
        "location": play["playEvents"][-1].get("hitData", {}).get("location"),
        "hitCordinatesX": play["playEvents"][-1].get("hitData", {}).get("coordinates", {}).get("coordX"),
        "hitCordinatesY": play["playEvents"][-1].get("hitData", {}).get("coordinates", {}).get("coordY"),
    }
    return result

def check_table_exists(project_id, dataset_id, table_id):
    """Check if a BigQuery table exists."""
    client = bigquery.Client(project=project_id)
    table_ref = f"{project_id}.{dataset_id}.{table_id}"
    try:
        client.get_table(table_ref)
        return True
    except Exception as e:
        print(f"Table {table_ref} does not exist: {e}")
        return False

def insert_into_bigquery(project_id, dataset_id, table_id, rows):
    """Insert rows into a BigQuery table with retry mechanism."""
    client = bigquery.Client(project=project_id)
    table_ref = f"{project_id}.{dataset_id}.{table_id}"

    # Ensure table exists
    if not check_table_exists(project_id, dataset_id, table_id):
        print(f"Table {table_ref} not found. Skipping insert.")
        return

    try:
        errors = client.insert_rows_json(table_ref, rows, retry=Retry())
        if errors:
            print(f"Encountered errors while inserting rows: {errors}")
        else:
            print(f"Successfully inserted {len(rows)} rows into {table_ref}.")
    except Exception as e:
        print(f"Insert operation failed: {e}")

def create_bigquery_table(project_id, dataset_id, table_id):
    """Create a BigQuery table for storing play-by-play data."""
    client = bigquery.Client(project=project_id)
    schema = [
        bigquery.SchemaField("play_id", "STRING"),
        bigquery.SchemaField("video_url", "STRING"),
        bigquery.SchemaField("title", "STRING"),
        bigquery.SchemaField("inning_half", "STRING"),
        bigquery.SchemaField("current_away_score", "INTEGER"),
        bigquery.SchemaField("current_home_score", "INTEGER"),
        bigquery.SchemaField("start_away_score", "INTEGER"),
        bigquery.SchemaField("start_home_score", "INTEGER"),
        bigquery.SchemaField("balls", "INTEGER"),
        bigquery.SchemaField("strikes", "INTEGER"),
        bigquery.SchemaField("outs", "INTEGER"),
        bigquery.SchemaField("batter", "STRING"),
        bigquery.SchemaField("player_id", "INTEGER"),
        bigquery.SchemaField("pitcher", "STRING"),
        bigquery.SchemaField("pitcher_id", "INTEGER"),
        bigquery.SchemaField("inning", "INTEGER"),
        bigquery.SchemaField("launchSpeed", "FLOAT"),
        bigquery.SchemaField("totalDistance", "INTEGER"),
        bigquery.SchemaField("launchAngle", "INTEGER"),
        bigquery.SchemaField("hardness", "STRING"),
        bigquery.SchemaField("location", "STRING"),
        bigquery.SchemaField("hitCordinatesX", "FLOAT"),
        bigquery.SchemaField("hitCordinatesY", "FLOAT"),
    ]

    table_ref = f"{project_id}.{dataset_id}.{table_id}"
    table = bigquery.Table(table_ref, schema=schema)

    try:
        table = client.create_table(table)  # Make an API request.
        print(f"Created table {table.project}.{table.dataset_id}.{table.table_id}")
    except Exception as e:
        print(f"Table creation failed: {e}")

def fetch_existing_play_ids(project_id, dataset_id, table_id):
    """
    Fetch all play_ids and their associated video URLs from the specified BigQuery table.
    Returns a set of tuples containing (play_id, video_url).
    """
    client = bigquery.Client(project=project_id)
    query = f"""
    SELECT play_id, video AS video_url
    FROM `{project_id}.{dataset_id}.{table_id}`
    """
    query_job = client.query(query)
    
    # Use a set comprehension to construct a set of tuples
    return {(row["play_id"], row["video_url"]) for row in query_job}

def main():
    project_id = "mlbhackathon-445616"
    dataset_id = "mlbplayerstats"
    table_id_play_by_play = "mlbhrplaydata"
    table_id_hr_clips = "mlbplayerhrclips"

    # Initialize BigQuery client
    client = bigquery.Client(project=project_id)

    # Fetch existing play_ids and video URLs
    existing_play_ids = fetch_existing_play_ids(project_id, dataset_id, table_id_hr_clips)
    if not existing_play_ids:
        print("No play_ids found in mlbplayerhrclips.")
        return

    # Fetch game_pks from BigQuery
    query = f"""
    SELECT game_pk
    FROM `{project_id}.{dataset_id}.mlbgamedata`
    WHERE game_type NOT IN ('Exhibition', 'All-Star Game', 'Spring Traning')
    """
    query_job = client.query(query)
    game_pks = [row["game_pk"] for row in query_job]

    if not game_pks:
        print("No unprocessed game_pks found.")
        return

    # Create table if not exists
    create_bigquery_table(project_id, dataset_id, table_id_play_by_play)

    for game_pk in game_pks:
        play_by_play = fetch_play_by_play(game_pk)
        if not play_by_play:
            continue

        rows_to_insert = []
        for play in play_by_play.get("allPlays", []):
            processed_play = process_play_data(play, existing_play_ids)
            # Filter rows based on existing play_ids
            if processed_play["play_id"] and processed_play["play_id"] in dict(existing_play_ids):
                rows_to_insert.append(processed_play)

        if rows_to_insert:
            insert_into_bigquery(project_id, dataset_id, table_id_play_by_play, rows_to_insert)

if __name__ == "__main__":
    main()

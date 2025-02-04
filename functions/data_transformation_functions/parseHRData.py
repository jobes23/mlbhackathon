from google.cloud import bigquery
import os
import csv
import glob
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# --- Configuration ---
PROJECT_ID = os.getenv("PROJECT_ID", "mlbhackathon-445616")
DATASET_ID = os.getenv("DATASET_ID", "mlbplayerstats")
TABLE_ID = os.getenv("TABLE_ID", "mlbplayerhrclips")
PLAYERS_TABLE_ID = os.getenv("PLAYERS_TABLE_ID", "mlbplayers")
FOLDER_PATH = os.getenv("FOLDER_PATH", "../../MLBDataSets/hrData/")

client = bigquery.Client(project=PROJECT_ID)

# Cache to store player names and IDs
player_cache = {}

def populate_player_cache():
    """Populates the player cache with player names and IDs from BigQuery."""
    logging.info("Populating player cache from BigQuery...")
    query = f"""
        SELECT player_id, name
        FROM `{PROJECT_ID}.{DATASET_ID}.{PLAYERS_TABLE_ID}`
    """
    try:
        query_job = client.query(query)
        results = query_job.result()
        for row in results:
            normalized_name = row.name.strip().lower()
            player_cache[normalized_name] = row.player_id
        logging.info(f"Cached {len(player_cache)} player names and IDs.")
    except Exception as e:
        logging.error(f"Error populating player cache: {e}")

def parse_title(title):
    """Parses the title to extract the player name."""
    if "homers" in title:
        return title.split("homers")[0].strip()
    elif "upheld:" in title:
        # Extract name after "call on the field was upheld:"
        return title.split("upheld:")[-1].strip()
    return None

def find_player_id(player_name):
    """
    Finds the player ID using the cache or queries BigQuery if not found.
    Ensures the cache is updated for future lookups.
    """
    normalized_name = player_name.strip().lower()

    # Check if the player is already in the cache
    if normalized_name in player_cache:
        logging.debug(f"Player ID for '{player_name}' found in cache.")
        return player_cache[normalized_name]

    # Query BigQuery if not in cache
    logging.info(f"Querying BigQuery for player ID: {player_name}")
    query = f"""
        SELECT player_id
        FROM `{PROJECT_ID}.{DATASET_ID}.{PLAYERS_TABLE_ID}`
        WHERE LOWER(TRIM(name)) = @player_name
        LIMIT 1
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[bigquery.ScalarQueryParameter("player_name", "STRING", normalized_name)]
    )
    try:
        query_job = client.query(query, job_config=job_config)
        results = query_job.result()
        for row in results:
            player_id = row.player_id
            player_cache[normalized_name] = player_id  # Cache the result
            return player_id

        # If no result, cache None to avoid redundant queries
        player_cache[normalized_name] = None
        logging.info(f"No player ID found for '{player_name}'. Cached as None.")
        return None
    except Exception as e:
        logging.error(f"Error querying player ID for {player_name}: {e}")
        return None

def parse_float(value):
    """Safely parses a value to float, returning None for invalid or empty values."""
    try:
        return float(value) if value.strip() else None
    except (ValueError, AttributeError):
        return None

def insert_data_into_bigquery(csv_filepath):
    """Inserts data from a CSV file into a BigQuery table."""
    logging.info(f"Inserting data from file: {csv_filepath}")
    dataset_ref = client.dataset(DATASET_ID)
    table_ref = dataset_ref.table(TABLE_ID)

    rows_to_insert = []
    with open(csv_filepath, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            parsed_name = parse_title(row.get("title", ""))
            player_id = find_player_id(parsed_name) if parsed_name else None
            rows_to_insert.append({
                "player_id": player_id,
                "play_id": row.get("play_id"),
                "title": row.get("title"),
                "transcription": row.get("transcription"),
                "ExitVelocity": parse_float(row.get("ExitVelocity")),
                "HitDistance": parse_float(row.get("HitDistance")),
                "LaunchAngle": parse_float(row.get("LaunchAngle")),
                "video": row.get("video")
            })

    for i in range(0, len(rows_to_insert), 500):
        batch = rows_to_insert[i:i + 500]
        logging.info(f"Inserting batch of {len(batch)} rows...")
        errors = client.insert_rows_json(table_ref, batch)
        if errors:
            logging.error(f"Errors inserting batch: {errors}")
        else:
            logging.info(f"Successfully inserted batch of {len(batch)} rows from {csv_filepath}.")

def process_all_csv_files(folder_path):
    """Processes all CSV files in the specified folder."""
    logging.info("Starting the CSV processing script...")
    populate_player_cache()  # Load the player cache before processing files
    csv_files = glob.glob(os.path.join(folder_path, "*.csv"))
    logging.info(f"Found {len(csv_files)} CSV files to process.")
    for csv_file in csv_files:
        logging.info(f"Processing file: {csv_file}")
        insert_data_into_bigquery(csv_file)
        time.sleep(1)  # Optional: Pause between files for better readability of logs
    logging.info("CSV processing completed.")

if __name__ == "__main__":
    process_all_csv_files(FOLDER_PATH)

import os
import tempfile
import requests
import json
import logging
import csv
from google.cloud import bigquery
from pydub import AudioSegment
import vertexai
from google.cloud import speech

# Configure logging
logging.basicConfig(filename='mlb_processing.log', level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration for project, dataset, and table
data_config = {
    "project": "mlbhackathon-445616",
    "dataset": "mlbplayerstats",
    "clipTable": "mlbplayerhrclips",
    "playerTable": "mlbplayers"
}

# Configuration for Vertex AI
vertex_config = {
    "project": "mlbhackathon-445616",
    "location": "us-central1",
    "stt_model_id": "latest_long",
    "translation_model_id": "gemini-pro"  # You can keep this here for now, even if not used
}

def create_player_json(project_id, output_file="player_data.json"):
    """
    Fetches player data from BigQuery and saves it as a JSON file.
    """
    client = bigquery.Client(project=project_id)

    query = f"""
        SELECT
            player_id,
            name AS english_name,
            japanese_name
        FROM
            `{data_config['project']}.{data_config['dataset']}.{data_config['playerTable']}`
    """
    query_job = client.query(query)
    results = query_job.result()

    player_data = []
    for row in results:
        player_data.append({
            "player_id": row.player_id,
            "english_name": row.english_name,
            "japanese_name": row.japanese_name
        })

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump({"players": player_data}, f, ensure_ascii=False, indent=2)

def ensure_video_folder():
    """Ensure the videos folder exists."""
    video_folder = os.path.join(os.getcwd(), "videos")
    os.makedirs(video_folder, exist_ok=True)
    return video_folder

def get_play_ids_and_urls(num_videos=1):
    """Query BigQuery to get play_ids, video URLs, titles, and player_ids for a specified number of videos."""
    client = bigquery.Client(project=data_config['project'])
    query = f"""
        SELECT play_id, video, title, player_id
        FROM `{data_config['project']}.{data_config['dataset']}.{data_config['clipTable']}`
        WHERE transcription IS NULL
        LIMIT {num_videos}
    """
    query_job = client.query(query)
    result = query_job.result()
    return [{"play_id": row.play_id, "video_url": row.video, "title": row.title, "player_id": row.player_id} for row in result]

def download_video(video_url):
    """Download video from a URL and save it in the videos folder."""
    video_folder = ensure_video_folder()
    video_path = os.path.join(video_folder, f"video_{os.path.basename(video_url)}")

    try:
        response = requests.get(video_url, stream=True, timeout=10)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error downloading video: {e}")
        raise RuntimeError(f"Error downloading video: {e}")

    with open(video_path, "wb") as video_file:
        for chunk in response.iter_content(chunk_size=8192):
            video_file.write(chunk)
    return video_path

def cleanup_video_folder():
    """Delete all files in the videos folder."""
    video_folder = os.path.join(os.getcwd(), "videos")
    if os.path.exists(video_folder):
        for file in os.listdir(video_folder):
            file_path = os.path.join(video_folder, file)
            if os.path.isfile(file_path):
                os.remove(file_path)

def convert_video_to_audio(video_path):
    """Convert a video file to an audio file."""
    try:
        logging.info(f"Converting video to audio. Video path: {video_path}")
        audio_path = os.path.join(os.path.dirname(video_path), "output_audio.wav")
        video = AudioSegment.from_file(video_path)
        video.export(audio_path, format="wav")
        logging.info(f"Audio saved to: {audio_path}")
        return audio_path
    except Exception as e:
        logging.error(f"Error converting video to audio: {e}")
        raise RuntimeError(f"Error converting video to audio: {e}")

def ensure_audio_mono(audio_path):
    """Convert audio to mono and return the path to the mono file."""
    logging.info(f"Processing audio file at path: {audio_path}")
    try:
        audio = AudioSegment.from_file(audio_path)
        if audio.channels > 1:
            logging.info("Converting audio to mono")
            audio = audio.set_channels(1)  # Convert to mono
        else:
            logging.info("Audio is already in mono format")

        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
        mono_audio_path = temp_file.name
        audio.export(mono_audio_path, format="wav")
        logging.info(f"Mono audio saved to: {mono_audio_path}")
        return mono_audio_path
    except Exception as e:
        logging.error(f"Error in ensure_audio_mono: {e}")
        raise

def transcribe_with_vertex_ai(audio_path, title):
    """Use Vertex AI Speech-to-Text API to transcribe audio."""
    mono_audio_path = ensure_audio_mono(audio_path)
    if not mono_audio_path or not os.path.exists(mono_audio_path):
        logging.error("Mono audio file was not created or path does not exist.")
        raise ValueError("Mono audio file was not created or path does not exist.")

    vertexai.init(project=vertex_config["project"], location=vertex_config["location"])

    # Initialize the Speech-to-Text client
    client = speech.SpeechClient()

    # Read the audio file
    with open(mono_audio_path, "rb") as audio_file:
        content = audio_file.read()

    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        language_code="en-US",
        model="latest_long"
    )

    # Add title as additional context
    speech_context = speech.SpeechContext(phrases=[title])
    config.speech_contexts = [speech_context]

    # Perform the speech recognition
    try:
        response = client.recognize(config=config, audio=audio)

        # Process the response
        transcription = ""
        for result in response.results:
            alternative = result.alternatives[0]
            transcription += alternative.transcript
    except Exception as e:
        logging.error(f"Error during speech recognition: {e}")
        raise

    os.remove(mono_audio_path)
    return transcription

def save_transcriptions_to_csv(transcription_data, csv_filename="transcriptions.csv"):
    """Saves the transcription data to a CSV file."""
    print(f"Writing {len(transcription_data)} entries to CSV...")
    with open(csv_filename, "w", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["play_id", "video_url", "title", "player_id", "transcription"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        for data in transcription_data:
            writer.writerow(data)

if __name__ == "__main__":
    try:
        # Create player_data.json if it doesn't exist
        if not os.path.exists("player_data.json"):
            create_player_json(vertex_config["project"])

        # Load player data from JSON
        with open("player_data.json", "r", encoding="utf-8") as f:
            player_data_list = json.load(f)["players"]

        # Create a dictionary for faster player lookups by ID
        player_data = {player["player_id"]: player for player in player_data_list}

        print("Fetching play_ids and video URLs from BigQuery...")
        play_data = get_play_ids_and_urls(num_videos=50)  # Fetch 50 videos
        if not play_data:
            raise ValueError("No play_ids or video URLs found to process.")

        transcription_data = []  # List to store data for CSV

        for data in play_data:
            play_id = data["play_id"]
            video_url = data["video_url"]
            title = data["title"]
            player_id = data["player_id"]
            video_path = None
            audio_path = None

            # Look up player name using player_id
            player = player_data.get(player_id)
            if player:
                player_name = player["english_name"]
                japanese_name = player["japanese_name"]
            else:
                player_name = ""
                japanese_name = ""
                logging.warning(f"Player ID {player_id} not found in player data.")

            print(f"Processing play_id: {play_id}, Player Name: {player_name}, Title: {title}")

            try:
                if not video_url:
                    logging.warning(f"No video URL found for play_id: {play_id}")
                    continue

                print("Downloading video...")
                video_path = download_video(video_url)
                print(video_path)

                print("Converting video to audio...")
                audio_path = convert_video_to_audio(video_path)

                print("Transcribing audio with Vertex AI...")
                transcription = transcribe_with_vertex_ai(audio_path, title)
                print(f"Transcription: {transcription}")

                # Validate transcription before storing
                if transcription.strip():
                    # Store data for CSV
                    transcription_data.append({
                        "play_id": play_id,
                        "video_url": video_url,
                        "title": title,
                        "player_id": player_id,
                        "transcription": transcription
                    })
                    print(f"Added transcription for play_id: {play_id}")
                else:
                    logging.warning(f"No transcription generated for play_id: {play_id}")

            except Exception as e:
                logging.exception(f"Error processing play_id {play_id}: {e}")
            finally:
                # Clean up temporary files
                cleanup_video_folder()

        # Debug transcription data
        print(f"Final transcription data: {transcription_data}")


        # Save transcriptions to CSV
        save_transcriptions_to_csv(transcription_data)
        print(f"Transcriptions saved to transcriptions.csv")

    except Exception as e:
        logging.exception(f"Error: {e}")
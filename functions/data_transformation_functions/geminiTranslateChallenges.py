import firebase_admin
from firebase_admin import credentials, firestore
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import time
import logging

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"
LOCATION = "us-central1"
TASKS_COLLECTION_NAME = "rewards" 
CHALLENGES_COLLECTION_NAME = "rewardsCollection" 
MODEL_NAME = "gemini-1.5-pro-002"
SLEEP_TIME = 30
# -----------------------

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize Firebase Admin SDK
try:
    app = firebase_admin.get_app()
except ValueError:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

# --- Function to Translate Text ---
def translate_with_gemini(text, target_language_code):
    """Translates text using Vertex AI Gemini model with retry handling."""
    try:
        prompt = f"""
        You are a highly skilled translator tasked with translating an English text into {target_language_code}.

        Your response MUST follow these strict rules:
        1. Output MUST be ONLY the translated text.
        2. Do NOT include any words, phrases, numbers, or characters other than the translated text.
        3. Do NOT include the target language name or any introductory phrases.
        4. The translated text MUST be accurate and natural in {target_language_code}.

        English Text to translate: "{text}"
        """

        config = GenerationConfig(
            max_output_tokens=2048,
            temperature=0.2,
            top_p=0.8,
            top_k=40
        )

        response = model.generate_content(prompt, generation_config=config)
        return response.text.strip()

    except Exception as e:
        logging.error(f"Error translating text: {e}")
        if "429 Online prediction request quota exceeded" in str(e) or "Quota exceeded for aiplatform" in str(e):
            logging.warning("Rate limit exceeded. Waiting before retrying...")
            time.sleep(60)  # Wait for 60 seconds before retrying
            return translate_with_gemini(text, target_language_code)
        else:
            return None

# --- Function to Process and Store Translated Challenges ---
def process_tasks():
    """Fetches tasks from Firestore, translates them, and stores them in the challenges collection."""
    try:
        # Fetch existing challenges to prevent duplicates
        existing_challenges = {doc.id for doc in db.collection(CHALLENGES_COLLECTION_NAME).stream()}

        # Fetch tasks from Firestore
        tasks_ref = db.collection(TASKS_COLLECTION_NAME)
        tasks = tasks_ref.stream()

        for task_doc in tasks:
            task_data = task_doc.to_dict()
            task_id = task_doc.id

            # Skip if task already exists in challenges
            if task_id in existing_challenges:
                logging.info(f"Skipping existing task: {task_id}")
                continue

            logging.info(f"Processing task: {task_data['name']}")

            # Translate task name & description
            name_ja = translate_with_gemini(task_data["name"], "Japanese")
            time.sleep(SLEEP_TIME)
            name_es = translate_with_gemini(task_data["name"], "Spanish")
            time.sleep(SLEEP_TIME)

            description_ja = translate_with_gemini(task_data["description"], "Japanese")
            time.sleep(SLEEP_TIME)
            description_es = translate_with_gemini(task_data["description"], "Spanish")
            time.sleep(SLEEP_TIME)

            # Store in Firestore
            challenge_doc_ref = db.collection(CHALLENGES_COLLECTION_NAME).document(task_id)
            challenge_doc_ref.set({
                "description": {
                    "en": task_data["description"],
                    "ja": description_ja if description_ja else task_data["description"],
                    "es": description_es if description_es else task_data["description"],
                },
                "category": task_data["category"],
                "code": task_data["code"],
                "cost": task_data["cost"],
                "player": task_data.get("player"),
                "team": task_data.get("team"),
            })

            logging.info(f"Added translated challenge: {task_data['name']}")

        logging.info("Challenges translation completed successfully!")

    except Exception as e:
        logging.error(f"An error occurred: {e}")

# --- Run the Process ---
if __name__ == "__main__":
    process_tasks()

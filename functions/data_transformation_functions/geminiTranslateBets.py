import firebase_admin
from firebase_admin import credentials, firestore
import google.cloud.exceptions
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import time
import logging
import random

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"
LOCATION = "us-central1"
SOURCE_COLLECTION_NAME = "teamBets"
STAGING_COLLECTION_NAME = "translatedBets"
TRACKING_COLLECTION_NAME = "translationProgress"
MODEL_NAME = "gemini-1.5-pro-002"
MAX_RETRIES = 5
# -----------------------

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Initialize Firebase Admin SDK (uses `gcloud auth login` credentials)
try:
    app = firebase_admin.get_app()
except ValueError:
    cred = credentials.ApplicationDefault()  # Uses gcloud auth
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def exponential_backoff(attempts):
    """Waits for an exponentially increasing duration"""
    wait_time = min(60, (2 ** attempts) + random.uniform(0, 1))
    logging.warning(f"Rate limit hit. Retrying in {wait_time:.2f} seconds...")
    time.sleep(60)

def translate_with_gemini(text, target_language_code):
    """Translates text using Vertex AI Gemini model with retries."""
    if not text:
        logging.warning("Skipping empty text translation.")
        return None

    for attempt in range(MAX_RETRIES):
        try:
            logging.info(f"Translating '{text}' -> {target_language_code}")

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
                max_output_tokens=256,
                temperature=0.2,
                top_p=0.8,
                top_k=40
            )

            response = model.generate_content(prompt, generation_config=config)

            if response and response.text:
                return response.text.strip()
            else:
                raise ValueError("Empty response from Vertex AI")

        except Exception as e:
            logging.error(f"Error translating: {e}")

            if "Quota exceeded" in str(e) or "429" in str(e):
                exponential_backoff(attempt)
            else:
                return None  # Return None if it's not a quota issue

    logging.error("Max retries reached. Skipping this translation.")
    return None

def process_bets_and_store_translations():
    """Retranslates bet labels and stores them in a new Firestore collection."""
    try:
        source_collection_ref = db.collection(SOURCE_COLLECTION_NAME)
        staging_collection_ref = db.collection(STAGING_COLLECTION_NAME)
        tracking_collection_ref = db.collection(TRACKING_COLLECTION_NAME)

        docs = source_collection_ref.stream()

        total_teams = 0
        for doc in docs:
            total_teams += 1
            team_name = doc.id
            data = doc.to_dict()

            # Check if this team is already processed
            progress_doc = tracking_collection_ref.document(team_name).get()
            if progress_doc.exists and progress_doc.to_dict().get("status") == "completed":
                logging.info(f"Skipping already completed team: {team_name}")
                continue

            logging.info(f"Processing document for team: {team_name}")
            updated_bets = []
            for bet in data.get('bets', []):
                bet_label_en = bet['bet_label'].get('en', '')

                # Translate to Japanese and Spanish
                bet_label_ja = translate_with_gemini(bet_label_en, 'ja')
                bet_label_es = translate_with_gemini(bet_label_en, 'es')

                updated_bet = {
                    'odds': bet['odds'],
                    'bet_label': {
                        'en': bet_label_en,
                        'ja': bet_label_ja if bet_label_ja else bet_label_en,
                        'es': bet_label_es if bet_label_es else bet_label_en
                    }
                }
                updated_bets.append(updated_bet)

            # Store in the staging collection
            staging_collection_ref.document(team_name).set({'bets': updated_bets}, merge=True)

            # Mark as completed in tracking
            tracking_collection_ref.document(team_name).set({'status': 'completed'}, merge=True)
            logging.info(f"Stored translated bets for team: {team_name}")

        # After all teams are processed, check if all are done
        check_and_finalize_translations(total_teams)

    except Exception as e:
        logging.error(f"An error occurred: {e}")

def check_and_finalize_translations(total_teams):
    """Checks if all teams have been processed and finalizes the update."""
    try:
        tracking_collection_ref = db.collection(TRACKING_COLLECTION_NAME)
        staging_collection_ref = db.collection(STAGING_COLLECTION_NAME)
        target_collection_ref = db.collection(SOURCE_COLLECTION_NAME)

        completed_teams = tracking_collection_ref.where("status", "==", "completed").stream()
        completed_count = sum(1 for _ in completed_teams)

        if completed_count >= total_teams:
            logging.info("✅ All teams processed! Updating original collection.")

            # Replace bet labels in `teamBets` with the newly translated labels
            staged_docs = staging_collection_ref.stream()
            for doc in staged_docs:
                team_name = doc.id
                translated_data = doc.to_dict()

                # Update original Firestore collection
                target_doc_ref = target_collection_ref.document(team_name)
                target_doc_ref.set({'bets': translated_data['bets']}, merge=True)

            logging.info("✅ Successfully updated all bet labels in the original collection.")

            # Clean up staging & tracking collections
            cleanup_collections()

        else:
            logging.info(f"⚠️ Still processing teams. {completed_count}/{total_teams} completed.")

    except Exception as e:
        logging.error(f"Error during final update: {e}")

def cleanup_collections():
    """Deletes all documents in staging and tracking collections."""
    try:
        tracking_collection_ref = db.collection(TRACKING_COLLECTION_NAME)
        staging_collection_ref = db.collection(STAGING_COLLECTION_NAME)

        for doc in tracking_collection_ref.stream():
            doc.reference.delete()
        for doc in staging_collection_ref.stream():
            doc.reference.delete()

        logging.info("✅ Cleaned up staging and tracking collections.")

    except Exception as e:
        logging.error(f"Error cleaning up collections: {e}")

if __name__ == "__main__":
    process_bets_and_store_translations()

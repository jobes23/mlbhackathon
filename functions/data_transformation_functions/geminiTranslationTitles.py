from google.cloud import firestore
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"  # Replace with your project ID
LOCATION = "us-central1"  # Replace with your preferred location
COLLECTION_NAME = "articles"  # Replace with your collection name
MODEL_NAME = "gemini-1.5-pro-002"  # Or another suitable model
# -----------------------

# Initialize Firestore client
firestore_client = firestore.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def get_articles_with_summary(firestore_client):
    """Retrieves titles and summaries from Firestore with error handling."""
    try:
        articles = []
        docs = firestore_client.collection(COLLECTION_NAME).stream()
        for doc in docs:
            doc_dict = doc.to_dict()
            if "title" in doc_dict and "summary" in doc_dict and "en" in doc_dict["summary"]:
                articles.append((doc_dict["summary"]["en"], doc.id))
        logging.info(f"Articles retrieved: {len(articles)}")
        return articles
    except Exception as e:
        logging.error(f"Error retrieving articles: {e}")
        return []

def translate_with_gemini(text, target_language_code):
    """Translates text using a Vertex AI Gemini model."""
    try:
        prompt = f"""
        You are a highly skilled translator tasked with translating an English text into {target_language_code}.

        Your response MUST follow these strict rules:
        1. **Output MUST be ONLY the translated text.**
        2. **Do NOT include any words, phrases, numbers, or characters other than the translated text.**
        3. **Do NOT include the target language name or any introductory phrases.**
        4. **The translated text MUST be accurate and natural in {target_language_code}.**

        English Text to translate: "{text}"
        """

        config = GenerationConfig(
            max_output_tokens=2048,
            temperature=0.0,
            top_p=0.1,
            top_k=10
        )

        response = model.generate_content(prompt, generation_config=config)
        return response.text.strip()
    except Exception as e:
        logging.error(f"Error translating text: {e}")
        if "429 Online prediction request quota exceeded" in str(e):
            time.sleep(30)
            return translate_with_gemini(text, target_language_code)

def update_summary_translations_in_firestore(firestore_client, document_id, ja_summary, es_summary):
    """
    Updates the summary->ja and summary->es fields in Firestore for the given document ID.
    """
    try:
        document_ref = firestore_client.collection(COLLECTION_NAME).document(document_id)
        document_ref.update({
            "summary.ja": ja_summary,
            "summary.es": es_summary
        })
        logging.info(f"Summary translations updated for document ID: {document_id}.")
    except Exception as e:
        logging.error(f"Error updating Firestore document: {e}")

if __name__ == "__main__":
    articles = get_articles_with_summary(firestore_client)
    if articles:
        for article in articles:
            summary_en, document_id = article
            logging.info(f"----- Translating summary for: {summary_en} -----")

            # Translate summary to Japanese
            translated_japanese = translate_with_gemini(summary_en, "Japanese")
            if translated_japanese:
                logging.info(f"Japanese Summary: {translated_japanese}")
                time.sleep(1)

            # Translate summary to Spanish
            translated_spanish = translate_with_gemini(summary_en, "Spanish")
            if translated_spanish:
                logging.info(f"Spanish Summary: {translated_spanish}")
                time.sleep(1)

            # Update Firestore with the translated summaries
            update_summary_translations_in_firestore(firestore_client, document_id, translated_japanese, translated_spanish)
            time.sleep(1)
    else:
        logging.warning("No articles with summaries found.")

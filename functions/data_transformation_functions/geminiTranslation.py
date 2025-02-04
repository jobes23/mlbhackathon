from google.cloud import bigquery
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import logging
import time
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"  # Replace with your project ID
LOCATION = "us-central1"  # Replace with your preferred location
DATASET_NAME = "mlbplayerstats"  # Replace with your dataset name
TABLE_NAME = "mlbhrplaydata"  # Replace with your table name
MODEL_NAME = "gemini-1.5-pro-002"  # Or another suitable model
# -----------------------

# Initialize BigQuery client
bq_client = bigquery.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def get_transcriptions(bq_client):
    """Retrieves transcriptions from BigQuery with error handling."""
    try:
        query = f"""
            SELECT play_id, transcription
            FROM `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
            WHERE transcription IS NOT NULL;
        """
        query_job = bq_client.query(query)
        results = query_job.result()
        return results
    except Exception as e:
        logging.error(f"Error retrieving transcriptions: {e}")
        return []

def translate_text_with_gemini(text, target_language_code):
    """Translates text to the target language using a Vertex AI Gemini model."""
    try:
        prompt = f"""
            You are a professional baseball announcer providing live commentary. Translate the following play description into the target language, using the style and tone of a real announcer in that language.

            Focus on using idiomatic expressions and common baseball terminology for the target language. Capture the excitement of the moment!

            Here are some examples to guide your translation:

            **Example 1:**

            *   **English:** High fly ball, right center field!  Streaking back, he's on the track, he's at the wall!  See ya!  A solo home run for Aaron Judge, and the New York Yankees take a 2 to 0 lead in the bottom of the first inning!
            *   **Spanish:** ¡Batazo alto al jardín derecho central! ¡Va para atrás, a la zona de seguridad, cerca de la barda! ¡Se va, se va, y se fue! ¡Cuadrangular solitario para Aaron Judge, y los Yankees de Nueva York toman la ventaja 2 a 0 en la parte baja de la primera entrada!
            *   **Japanese:** 高いフライボール、ライト・センター間！後ろに下がる！フェンス際だ！行ったー！アーロン・ジャッジのソロホームラン！ニューヨーク・ヤンキース、初回裏に2対0とリードを広げます!

            **Example 2:**

            *   **English:**  A screaming line drive down the left field line! It's gonna be extra bases! He's rounding second, heading for third... he's in there with a stand-up triple!
            *   **Spanish:** ¡Línea violenta por la raya del jardín izquierdo! ¡Serán extra bases! ¡Está doblando segunda, va para tercera... y llega quieto a tercera con un triple!
            *   **Japanese:** 痛烈なライナーがレフト線へ！長打コースだ！セカンドを回って、サードへ向かう…悠々セーフ、スリーベースヒットです！

            **Original Text (English):**
            {text}

            **Target Language:** {target_language_code}

            """

        config = GenerationConfig(
            max_output_tokens=2048,
            temperature=0.4,  # Slightly higher temperature for more creative output
            top_p=0.8,
            top_k=40
        )

        response = model.generate_content(prompt, generation_config=config)
        return response.text
    except Exception as e:
        logging.error(f"Error translating text: {e}")
        if "429 Online prediction request quota exceeded" in str(e):
            time.sleep(30)
            print(e)
            return translate_text_with_gemini(text, target_language_code)

def update_translations_in_bigquery(client, play_id, es_translation, ja_translation):
    """
    Updates the es_translation and ja_translation in BigQuery for the given play_id.
    Since the play_id is retrieved from the table, an UPDATE is sufficient.
    """
    query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        SET es_translation = @es_translation, ja_translation = @ja_translation
        WHERE play_id = @play_id
    """

    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("play_id", "STRING", play_id),
            bigquery.ScalarQueryParameter("es_translation", "STRING", es_translation),
            bigquery.ScalarQueryParameter("ja_translation", "STRING", ja_translation),
        ]
    )

    try:
        client.query(query, job_config=job_config).result()
        logging.info(f"Translations updated for play_id: {play_id}.")
    except Exception as e:
        logging.error(f"Error updating BigQuery for play_id {play_id}: {e}")

if __name__ == "__main__":
    transcriptions = get_transcriptions(bq_client)
    if transcriptions:
        for row in transcriptions:
            play_id = row["play_id"]
            transcription = row["transcription"]

            print(f"----- Play ID: {play_id} -----")
            print(f"Original (English): {transcription}")

            # Translate to Spanish
            translated_spanish = translate_text_with_gemini(transcription, "Spanish")
            if translated_spanish:
                # Clean the Spanish translation
                translated_spanish = translated_spanish.replace("Spanish:", "").strip()
                print(f"Spanish: {translated_spanish}")
            time.sleep(1)
            # Translate to Japanese
            translated_japanese = translate_text_with_gemini(transcription, "Japanese")
            if translated_japanese:
                # Clean the Japanese translation
                translated_japanese = translated_japanese.replace("Japanese:", "").strip()
                print(f"Japanese: {translated_japanese}")
            time.sleep(1)
            # Update translations in BigQuery using UPDATE
            update_translations_in_bigquery(bq_client, play_id, translated_spanish, translated_japanese)
            time.sleep(1)
    else:
        logging.warning("No transcriptions found.")
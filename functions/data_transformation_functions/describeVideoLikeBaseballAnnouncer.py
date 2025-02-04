from google.cloud import bigquery
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Part
import logging
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"  # Replace with your project ID
LOCATION = "us-central1"
DATASET_NAME = "mlbplayerstats"
TABLE_NAME = "mlbhrplaydata"
MODEL_NAME = "gemini-1.5-pro-002"
BUCKET_NAME = "mlbhackathon-fandugout"  # Your bucket name
VIDEO_FOLDER = "videos"  # The folder where videos are stored
# -----------------------

# Initialize BigQuery client
bq_client = bigquery.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def translate_with_ssml(video_uri, text, target_language_code):
    """
    Translates text to the target language using a Vertex AI Gemini model, with video context from URI.
    Instructs the model to add natural pauses and emphasis using SSML during translation.
    """
    try:
        prompt = f"""
            You are a professional baseball announcer providing live commentary. Watch the provided video and then translate the following play description into the target language, using the style and tone of a real announcer in that language.

            Focus on using idiomatic expressions and common baseball terminology for the target language. The provided video should be used to capture the excitement of the moment and guide the timing of your commentary.

            **EXTREMELY IMPORTANT:**
            1.  **Provide the output in valid SSML (Speech Synthesis Markup Language) format.**
            2.  **Incorporate natural pauses and emphasis in your translation as appropriate for live spoken commentary.**
                *   Use `<break>` for pauses, and vary the `time` attribute to create different pause lengths. **Longer pauses should be used when the ball is in the air and it's unclear if it will be a home run or when building suspense.**
                *   Use `<emphasis>` for emphasis. **Emphasize key moments like the hit, the player's name on a home run, and the outcome of the play.**
                *   **Consider using `<prosody>` to adjust the rate, pitch, and volume.** For example, you might increase the rate during exciting moments or lower the pitch for a more somber tone.
            3.  **Wrap your translated text with `<speak>` tags**
            4.  **The output should be ONLY valid SSML enclosed in <speak> tags. Do not include any surrounding text, explanations, or preambles.**
            5.  **ABSOLUTELY DO NOT say 'Here is your commentary:' or 'Here is the translation' or 'Excellent work!' or anything like that.**
            6.  **ABSOLUTELY DO NOT include any analysis or commentary about the quality of the description, such as 'This commentary is clear, concise...' or anything like that.**
            7.  **Failure to follow these instructions will result in serious consequences.**

            Here are some examples to guide your translation and SSML formatting. **Pay close attention to the placement and duration of pauses, the use of emphasis, and how the SSML reflects the action in the video:**

            **Example 1 (Home Run - The Classic):**

            *   **English:** High fly ball, right center field! Streaking back, he's on the track, he's at the wall! See ya! A solo home run for Aaron Judge, and the New York Yankees take a 2 to 0 lead in the bottom of the first inning!
            *   **Spanish:** 
                ```ssml
                <speak>
                <prosody rate="fast">
                ¡Batazo alto al jardín derecho central! ¡Va para atrás, <break time="0.5s"/> a la zona de seguridad, <break time="0.8s"/> cerca de la barda! ¡Se va, <emphasis level="strong"> se va</emphasis>, ¡y se fue! <break time="0.3s"/> ¡Cuadrangular solitario para <emphasis level="strong"> Aaron Judge</emphasis>, y los Yankees de Nueva York toman la ventaja 2 a 0 en la parte baja de la primera entrada!
                </prosody>
                </speak>
                ```
            *   **Japanese:** 
                ```ssml
                <speak>
                <prosody rate="fast">
                高いフライボール、ライト・センター間！<break time="0.4s"/> 後ろに下がる！<break time="0.7s"/> フェンス際だ！<emphasis level="strong"> 行ったー</emphasis>！<break time="0.3s"/> アーロン・ジャッジのソロホームラン！<break time="0.5s"/> ニューヨーク・ヤンキース、初回裏に2対0とリードを広げます!
                </prosody>
                </speak>
                ```

            **Example 2 (Home Run - The Walk-Off):**

            *   **English:**  And a deep drive to left field! This could be it! Back, at the wall... <break time="1.0s"/> It's gone! A walk-off home run for Mookie Betts! The Dodgers win it in extra innings!
            *   **Spanish:**
                ```ssml
                <speak>
                <prosody rate="fast">
                ¡Y un batazo profundo al jardín izquierdo! ¡Este podría ser el batazo! ¡Atrás, en la barda...! <break time="1.0s"/> ¡Se fue! ¡Jonrón de Mookie Betts para dejar tendido al rival! ¡Los Dodgers ganan en extra innings!
                </prosody>
                </speak>
                ```
            *   **Japanese:**
                ```ssml
                <speak>
                <prosody rate="fast">
                そして、レフトへの大きな当たり！<break time="0.5s"/> 決定的瞬間となるか！<break time="0.8s"/> 後ろに、壁際で…<break time="1.0s"/> 入った！ムーキー・ベッツのサヨナラホームラン！<break time="0.3s"/> ドジャース、延長戦を制しました！
                </prosody>
                </speak>
                ```

            **Example 3 (Home Run - The Grand Slam):**

            *   **English:**  Bases loaded, two outs, full count... and he sends a high drive to deep center! <break time="0.7s"/> Way back... <emphasis level="strong">GONE!</emphasis> <break time="0.4s"/> A grand slam for Shohei Ohtani! The Angels take the lead!
            *   **Spanish:**
                ```ssml
                <speak>
                <prosody rate="fast">
                Bases llenas, dos outs, cuenta llena... ¡y conecta un batazo elevado al jardín central! <break time="0.7s"/> ¡Bien atrás...! <emphasis level="strong">¡SE FUE!</emphasis> <break time="0.4s"/> ¡Grand Slam para Shohei Ohtani! ¡Los Angels toman la delantera!
                </prosody>
                </speak>
                ```
            *   **Japanese:**
                ```ssml
                <speak>
                <prosody rate="fast">
                満塁、ツーアウト、フルカウント…そして、センターへの大きな当たりを放った！<break time="0.7s"/> 遥か彼方へ…<emphasis level="strong">入った！</emphasis> <break time="0.4s"/> 大谷翔平の満塁ホームラン！エンゼルス、逆転です！
                </prosody>
                </speak>
                ```

            **Example 4 (Home Run - The Back-to-Back):**

            *   **English:** And the pitch... <break time="0.3s"/> swing and a fly ball to right field, this one's deep! <break time="0.6s"/> Back at the track... <break time="0.9s"/> It's gone! <break time="0.4s"/> Back-to-back home runs for the Mets! What a moment!
            *   **Spanish:**
                ```ssml
                <speak>
                <prosody rate="fast">
                Y el lanzamiento... <break time="0.3s"/> swing y un batazo elevado al jardín derecho, ¡este va profundo! <break time="0.6s"/> ¡Atrás, en la zona de seguridad...! <break time="0.9s"/> ¡Se fue! <break time="0.4s"/> ¡Jonrones consecutivos para los Mets! ¡Qué momento!
                </prosody>
                </speak>
                ```
            *   **Japanese:**
                ```ssml
                <speak>
                <prosody rate="fast">
                そして投球… <break time="0.3s"/> スイング、そしてライトへのフライ、これは大きいぞ！<break time="0.6s"/> 後ろへ、フェンス際… <break time="0.9s"/> 入った！<break time="0.4s"/> メッツ、連続ホームラン！<break time="0.2s"/> なんという瞬間だ！
                </prosody>
                </speak>
                ```

            **Original Text (English):**
            {text}

            **Target Language:** {target_language_code}

            **Video:** {video_uri}
            """

        # Construct the multimodal prompt, referencing the video by URI
        request = [
            Part.from_uri(video_uri, mime_type="video/mp4"),
            prompt,
        ]

        config = GenerationConfig(
            max_output_tokens=2048,
            temperature=0.4,
            top_p=0.8,
            top_k=40
        )

        response = model.generate_content(request, generation_config=config)

        # Extract SSML using regex
        match = re.search(r"<speak>.*?</speak>", response.text, re.DOTALL)
        if match:
            ssml_response = match.group(0).strip()
            return ssml_response
        else:
            logging.error(f"Could not extract SSML from model response: {response.text}")
            return None

    except Exception as e:
        logging.error(f"Error translating text: {e}")
        return None

def update_ssml_in_bigquery(client, play_id, es_ssml_response, ja_ssml_response):
    """Updates the SSML responses in BigQuery."""
    query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        SET 
            es_translation_ssml = @es_ssml_response,
            ja_translation_ssml = @ja_ssml_response
        WHERE play_id = @play_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("play_id", "STRING", play_id),
            bigquery.ScalarQueryParameter("es_ssml_response", "STRING", es_ssml_response),
            bigquery.ScalarQueryParameter("ja_ssml_response", "STRING", ja_ssml_response),
        ]
    )
    try:
        client.query(query, job_config=job_config).result()
        logging.info(f"SSML responses updated for play_id: {play_id}.")
    except Exception as e:
        logging.error(f"Error updating BigQuery for play_id {play_id}: {e}")

if __name__ == "__main__":
    query = f"""
        SELECT play_id, transcription
        FROM `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        WHERE (ja_translation_ssml IS NULL OR es_translation_ssml IS NULL) AND transcription != ''
    """
    results = bq_client.query(query).result()

    for row in results:
        play_id = row["play_id"]
        video_uri = f"gs://{BUCKET_NAME}/{VIDEO_FOLDER}/{play_id}.mp4"
        transcription = row["transcription"]

        # Translate to Spanish with natural pauses and emphasis (SSML)
        es_ssml_response = translate_with_ssml(video_uri, transcription, "es")
        if es_ssml_response:
            print(f"Play ID {play_id}: Spanish SSML Response =\n{es_ssml_response}\n")
        else:
            es_ssml_response = None

        # Translate to Japanese with natural pauses and emphasis (SSML)
        ja_ssml_response = translate_with_ssml(video_uri, transcription, "ja")
        if ja_ssml_response:
            print(f"Play ID {play_id}: Japanese SSML Response =\n{ja_ssml_response}\n")
        else:
            ja_ssml_response = None

        # Update SSML responses in BigQuery
        update_ssml_in_bigquery(bq_client, play_id, es_ssml_response, ja_ssml_response)
        time.sleep(1)
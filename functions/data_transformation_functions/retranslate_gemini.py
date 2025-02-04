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
MINIMUM_ACCEPTABLE_SCORE = 80.0
BUCKET_NAME = "mlbhackathon-fandugout"  # Your bucket name
VIDEO_FOLDER = "videos"  # The folder where videos are stored
# -----------------------

# Initialize BigQuery client
bq_client = bigquery.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def analyze_translation(video_uri, transcription, translation, language_code):
    """Analyzes translation coherence, now with video context from Cloud Storage URI."""
    try:
        analysis_prompts = {
            "es": """
                Evalúe la siguiente traducción de un comentario de béisbol *sobre un jonrón*, teniendo en cuenta el video proporcionado. Considere la coherencia, validez, precisión en la terminología del béisbol (especialmente relacionada con jonrones), manejo de modismos y el estilo/tono del comentario.

                Transcripción original (contexto): "{transcription}"
                Traducción: "{translation}"
                Video: "{video_uri}"

                Analice la traducción considerando los siguientes aspectos:
                1. Exactitud: ¿La traducción transmite con precisión el significado de la transcripción original, especialmente en el contexto del jonrón que se ve en el video?
                2. Fluidez: ¿La traducción se lee de forma natural y fluida en español?
                3. Relevancia Contextual: ¿La traducción mantiene el significado original y la emoción del jonrón dentro del contexto del béisbol, tal como se aprecia en el video?
                4. Terminología del Béisbol (Jonrones): ¿Los términos específicos del béisbol, como 'jonrón', 'batazo', 'cuadrangular', 'estadio', 'jardinero', etc., se traducen correctamente y de acuerdo con el uso estándar en español? ¿La traducción es consistente con la acción que se ve en el video?
                5. Modismos y Lenguaje Figurado: ¿Cómo se manejan los modismos y el lenguaje figurado relacionados con los jonrones (por ejemplo, 'la sacó del parque', 'se la botó', etc.)? ¿La traducción transmite el significado deseado y la emoción del momento, en concordancia con el video?
                6. Estilo del Comentario: ¿La traducción captura el tono emocionante y el estilo típico de un comentario de béisbol durante un jonrón, como se refleja en el video?
                7. Ambigüedad: Si la transcripción original es ambigua, ¿la traducción conserva esa ambigüedad de manera razonable?

                Proporcione un breve análisis basado en estos puntos. **No asigne una puntuación todavía.**

                Formato de respuesta:
                Análisis: <su análisis aquí>
            """,
            "ja": """
                提供されたビデオを考慮して、ホームランに関する野球実況の翻訳を評価してください。一貫性、有効性、野球用語（特にホームラン関連）の正確さ、慣用表現の扱い、実況のスタイル/トーンの観点から評価してください。

                オリジナルの実況 (コンテキスト): "{transcription}"
                翻訳: "{translation}"
                ビデオ: "{video_uri}"

                以下の点を考慮して翻訳を分析してください:
                1. 正確さ: 翻訳はオリジナルの実況の意味を、特にビデオに示されているホームランの文脈において正確に伝えていますか？
                2. 流暢さ: 翻訳は日本語として自然で流暢に読めますか？
                3. 文脈との関連性: 翻訳は、ビデオで見られるように、野球の文脈の中でホームランの元の意味と興奮を維持していますか？
                4. 野球用語 (ホームラン): 「ホームラン」、「打球」、「フェンス」、「外野手」など、野球特有の用語は、日本語の標準的な用法に従って正しく翻訳されていますか？翻訳はビデオに示されているアクションと一致していますか？
                5. 慣用表現: ホームランに関連する慣用表現や比喩的な表現 (例えば、「ボールがスタンドに吸い込まれた」、「特大のアーチ」、「場外弾」など) はどのように扱われていますか？翻訳は、ビデオと一致して、意図された意味と瞬間の興奮を伝えていますか？
                6. 実況のスタイル: 翻訳は、ビデオに反映されているように、ホームランの際の野球実況特有のエキサイティングな口調やスタイルを捉えていますか？
                7. 曖昧さ: オリジナルの実況が曖昧な場合、翻訳はその曖昧さを合理的な方法で保持していますか？

                これらの点に基づいて簡単な分析を提供してください。**まだスコアは割り当てないでください。**

                回答形式:
                分析: <あなたの分析をここに>
            """,
        }

        scoring_prompts = {
            "es": """
                Aquí hay un análisis de una traducción de un comentario de béisbol sobre un jonrón:

                "{analysis}"

                Video: "{video_uri}"

                Basado en este análisis y en el video, asigne una puntuación de sentido de 0 (sin sentido) a 10 (perfectamente clara, precisa, estilísticamente apropiada y alineada con el contexto del jonrón). Use la frase exacta "Puntuación de Sentido Final:" para indicar la puntuación.

                Formato de respuesta:
                Puntuación de Sentido Final: <puntuación>
            """,
            "ja": """
                以下は、ビデオと一緒にホームランに関する野球実況の翻訳の分析です:

                "{analysis}"

                ビデオ: "{video_uri}"

                この分析とビデオに基づいて、0 (無意味) から 10 (完全に明確で正確、文体的に適切、ホームランの文脈と一致) のセンススコアを割り当ててください。スコアを示すために、正確なフレーズ「最終センススコア:」を使用してください。

                Formato de respuesta:
                最終センススコア: <スコア>
            """,
        }

        if language_code not in analysis_prompts or language_code not in scoring_prompts:
            raise ValueError(f"Unsupported language code: {language_code}")

        # --- Stage 1: Analysis ---
        analysis_prompt = analysis_prompts[language_code].format(
            transcription=transcription, translation=translation, video_uri=video_uri
        )

        # Construct the multimodal prompt for analysis, referencing the video by URI
        request = [
            Part.from_uri(video_uri, mime_type="video/mp4"),
            analysis_prompt,
        ]

        config = GenerationConfig(max_output_tokens=256, temperature=0.1)
        analysis_response = model.generate_content(request, generation_config=config)

        # Extract the analysis part
        analysis = analysis_response.text.replace("Análisis:", "").strip()

        # --- Stage 2: Scoring ---
        scoring_prompt = scoring_prompts[language_code].format(analysis=analysis, video_uri=video_uri)

        # Construct the multimodal prompt for scoring, referencing the video by URI
        request = [
            Part.from_uri(video_uri, mime_type="video/mp4"),
            scoring_prompt,
        ]

        response = model.generate_content(request, generation_config=config)

        # Use regular expressions to find the score
        if language_code == "es":
            match = re.search(r"Puntuación de Sentido Final:\s*([\d.]+)", response.text)
        elif language_code == "ja":
            match = re.search(r"最終センススコア:\s*([\d.]+)", response.text)
        else:
            raise ValueError(f"Unsupported language code for regex matching: {language_code}")

        if match:
            try:
                score = float(match.group(1))
                return score
            except ValueError:
                logging.error(f"Could not parse score from matched text: {match.group(1)}")
                return None
        else:
            logging.error(
                f"Error: Could not find score in response using regex: {response.text}"
            )
            return None

    except Exception as e:
        logging.error(f"Error analyzing translation with context: {e}")
        return None

def retranslate(video_uri, text, target_language_code):
    """Translates text to the target language using a Vertex AI Gemini model, with video context from URI."""
    try:
        prompt = f"""
            You are a professional baseball announcer providing live commentary. Watch the provided video and then translate the following play description into the target language, using the style and tone of a real announcer in that language.

            Focus on using idiomatic expressions and common baseball terminology for the target language. The provided video should be used to capture the excitement of the moment!

            **EXTREMELY IMPORTANT: Provide ONLY the baseball commentary translation between the markers [START TRANSLATION] and [END TRANSLATION]. Do NOT include any other text, explanations, or preambles.**
            **Your response should contain only the markers and the translation. Nothing else.**
            **ABSOLUTELY DO NOT say 'Here is your commentary:' or 'Here is the translation' or 'Excellent work!' or anything like that.**
            **ABSOLUTELY DO NOT include any analysis or commentary about the quality of the description, such as 'This commentary is clear, concise...' or anything like that.**
            **Failure to follow these instructions will result in serious consequences.**

            Here are some examples to guide your translation:

            **Example 1:**

            *   **English:** High fly ball, right center field!  Streaking back, he's on the track, he's at the wall!  See ya!  A solo home run for Aaron Judge, and the New York Yankees take a 2 to 0 lead in the bottom of the first inning!
            *   **Spanish:** [START TRANSLATION] ¡Batazo alto al jardín derecho central! ¡Va para atrás, a la zona de seguridad, cerca de la barda! ¡Se va, se va, y se fue! ¡Cuadrangular solitario para Aaron Judge, y los Yankees de Nueva York toman la ventaja 2 a 0 en la parte baja de la primera entrada! [END TRANSLATION]
            *   **Japanese:** [START TRANSLATION] 高いフライボール、ライト・センター間！後ろに下がる！フェンス際だ！行ったー！アーロン・ジャッジのソロホームラン！ニューヨーク・ヤンキース、初回裏に2対0とリードを広げます! [END TRANSLATION]

            **Example 2:**

            *   **English:**  A screaming line drive down the left field line! It's gonna be extra bases! He's rounding second, heading for third... he's in there with a stand-up triple!
            *   **Spanish:** [START TRANSLATION] ¡Línea violenta por la raya del jardín izquierdo! ¡Serán extra bases! ¡Está doblando segunda, va para tercera... y llega quieto a tercera con un triple! [END TRANSLATION]
            *   **Japanese:** [START TRANSLATION] 痛烈なライナーがレフト線へ！長打コースだ！セカンドを回って、サードへ向かう…悠々セーフ、スリーベースヒットです！ [END TRANSLATION]

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

        # Extract commentary between markers
        match = re.search(r"\[START TRANSLATION](.*?)\[END TRANSLATION]", response.text, re.DOTALL)
        if match:
            commentary = match.group(1).strip()
        else:
            commentary = response.text
            logging.warning(f"Translation markers not found. Attempting preamble removal.")

        # Remove common preambles using regex
        preamble_patterns = [
            r"Sure, here is the \w+ translation.*?:",
            r"Here's the \w+ translation.*?:",
            r"Here is the \w+ translation.*?:",
            # Add more patterns as needed
        ]
        for pattern in preamble_patterns:
            commentary = re.sub(pattern, "", commentary, flags=re.IGNORECASE | re.DOTALL).strip()

        if commentary:
            return commentary
        else:
            logging.error(f"Error: Could not extract translation from model response: {response.text}")
            return None

    except Exception as e:
        logging.error(f"Error translating text: {e}")
        return None
    
def update_translation_and_scores_in_bigquery(client, play_id, es_translation, ja_translation, score_es, score_ja):
    """Updates the translations and sense scores in BigQuery."""
    query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        SET 
            es_translation = @es_translation,
            ja_translation = @ja_translation,
            es_sense_score = @es_sense_score,
            ja_sense_score = @ja_sense_score
        WHERE play_id = @play_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("play_id", "STRING", play_id),
            bigquery.ScalarQueryParameter("es_translation", "STRING", es_translation),
            bigquery.ScalarQueryParameter("ja_translation", "STRING", ja_translation),
            bigquery.ScalarQueryParameter("es_sense_score", "FLOAT", score_es),
            bigquery.ScalarQueryParameter("ja_sense_score", "FLOAT", score_ja),
        ]
    )
    try:
        client.query(query, job_config=job_config).result()
        logging.info(f"Scores and translations updated for play_id: {play_id}.")
    except Exception as e:
        logging.error(f"Error updating BigQuery for play_id {play_id}: {e}")

if __name__ == "__main__":
    query = f"""
        SELECT play_id, transcription, es_translation, ja_translation, es_sense_score, ja_sense_score
        FROM `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        WHERE es_translation IS NOT NULL AND ja_translation IS NOT NULL AND (es_translation like '%:%' OR ja_translation like '%e%' OR es_translation like '%here%' OR ja_translation like '%here%')
    """
    translations = bq_client.query(query).result()

    for row in translations:
        play_id = row["play_id"]
        video_uri = f"gs://{BUCKET_NAME}/{VIDEO_FOLDER}/{play_id}.mp4"
        transcription = row["transcription"]
        es_translation = row["es_translation"]
        ja_translation = row["ja_translation"]
        score_es = row["es_sense_score"]
        score_ja = row["ja_sense_score"]

        # Analyze and retranslate Spanish if necessary
        if score_es is None or score_es < MINIMUM_ACCEPTABLE_SCORE:
            logging.info(f"Play ID {play_id}: Analyzing Spanish translation...")
            # Only analyze if score is None
            if score_es is None:
                score_es = analyze_translation(video_uri, transcription, es_translation, "es")
                logging.info(f"Play ID {play_id}: Spanish Sense Score = {score_es}")

            if score_es is not None and score_es < MINIMUM_ACCEPTABLE_SCORE:
                logging.info(f"Play ID {play_id}: Retranslating Spanish (with video)...")
                new_es_translation = retranslate(video_uri, transcription, "es")
                if new_es_translation:
                    es_translation = new_es_translation  # Update the translation directly
                    print(f"New Spanish: {es_translation}")
            else:
                new_es_translation = es_translation  # Keep the original translation if score is acceptable
        else:
            new_es_translation = es_translation
            score_es = score_es if score_es is not None else analyze_translation(video_uri, transcription, es_translation, "es")

        # Analyze and retranslate Japanese if necessary
        if score_ja is None or score_ja < MINIMUM_ACCEPTABLE_SCORE:
            logging.info(f"Play ID {play_id}: Analyzing Japanese translation...")
            # Only analyze if score is None
            if score_ja is None:
              score_ja = analyze_translation(video_uri, transcription, ja_translation, "ja")
              logging.info(f"Play ID {play_id}: Japanese Sense Score = {score_ja}")

            if score_ja is not None and score_ja < MINIMUM_ACCEPTABLE_SCORE:
                logging.info(f"Play ID {play_id}: Retranslating Japanese (with video)...")
                new_ja_translation = retranslate(video_uri, transcription, "ja")
                if new_ja_translation:
                    ja_translation = new_ja_translation  # Update the translation directly
                    print(f"New Japanese: {ja_translation}")
            else:
                new_ja_translation = ja_translation  # Keep the original translation if score is acceptable
        else:
            new_ja_translation = ja_translation
            score_ja = score_ja if score_ja is not None else analyze_translation(video_uri, transcription, ja_translation, "ja")

        # Update scores and translations in BigQuery
        update_translation_and_scores_in_bigquery(
            bq_client,
            play_id,
            es_translation,
            ja_translation,
            score_es,
            score_ja
        )
        time.sleep(1)
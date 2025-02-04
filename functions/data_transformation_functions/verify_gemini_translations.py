from google.cloud import bigquery
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import logging
import time
import re

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"
LOCATION = "us-central1"
DATASET_NAME = "mlbplayerstats"
TABLE_NAME = "mlbhrplaydata"
MODEL_NAME = "gemini-1.5-pro-002"
# -----------------------

# Initialize BigQuery client
bq_client = bigquery.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def analyze_translation(transcription, translation, language_code):
    """Analyzes translation coherence with context from the transcription."""
    try:
        analysis_prompts = {
            "es": """
                Evalúe la siguiente traducción de un comentario de béisbol *sobre un jonrón* por coherencia, validez, precisión en la terminología del béisbol (especialmente relacionada con jonrones), manejo de modismos y el estilo/tono del comentario.

                Transcripción original (contexto): "{transcription}"
                Traducción: "{translation}"

                Analice la traducción considerando los siguientes aspectos:
                1. Exactitud: ¿La traducción transmite con precisión el significado de la transcripción original, especialmente en el contexto de un jonrón?
                2. Fluidez: ¿La traducción se lee de forma natural y fluida en español?
                3. Relevancia Contextual: ¿La traducción mantiene el significado original y la emoción de un jonrón dentro del contexto del béisbol?
                4. Terminología del Béisbol (Jonrones): ¿Los términos específicos del béisbol, como 'jonrón', 'batazo', 'cuadrangular', 'estadio', 'jardinero', etc., se traducen correctamente y de acuerdo con el uso estándar en español? Preste especial atención a cómo se describe la acción del jonrón.
                5. Modismos y Lenguaje Figurado: ¿Cómo se manejan los modismos y el lenguaje figurado relacionados con los jonrones (por ejemplo, 'la sacó del parque', 'se la botó', etc.)? ¿La traducción transmite el significado deseado y la emoción del momento?
                6. Estilo del Comentario: ¿La traducción captura el tono emocionante y el estilo típico de un comentario de béisbol durante un jonrón?
                7. Ambigüedad: Si la transcripción original es ambigua, ¿la traducción conserva esa ambigüedad de manera razonable?

                Proporcione un breve análisis basado en estos puntos. **No asigne una puntuación todavía.**

                Formato de respuesta:
                Análisis: <su análisis aquí>
            """,
            "ja": """
                以下はホームランに関する野球実況の翻訳です。一貫性、有効性、野球用語（特にホームラン関連）の正確さ、慣用表現の扱い、実況のスタイル/トーンの観点から評価してください。

                オリジナルの実況 (コンテキスト): "{transcription}"
                翻訳: "{translation}"

                以下の点を考慮して翻訳を分析してください:
                1. 正確さ: 翻訳はオリジナルの実況の意味を、特にホームランの文脈において正確に伝えていますか？
                2. 流暢さ: 翻訳は日本語として自然で流暢に読めますか？
                3. 文脈との関連性: 翻訳は野球の文脈の中で、ホームランの元の意味と興奮を維持していますか？
                4. 野球用語 (ホームラン): 「ホームラン」、「打球」、「フェンス」、「外野手」など、野球特有の用語は、日本語の標準的な用法に従って正しく翻訳されていますか？特に、ホームランの動作がどのように説明されているかに注意してください。
                5. 慣用表現: ホームランに関連する慣用表現や比喩的な表現 (例えば、「ボールがスタンドに吸い込まれた」、「特大のアーチ」、「場外弾」など) はどのように扱われていますか？翻訳は意図された意味と瞬間の興奮を伝えていますか？
                6. 実況のスタイル: 翻訳はホームランの際の野球実況特有のエキサイティングな口調やスタイルを捉えていますか？
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

                Basado en este análisis, asigne una puntuación de sentido de 0 (sin sentido) a 10 (perfectamente clara, precisa, estilísticamente apropiada y alineada con el contexto de un jonrón). Use la frase exacta "Puntuación de Sentido Final:" para indicar la puntuación.

                Formato de respuesta:
                Puntuación de Sentido Final: <puntuación>
            """,
            "ja": """
                以下はホームランに関する野球実況の翻訳の分析です:

                "{analysis}"

                この分析に基づいて、0 (無意味) から 10 (完全に明確で正確、文体的に適切、ホームランの文脈と一致) のセンススコアを割り当ててください。スコアを示すために、正確なフレーズ「最終センススコア:」を使用してください。

                回答形式:
                最終センススコア: <スコア>
            """,
        }

        if language_code not in analysis_prompts or language_code not in scoring_prompts:
            raise ValueError(f"Unsupported language code: {language_code}")

        # --- Stage 1: Analysis ---
        analysis_prompt = analysis_prompts[language_code].format(
            transcription=transcription, translation=translation
        )
        config = GenerationConfig(max_output_tokens=256, temperature=0.1)
        analysis_response = model.generate_content(analysis_prompt, generation_config=config)

        # Extract the analysis part
        analysis = analysis_response.text.replace("Análisis:", "").strip()

        # --- Stage 2: Scoring ---
        scoring_prompt = scoring_prompts[language_code].format(analysis=analysis)
        response = model.generate_content(scoring_prompt, generation_config=config)

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
                print(f"Could not parse score from matched text: {match.group(1)}")
                return None
        else:
            print(
                f"Error: Could not find score in response using regex: {response.text}"
            )
            return None

    except Exception as e:
        print(f"Error analyzing translation with context: {e}")
        time.sleep(60)
        return analyze_translation(transcription, translation, language_code)
    
def update_translation_scores_in_bigquery(client, play_id, score_es, score_ja):
    """Updates the sense scores for Spanish and Japanese translations in BigQuery."""
    query = f"""
        UPDATE `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        SET es_sense_score = @es_sense_score, ja_sense_score = @ja_sense_score
        WHERE play_id = @play_id
    """
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("play_id", "STRING", play_id),
            bigquery.ScalarQueryParameter("es_sense_score", "FLOAT", score_es),
            bigquery.ScalarQueryParameter("ja_sense_score", "FLOAT", score_ja),
        ]
    )
    try:
        client.query(query, job_config=job_config).result()
        logging.info(f"Scores updated for play_id: {play_id}.")
    except Exception as e:
        logging.error(f"Error updating BigQuery for play_id {play_id}: {e}")

if __name__ == "__main__":
    query = f"""
        SELECT play_id, transcription, es_translation, ja_translation
        FROM `{PROJECT_ID}.{DATASET_NAME}.{TABLE_NAME}`
        WHERE es_translation IS NOT NULL AND ja_translation IS NOT NULL AND (es_sense_score IS NULL OR ja_sense_score IS NULL);
    """
    translations = bq_client.query(query).result()
    if translations:
        for row in translations:
            play_id = row["play_id"]
            transcription = row["transcription"]
            es_translation = row["es_translation"]
            ja_translation = row["ja_translation"]

            # Analyze Spanish translation
            score_es = analyze_translation(transcription, es_translation, "es")
            if score_es is not None:
                print(f"Play ID {play_id}: Spanish Sense Score = {score_es}")

            # Analyze Japanese translation
            score_ja = analyze_translation(transcription, ja_translation, "ja")
            if score_ja is not None:
                print(f"Play ID {play_id}: Japanese Sense Score = {score_ja}")

            # Update scores in BigQuery
            if score_es is not None and score_ja is not None:
                update_translation_scores_in_bigquery(bq_client, play_id, score_es, score_ja)
            else:
                print("Score is not available for one of the languages.")
            time.sleep(1)
    else:
        print("No translations found.")


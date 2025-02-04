import feedparser
from google.cloud import firestore
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Part
import requests
from bs4 import BeautifulSoup
import datetime
import hashlib
import base64
import logging
import pytz
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
PROJECT_ID = "mlbhackathon-445616"  # Replace with your project ID
LOCATION = "us-central1"  # Replace with your preferred location
COLLECTION_NAME = "articles"  # Target the 'articlesNew' collection
MODEL_NAME = "gemini-1.5-pro-002"  # Or another suitable model
# -----------------------

# Initialize Firestore client
db = firestore.Client(project=PROJECT_ID)

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)
model = GenerativeModel(MODEL_NAME)

def process_rss_and_summarize():
    """
    Processes RSS feeds, extracts articles, generates summaries and translations using Vertex AI,
    and stores articles with their summaries in Firestore ('articles' collection).
    Only adds new articles from today, adds a 'pubtime' attribute. Designed for local execution.
    """
    try:
        # Define RSS feeds for MLB teams
        rss_feeds = {
            "MLB": "https://www.mlb.com/feeds/news/rss.xml",
            "Arizona Diamondbacks": "https://www.mlb.com/dbacks/feeds/news/rss.xml",
            "Atlanta Braves": "https://www.mlb.com/braves/feeds/news/rss.xml",
            "Baltimore Orioles": "https://www.mlb.com/orioles/feeds/news/rss.xml",
            "Boston Red Sox": "https://www.mlb.com/redsox/feeds/news/rss.xml",
            "Chicago Cubs": "https://www.mlb.com/cubs/feeds/news/rss.xml",
            "Chicago White Sox": "https://www.mlb.com/whitesox/feeds/news/rss.xml",
            "Cincinnati Reds": "https://www.mlb.com/reds/feeds/news/rss.xml",
            "Cleveland Guardians": "https://www.mlb.com/guardians/feeds/news/rss.xml",
            "Colorado Rockies": "https://www.mlb.com/rockies/feeds/news/rss.xml",
            "Detroit Tigers": "https://www.mlb.com/tigers/feeds/news/rss.xml",
            "Houston Astros": "https://www.mlb.com/astros/feeds/news/rss.xml",
            "Kansas City Royals": "https://www.mlb.com/royals/feeds/news/rss.xml",
            "Los Angeles Angels": "https://www.mlb.com/angels/feeds/news/rss.xml",
            "Los Angeles Dodgers": "https://www.mlb.com/dodgers/feeds/news/rss.xml",
            "Miami Marlins": "https://www.mlb.com/marlins/feeds/news/rss.xml",
            "Milwaukee Brewers": "https://www.mlb.com/brewers/feeds/news/rss.xml",
            "Minnesota Twins": "https://www.mlb.com/twins/feeds/news/rss.xml",
            "New York Mets": "https://www.mlb.com/mets/feeds/news/rss.xml",
            "New York Yankees": "https://www.mlb.com/yankees/feeds/news/rss.xml",
            "Oakland Athletics": "https://www.mlb.com/athletics/feeds/news/rss.xml",
            "Philadelphia Phillies": "https://www.mlb.com/phillies/feeds/news/rss.xml",
            "Pittsburgh Pirates": "https://www.mlb.com/pirates/feeds/news/rss.xml",
            "San Diego Padres": "https://www.mlb.com/padres/feeds/news/rss.xml",
            "San Francisco Giants": "https://www.mlb.com/giants/feeds/news/rss.xml",
            "Seattle Mariners": "https://www.mlb.com/mariners/feeds/news/rss.xml",
            "St. Louis Cardinals": "https://www.mlb.com/cardinals/feeds/news/rss.xml",
            "Tampa Bay Rays": "https://www.mlb.com/rays/feeds/news/rss.xml",
            "Texas Rangers": "https://www.mlb.com/rangers/feeds/news/rss.xml",
            "Toronto Blue Jays": "https://www.mlb.com/bluejays/feeds/news/rss.xml",
            "Washington Nationals": "https://www.mlb.com/nationals/feeds/news/rss.xml"
        }

        # Create 'articlesNew' collection reference
        new_articles_collection = db.collection(COLLECTION_NAME)

        # Get current time in UTC
        now = datetime.datetime.now(pytz.utc)

        for team_name, rss_url in rss_feeds.items():
            logging.info(f"Fetching feed for {team_name} from {rss_url}")
            feed = feedparser.parse(rss_url)
            logging.info(f"Feed parsed for {team_name}. Entries found: {len(feed.entries)}")

            for entry in feed.entries:
                # Convert pubDate to UTC datetime object
                try:
                    # Attempt to parse typical RSS date format
                    pubdate_str = entry.published
                    pubdate_dt = datetime.datetime.strptime(pubdate_str, '%a, %d %b %Y %H:%M:%S %Z').replace(tzinfo=pytz.utc)
                except ValueError:
                    try:
                        # Attempt to parse a different date format if the common one fails.
                        pubdate_str = entry.dc_date
                        pubdate_dt = datetime.datetime.strptime(pubdate_str, '%Y-%m-%dT%H:%M:%S%z').replace(tzinfo=pytz.utc)
                    except (AttributeError, ValueError):
                        logging.warning(f"Could not parse date for entry: {entry.title}. Using current time.")
                        pubdate_dt = now  # Default to current time if parsing fails

                # Check if article is from today (UTC)
                # if pubdate_dt.date() != now.date():
                #     logging.info(f"Skipping article '{entry.title}' from {pubdate_dt.date()} (not from today).")
                #     continue

                article_id = generate_article_id(entry.link)

                # Check if article already exists in Firestore using article ID
                existing_article = new_articles_collection.document(article_id).get()
                if existing_article.exists:
                    logging.info(f"Article with ID {article_id} already exists. Skipping.")
                    continue

                # Fetch article content
                article_content = fetch_article_content(entry.link)
                if not article_content:
                    logging.warning(f"Failed to fetch content for article: {entry.title}")
                    continue

                # Analyze entities (players) using Vertex AI
                entities = analyze_entities_vertex(article_content)
                print(entities);
                # Generate summary using Vertex AI
                summary = generate_summary_vertex(article_content)
                if not summary:
                    logging.warning(f"Failed to generate summary for article: {entry.title}")
                    continue

                # Translate title using Vertex AI
                translated_titles = translate_text_vertex(entry.title)
                
                # Translate summary using Vertex AI
                translated_summaries = translate_summary_vertex(summary)

                 # Store article and summary in Firestore
                doc_ref = new_articles_collection.document(article_id)
                titles_dict = {
                    "en": entry.title,
                    "es": translated_titles['es'],
                    "ja": translated_titles['ja']
                }

                doc_ref.set({
                    'team': team_name,
                    'titles': titles_dict,
                    'link': entry.link,
                    'published': pubdate_dt.isoformat(),  # Use the parsed pubdate_dt
                    'pubtime': pubdate_dt.isoformat(),  # Also store in 'pubtime' (redundant but as requested)
                    'content': article_content,
                    'entities': entities,  # You are currently setting this to an empty dictionary
                    'summary': translated_summaries,
                })
                logging.info(f"Article and summary stored for: {entry.title}")

    except Exception as e:
        logging.error(f"Error processing RSS feeds and generating summaries: {e}")

# --- Utility Functions (Modified for Local Execution and Vertex AI) ---

def generate_article_id(link):
    """Generates a unique ID for an article using its link."""
    hash_object = hashlib.sha256(link.encode("utf-8"))
    return base64.urlsafe_b64encode(hash_object.digest()).decode("utf-8").replace("=", "")

def fetch_article_content(url):
    """Fetches the full content of an article from the given URL."""
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")
        article_body = soup.find("article")
        if article_body:
            return " ".join(p.get_text() for p in article_body.find_all("p"))
        logging.warning(f"Could not extract content for URL: {url}")
        return ""
    except requests.exceptions.RequestException as e:
        logging.error(f"Error fetching article content: {e}")
        return None

def analyze_entities_vertex(text):
    """Analyzes entities in the given text using Vertex AI's Gemini model."""
    try:
        prompt = f"""
        You are a baseball expert. Extract the full names of professional baseball players and their associated team names from the provided text.

        - Only include players and teams that are explicitly mentioned.
        - If a player's team is not mentioned, do not include that player in the output.
        - Do not include any other information such as positions or commentary. 
        - Return the names in the following format, each player and their team on a new line:

        FirstName LastName, TeamName

        Text: {text}
        """
        response = model.generate_content(prompt)

        entities = {}
        for line in response.text.split('\n'):
            line = line.strip()
            if line and "," in line:
                try:
                    player_name, team_name = line.split(',')
                    entities[player_name.strip()] = team_name.strip()
                except ValueError:
                    logging.warning(f"Could not parse line: '{line}'")

        return entities

    except Exception as e:
        logging.error(f"Error analyzing entities with Vertex AI: {e}")
        return {}

def generate_summary_vertex(text):
    """Generates a summary for the given text using Vertex AI's Gemini model."""
    try:
        prompt = f"""
        Summarize the following article be as detailed but consice as possible.

        Article: {text}
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
        logging.error(f"Error generating summary with Vertex AI: {e}")
        return None

def translate_text_vertex(text):
    """Translates the text into Spanish and Japanese using Vertex AI's Gemini model."""
    translated_text = {}
    
    for target_language_code in ["es", "ja"]:
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
                temperature=0.0,
                top_p=0.1,
                top_k=10
            )

            response = model.generate_content(prompt, generation_config=config)
            translated_text[target_language_code] = response.text.strip()
        except Exception as e:
            logging.error(f"Error translating text to {target_language_code} with Vertex AI: {e}")
            if "429 Online prediction request quota exceeded" in str(e):
                time.sleep(60)  # Wait for quota to reset
                return translate_text_vertex(text)  # Retry translation
            translated_text[target_language_code] = "Translation not available"

    return translated_text

def translate_summary_vertex(summary):
    """Translates the summary into Spanish and Japanese using Vertex AI's Gemini model."""
    translated_summaries = {"en": summary}

    for target_language_code in ["es", "ja"]:
        try:
            prompt = f"""
            You are a highly skilled translator tasked with translating an English text into {target_language_code}.
            
            Your response MUST follow these strict rules:
            1. Output MUST be ONLY the translated text.
            2. Do NOT include any words, phrases, numbers, or characters other than the translated text.
            3. Do NOT include the target language name or any introductory phrases.
            4. The translated text MUST be accurate and natural in {target_language_code}.
            
            English Text to translate: "{summary}"
            """

            config = GenerationConfig(
                max_output_tokens=2048,
                temperature=0.0,
                top_p=0.1,
                top_k=10
            )

            response = model.generate_content(prompt, generation_config=config)
            translated_summaries[target_language_code] = response.text.strip()
        except Exception as e:
            logging.error(f"Error translating summary to {target_language_code} with Vertex AI: {e}")
            if "429 Online prediction request quota exceeded" in str(e):
                time.sleep(60)  # Wait for quota to reset
                translated_summaries.update(translate_summary_vertex(summary))  # Retry translation
            translated_summaries[target_language_code] = "Translation not available"

    return translated_summaries

# --- How to Run Locally ---
if __name__ == "__main__":
    process_rss_and_summarize()  # Call the function to process feeds
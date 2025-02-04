import pycurl
from io import BytesIO
import json
import uuid
import subprocess
import json
from google.cloud import storage
from google.cloud import firestore
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Image, Part
from time import sleep
import base64

# --- Project and Location Setup ---
PROJECT_ID = "mlbhackathon-445616"
LOCATION = "us-central1"
BUCKET_NAME = "mlbhackathon-fandugout" 
FIRESTORE_COLLECTION = "baseball-plays"
IMAGEN_MODEL_NAME = "imagen-3.0-generate-001"  

# --- Initialize Cloud Storage, Firestore, and Vertex AI ---
storage_client = storage.Client(project=PROJECT_ID)
firestore_client = firestore.Client(project=PROJECT_ID)
vertexai.init(project=PROJECT_ID, location=LOCATION)

# --- Function to Generate Image Prompts with Gemini ---
def generate_baseball_image_prompt_with_gemini(scenario, strategy):
    """Generates an image prompt using the Gemini model."""
    try:
        prompt = f"""
        You are a baseball expert tasked with describing baseball scenarios visually for image generation.

        Create a detailed image prompt that illustrates the following:
        **Style: Cartoon**

        Scenario: {scenario}
        Strategy: {strategy}

        The prompt should specify:
        - The exact positioning of all players (batter, runners, fielders) on the field. Be very specific about their locations.
        - The perspective of the image (e.g., "top-down view", "view from behind home plate", "side view from the first base line").
        - Details about the game situation: score, inning, number of outs.
        - The type of baseball field (e.g., "major league baseball field", "little league field").
        - Any other relevant visual details that would help an image generation model create an accurate and informative image.

        Example:
        Scenario: Runner on second, one out, down by one run in the 9th inning.
        Strategy: Hit and Run
        Output: "Top-down view of a major league baseball diamond, runner on second base taking a big lead and breaking for third on the pitch, right-handed batter at home plate swinging to hit the ball to the right side, shortstop moving to cover second base, first baseman holding the bag, score is 3-4 in the bottom of the 9th inning, one out."
        """
        model = GenerativeModel("gemini-1.5-pro-002")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating image prompt with Gemini: {e}")
        return None

# --- Function to Generate Images with Vertex AI Imagen (using pycurl) ---
def generate_image_with_vertex_imagen(image_prompt):
    """Generates an image using the Vertex AI Imagen model via pycurl."""
    curl = None  # Initialize curl to avoid UnboundLocalError
    try:
        # Create the request JSON
        request_data = {
            "instances": [{"prompt": image_prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": "16:9"
            }
        }
        # Get the access token using gcloud
        process = subprocess.run(
            [r"C:\Users\seanc\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd", "auth", "print-access-token"],
            capture_output=True,
            text=True,
            check=True
        )
        access_token = process.stdout.strip()

        # Vertex AI endpoint
        url = f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{IMAGEN_MODEL_NAME}:predict"

        # Prepare the pycurl request
        response_buffer = BytesIO()
        curl = pycurl.Curl()
        curl.setopt(curl.URL, url)
        curl.setopt(curl.POST, True)
        curl.setopt(curl.HTTPHEADER, [
            f"Authorization: Bearer {access_token}",
            "Content-Type: application/json; charset=utf-8"
        ])
        curl.setopt(curl.POSTFIELDS, json.dumps(request_data))
        curl.setopt(curl.WRITEDATA, response_buffer)

        # Execute the request
        curl.perform()

        # Check for errors
        status_code = curl.getinfo(pycurl.RESPONSE_CODE)

        if status_code != 200:
            print(f"Error in pycurl request, status code: {status_code}")
            return None

        # Parse the response
        response_data = response_buffer.getvalue().decode("utf-8")
        response_json = json.loads(response_data)
        print("Response JSON:", response_json)

        # Extract the base64-encoded image data
        if "predictions" in response_json:
            for prediction in response_json["predictions"]:
                if "bytesBase64Encoded" in prediction:
                    image_data_base64 = prediction["bytesBase64Encoded"]
                    # Decode the base64 string to bytes
                    image_data = base64.b64decode(image_data_base64)
                    return image_data

        print("No image data found in response.")
        return None

    except subprocess.CalledProcessError as e:
        print(f"Error getting access token: {e.stderr}")
        return None
    except Exception as e:
        print(f"Error generating image with Vertex AI Imagen: {e}")
        return None
    finally:
        if curl:
            curl.close()

# --- Function to Store Images in Cloud Storage ---
def store_image_in_gcs(image_data, file_name):
    """Stores the image in Google Cloud Storage."""
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        blob = bucket.blob(file_name)
        blob.upload_from_string(image_data, content_type="image/png")
        blob.make_public()
        return blob.public_url
    except Exception as e:
        print(f"Error storing image in GCS: {e}")
        return None

# --- Function to Generate Explanations with Gemini ---
def generate_explanation_with_gemini(scenario, strategy):
    """Generates an explanation using the Gemini model."""
    try:
        prompt = f"""
        You are a baseball expert. Explain why the following strategy is used in this scenario:

        Scenario: {scenario}
        Strategy: {strategy}

        Provide a detailed explanation that considers:
        - The potential advantages of using this strategy in this situation.
        - The possible risks or drawbacks.
        - How the game situation (score, inning, outs, runners on base) influences the decision.
        - Any other relevant factors that a baseball coach or player would consider.

        Example:
        Scenario: Runner on first, no outs, tie game in the 7th inning
        Strategy: Sacrifice Bunt
        Explanation: In this scenario, a sacrifice bunt is often used to advance the runner to second base, putting them in scoring position. With no outs, the batting team is willing to trade an out for the chance to have a runner on second with the heart of their order coming up. The tie score in the 7th inning makes it a medium-leverage situation where manufacturing a run becomes more important. The potential drawbacks are that it essentially gives the other team an out, and if the bunt is unsuccessful, it could lead to a double play. However, the potential reward of having a runner in scoring position with one out often outweighs the risks in this situation.
        """
        model = GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating explanation with Gemini: {e}")
        return None

# --- Function to Store Data in Firestore ---
def store_data_in_firestore(scenario, strategy, explanation, image_url):
    """Stores the data in Firestore."""
    try:
        doc_ref = firestore_client.collection(FIRESTORE_COLLECTION).document()
        doc_ref.set({
            "scenario": scenario,
            "strategy": strategy,
            "explanation": explanation,
            "image_url": image_url,
            "timestamp": firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"Error storing data in Firestore: {e}")

# --- Main Function to Generate and Store Baseball Play Data ---
def generate_and_store_baseball_play(scenario, strategy):
    """Generates a prompt, image, stores image in GCS, and data in Firestore."""
    print(f"\n--- Scenario: {scenario} | Strategy: {strategy} ---")

    image_prompt = generate_baseball_image_prompt_with_gemini(scenario, strategy)
    if image_prompt is None:
        return
    print(f"\nGenerated Image Prompt:\n{image_prompt}")

    image_data = generate_image_with_vertex_imagen(image_prompt)
    if image_data is None:
        print("Error generating image with Vertex AI Imagen.")
        return

    image_file_name = f"baseball-play-{uuid.uuid4()}.png"  # Using PNG here
    image_url = store_image_in_gcs(image_data, image_file_name)
    if image_url is None:
        return
    print(f"\nImage stored in GCS: {image_url}")

    explanation = generate_explanation_with_gemini(scenario, strategy)
    if explanation is None:
        return
    print(f"\nGenerated Explanation:\n{explanation}")

    store_data_in_firestore(scenario, strategy, explanation, image_url)
    print(f"\nData stored in Firestore")

# --- Example Usage ---
scenario_strategy_list = [
    ("Runner on first, no outs, tie game in the 7th inning", "Sacrifice Bunt"),
    ("Left-handed power hitter at the plate, two outs", "Defensive Shift (Standard)"),
    ("Runner on first, one out, down by two runs in the 8th", "Hit and Run"),
    ("Fast runner on first, pitcher with a slow delivery, two outs", "Base Stealing"),
]

for scenario, strategy in scenario_strategy_list:
    generate_and_store_baseball_play(scenario, strategy)
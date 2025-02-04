from google.cloud import firestore
import hashlib
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Firestore client
db = firestore.Client(project="mlbhackathon-445616")

def generate_title_id(title):
    """Generates a unique ID for an article based on its title (for deduplication)."""
    hash_object = hashlib.sha256(title.encode("utf-8"))
    return base64.urlsafe_b64encode(hash_object.digest()).decode("utf-8").replace("=", "")

def move_deduped_articles():
    """
    Moves deduplicated articles from 'articlesNew' back to 'articles', 
    keeping the 'titles' array structure.
    """
    source_collection_ref = db.collection("rewardsCollection")  # Source collection
    destination_collection_ref = db.collection("rewards")  # Destination collection

    # Iterate through existing articles in the source collection
    for doc in source_collection_ref.stream():
        article_data = doc.to_dict()

        # No need for deduplication logic here, as 'articlesNew' should 
        # already contain unique articles.

        # Ensure 'titles' array exists
        # if 'titles' not in article_data:
        #     logging.warning(f"Article {doc.id} is missing 'titles' array. Skipping.")
        #     continue

        # Move the document to the destination collection
        destination_collection_ref.document(doc.id).set(article_data)
        # logging.info(f"Moved article '{article_data['titles'][0]['text']}' (ID: {doc.id}) to 'articles'.")

        # Delete the document from the source collection
        # doc.reference.delete()
        # logging.info(f"Deleted article '{article_data['titles'][0]['text']}' (ID: {doc.id}) from 'articlesNew'.")

# To run the migration:
if __name__ == "__main__":
    move_deduped_articles()
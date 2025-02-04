from google.cloud import firestore

# Initialize Firestore client
db = firestore.Client(project="mlbhackathon-445616")

TEAM_NAME_MAPPING = {
    "Orioles": "Baltimore Orioles",
    "Blue Jays": "Toronto Blue Jays",
    "Yankees": "New York Yankees",
    "Red Sox": "Boston Red Sox",
    "Mets": "New York Mets",
    "Dodgers": "Los Angeles Dodgers",
    "Rays": "Tampa Bay Rays",
    "D-backs": "Arizona Diamondbacks",
    "Diamondbacks": "Arizona Diamondbacks",
    "Astros": "Houston Astros",
    "Reds": "Cincinnati Reds",
    "Cardinals": "St. Louis Cardinals",
    "Angels": "Los Angeles Angels",
    "White Sox": "Chicago White Sox",
    "Guardians": "Cleveland Guardians",
    "Tigers": "Detroit Tigers",
    "Royals": "Kansas City Royals",
    "Twins": "Minnesota Twins",
    "Athletics": "Oakland Athletics",
    "Mariners": "Seattle Mariners",
    "Marlins": "Miami Marlins",
    "Braves": "Atlanta Braves",
    "Phillies": "Philadelphia Phillies",
    "Pirates": "Pittsburgh Pirates",
    "Padres": "San Diego Padres",
    "Giants": "San Francisco Giants",
    "Cubs": "Chicago Cubs",
    "Rockies": "Colorado Rockies",
    "Nationals": "Washington Nationals",
    "Rangers": "Texas Rangers",
    "Brewers": "Milwaukee Brewers"
}

def process_articles():
    """Fetch articles, extract entities, and store full article data in playerArticles & teamArticles."""
    
    # Step 1: Fetch all articles from Firestore
    articles_ref = db.collection("articles")
    articles = articles_ref.stream()

    for article in articles:
        article_id = article.id  # Use Firestore document ID as article_id
        article_data = article.to_dict()
        
        if "entities" not in article_data:
            continue  # Skip articles without entity data

        # Extracting Player & Team Entities
        entities = article_data.pop("entities", {})  # Remove entities before storing

        players = []
        teams = []
        
        for entity, team in entities.items():
            if team in TEAM_NAME_MAPPING:
                teams.append(TEAM_NAME_MAPPING[team])  # Convert team name to full format
            players.append(entity)  # Player names are stored directly

        # Step 2: Insert full article into PlayerArticles Collection
        for player in players:
            player_ref = db.collection("playerArticles").document(player).collection("articles").document(article_id)
            player_ref.set(article_data, merge=True)  # Store full article data

        # Step 3: Insert full article into TeamArticles Collection
        for team in teams:
            team_ref = db.collection("teamArticles").document(team).collection("articles").document(article_id)
            team_ref.set(article_data, merge=True)  # Store full article data

        print(f"✅ Processed article: {article_id}")

# Run the script
process_articles()
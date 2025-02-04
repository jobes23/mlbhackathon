import firebase_admin
from firebase_admin import credentials, firestore
import random

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred, {"projectId": "mlbhackathon-445616"})

db = firestore.client()
TEAM_BET_COLLECTION = "teamBetCollection"

team_data = [
    # World Series Odds
    {"market": "World Series Winner", "team": "Los Angeles Dodgers", "odds": {"FanDuel": "+250", "BetMGM": "+260", "DraftKings": "+255"}},
    {"market": "World Series Winner", "team": "New York Yankees", "odds": {"FanDuel": "+750", "BetMGM": "+760", "DraftKings": "+740"}},
    {"market": "World Series Winner", "team": "Atlanta Braves", "odds": {"FanDuel": "+900", "BetMGM": "+910", "DraftKings": "+895"}},
    {"market": "World Series Winner", "team": "Philadelphia Phillies", "odds": {"FanDuel": "+1100", "BetMGM": "+1120", "DraftKings": "+1090"}},
    {"market": "World Series Winner", "team": "New York Mets", "odds": {"FanDuel": "+1200", "BetMGM": "+1210", "DraftKings": "+1180"}},
    {"market": "World Series Winner", "team": "San Diego Padres", "odds": {"FanDuel": "+2100", "BetMGM": "+2120", "DraftKings": "+2090"}},
    {"market": "World Series Winner", "team": "Houston Astros", "odds": {"FanDuel": "+2100", "BetMGM": "+2150", "DraftKings": "+2130"}},
    {"market": "World Series Winner", "team": "Baltimore Orioles", "odds": {"FanDuel": "+1400", "BetMGM": "+1420", "DraftKings": "+1380"}},
    {"market": "World Series Winner", "team": "Texas Rangers", "odds": {"FanDuel": "+2400", "BetMGM": "+2450", "DraftKings": "+2390"}},
    {"market": "World Series Winner", "team": "Seattle Mariners", "odds": {"FanDuel": "+2600", "BetMGM": "+2620", "DraftKings": "+2590"}},
    {"market": "World Series Winner", "team": "Boston Red Sox", "odds": {"FanDuel": "+2700", "BetMGM": "+2750", "DraftKings": "+2690"}},
    {"market": "World Series Winner", "team": "Minnesota Twins", "odds": {"FanDuel": "+2900", "BetMGM": "+2950", "DraftKings": "+2890"}},
    {"market": "World Series Winner", "team": "Chicago Cubs", "odds": {"FanDuel": "+3000", "BetMGM": "+3100", "DraftKings": "+2990"}},
    {"market": "World Series Winner", "team": "Arizona Diamondbacks", "odds": {"FanDuel": "+3000", "BetMGM": "+3050", "DraftKings": "+2990"}},
    {"market": "World Series Winner", "team": "Detroit Tigers", "odds": {"FanDuel": "+3000", "BetMGM": "+3080", "DraftKings": "+2970"}},
    {"market": "World Series Winner", "team": "Cleveland Guardians", "odds": {"FanDuel": "+3500", "BetMGM": "+3550", "DraftKings": "+3480"}},
    {"market": "World Series Winner", "team": "Kansas City Royals", "odds": {"FanDuel": "+4000", "BetMGM": "+4100", "DraftKings": "+3980"}},
    {"market": "World Series Winner", "team": "Milwaukee Brewers", "odds": {"FanDuel": "+4100", "BetMGM": "+4120", "DraftKings": "+4080"}},
    {"market": "World Series Winner", "team": "Tampa Bay Rays", "odds": {"FanDuel": "+4200", "BetMGM": "+4250", "DraftKings": "+4190"}},
    {"market": "World Series Winner", "team": "Toronto Blue Jays", "odds": {"FanDuel": "+5500", "BetMGM": "+5550", "DraftKings": "+5480"}},
    {"market": "World Series Winner", "team": "San Francisco Giants", "odds": {"FanDuel": "+9000", "BetMGM": "+9050", "DraftKings": "+8950"}},
    {"market": "World Series Winner", "team": "Cincinnati Reds", "odds": {"FanDuel": "+7000", "BetMGM": "+7100", "DraftKings": "+6980"}},
    {"market": "World Series Winner", "team": "Pittsburgh Pirates", "odds": {"FanDuel": "+12000", "BetMGM": "+12500", "DraftKings": "+11800"}},
    {"market": "World Series Winner", "team": "St. Louis Cardinals", "odds": {"FanDuel": "+13000", "BetMGM": "+13500", "DraftKings": "+12800"}},
    {"market": "World Series Winner", "team": "Los Angeles Angels", "odds": {"FanDuel": "+18000", "BetMGM": "+18500", "DraftKings": "+17900"}},
    {"market": "World Series Winner", "team": "Washington Nationals", "odds": {"FanDuel": "+32000", "BetMGM": "+32500", "DraftKings": "+31800"}},
    {"market": "World Series Winner", "team": "Miami Marlins", "odds": {"FanDuel": "+50000", "BetMGM": "+50500", "DraftKings": "+49800"}},
    {"market": "World Series Winner", "team": "Oakland Athletics", "odds": {"FanDuel": "+21000", "BetMGM": "+21500", "DraftKings": "+20800"}},
    {"market": "World Series Winner", "team": "Colorado Rockies", "odds": {"FanDuel": "+50000", "BetMGM": "+50500", "DraftKings": "+49800"}},
    {"market": "World Series Winner", "team": "Chicago White Sox", "odds": {"FanDuel": "+50000", "BetMGM": "+50500", "DraftKings": "+49800"}},
    # Division Winners
    {
        "market": "Divisional Winner",
        "division": "AL East",
        "team": "New York Yankees",
        "odds": {
        "FanDuel": "-105",
        "BetMGM": "-110",
        "DraftKings": "-100",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL East",
        "team": "Baltimore Orioles",
        "odds": {
        "FanDuel": "+260",
        "BetMGM": "+250",
        "DraftKings": "+270",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL East",
        "team": "Boston Red Sox",
        "odds": {
        "FanDuel": "+500",
        "BetMGM": "+510",
        "DraftKings": "+495",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL East",
        "team": "Tampa Bay Rays",
        "odds": {
        "FanDuel": "+950",
        "BetMGM": "+940",
        "DraftKings": "+960",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL East",
        "team": "Toronto Blue Jays",
        "odds": {
        "FanDuel": "+1600",
        "BetMGM": "+1580",
        "DraftKings": "+1620",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL Central",
        "team": "Minnesota Twins",
        "odds": {
        "FanDuel": "+200",
        "BetMGM": "+195",
        "DraftKings": "+205",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL Central",
        "team": "Detroit Tigers",
        "odds": {
        "FanDuel": "+250",
        "BetMGM": "+245",
        "DraftKings": "+255",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL Central",
        "team": "Cleveland Guardians",
        "odds": {
        "FanDuel": "+280",
        "BetMGM": "+275",
        "DraftKings": "+285",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL Central",
        "team": "Kansas City Royals",
        "odds": {
        "FanDuel": "+300",
        "BetMGM": "+310",
        "DraftKings": "+290",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL Central",
        "team": "Chicago White Sox",
        "odds": {
        "FanDuel": "+25000",
        "BetMGM": "+24900",
        "DraftKings": "+25100",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL West",
        "team": "Houston Astros",
        "odds": {
        "FanDuel": "+165",
        "BetMGM": "+160",
        "DraftKings": "+170",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL West",
        "team": "Seattle Mariners",
        "odds": {
        "FanDuel": "+200",
        "BetMGM": "+195",
        "DraftKings": "+205",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL West",
        "team": "Texas Rangers",
        "odds": {
        "FanDuel": "+200",
        "BetMGM": "+190",
        "DraftKings": "+210",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL West",
        "team": "Los Angeles Angels",
        "odds": {
        "FanDuel": "+1800",
        "BetMGM": "+1750",
        "DraftKings": "+1850",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "AL West",
        "team": "Oakland Athletics",
        "odds": {
        "FanDuel": "+2200",
        "BetMGM": "+2150",
        "DraftKings": "+2250",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL East",
        "team": "Atlanta Braves",
        "odds": {
        "FanDuel": "+135",
        "BetMGM": "+130",
        "DraftKings": "+140",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL East",
        "team": "Philadelphia Phillies",
        "odds": {
        "FanDuel": "+180",
        "BetMGM": "+175",
        "DraftKings": "+185",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL East",
        "team": "New York Mets",
        "odds": {
        "FanDuel": "+210",
        "BetMGM": "+205",
        "DraftKings": "+215",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL East",
        "team": "Washington Nationals",
        "odds": {
        "FanDuel": "+10000",
        "BetMGM": "+9800",
        "DraftKings": "+10200",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL East",
        "team": "Miami Marlins",
        "odds": {
        "FanDuel": "+24000",
        "BetMGM": "+23900",
        "DraftKings": "+24100",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL Central",
        "team": "Chicago Cubs",
        "odds": {
        "FanDuel": "+115",
        "BetMGM": "+110",
        "DraftKings": "+120",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL Central",
        "team": "Milwaukee Brewers",
        "odds": {
        "FanDuel": "+250",
        "BetMGM": "+245",
        "DraftKings": "+255",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL Central",
        "team": "Cincinnati Reds",
        "odds": {
        "FanDuel": "+450",
        "BetMGM": "+440",
        "DraftKings": "+460",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL Central",
        "team": "Pittsburgh Pirates",
        "odds": {
        "FanDuel": "+900",
        "BetMGM": "+880",
        "DraftKings": "+920",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL Central",
        "team": "St. Louis Cardinals",
        "odds": {
        "FanDuel": "+900",
        "BetMGM": "+890",
        "DraftKings": "+910",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL West",
        "team": "Los Angeles Dodgers",
        "odds": {
        "FanDuel": "-490",
        "BetMGM": "-500",
        "DraftKings": "-480",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL West",
        "team": "San Diego Padres",
        "odds": {
        "FanDuel": "+600",
        "BetMGM": "+590",
        "DraftKings": "+610",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL West",
        "team": "Arizona Diamondbacks",
        "odds": {
        "FanDuel": "+1100",
        "BetMGM": "+1000",
        "DraftKings": "+1300",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL West",
        "team": "San Francisco Giants",
        "odds": {
        "FanDuel": "+3500",
        "BetMGM": "+3450",
        "DraftKings": "+3550",
        },
    },
    {
        "market": "Divisional Winner",
        "division": "NL West",
        "team": "Colorado Rockies",
        "odds": {
        "FanDuel": "+50000",
        "BetMGM": "+49900",
        "DraftKings": "+50100",
        },
    },
]

# --- Generate Random Win Total Bets ---
def generate_win_total_bets(team_name):
    win_total = random.randint(60, 110)
    odds = {
        "FanDuel": {
            "Over": f"+{random.randint(100, 300)}",
            "Under": f"+{random.randint(100, 300)}",
        },
        "BetMGM": {
            "Over": f"+{random.randint(100, 300)}",
            "Under": f"+{random.randint(100, 300)}",
        },
        "DraftKings": {
            "Over": f"+{random.randint(100, 300)}",
            "Under": f"+{random.randint(100, 300)}",
        },
    }
    return {
        "market": "Win Total",
        "team": team_name,
        "description": f"Over/Under {win_total} wins",
        "odds": odds,
    }

# --- Insert Data into Firestore ---
def insert_team_bets(team_data):
    team_bets = {}

    # Group bets by team
    for team in team_data:
        team_name = team["team"]
        if team_name not in team_bets:
            team_bets[team_name] = {"team": team_name, "bets": []}

        # Add the current bet
        team_bets[team_name]["bets"].append({
            "market": team["market"],
            "odds": team["odds"],
            **({"division": team["division"]} if "division" in team else {}),
        })

    # Add win total bets for each team
    for team_name in team_bets:
        win_total_bet = generate_win_total_bets(team_name)
        team_bets[team_name]["bets"].append(win_total_bet)

    # Insert into Firestore
    for team_name, data in team_bets.items():
        db.collection(TEAM_BET_COLLECTION).document(team_name).set(data)
        print(f"Inserted data for {team_name}")

# --- Run the Script ---
if __name__ == "__main__":
    # Example: Run insertion for the given team_data
    insert_team_bets(team_data)

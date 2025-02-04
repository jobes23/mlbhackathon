from google.cloud import firestore

# Initialize Firestore
db = firestore.Client()

# Task list with FontAwesome icon names stored as strings
tasks = [
    {
        "id": "fanatics_passes",
        "name": "Fanatics Pass",
        "description": "Complete this challenge to earn a unique Fanatics code for exclusive rewards.",
        "cost": 350,
        "code": "FANATICS",
        "isRecurring": False,
        "category": "general"
    },
    {
        "id": "ticket_offer",
        "name": "Game Day Ticket Discount",
        "description": "Upgrade your game experience with a ticket discount or special seating upgrade.",
        "cost": 1500,
        "code": "UPGRADED_TICKETS",
        "isRecurring": False,
        "category": "general"
    },
    {
        "id": "stadium_concessions",
        "name": "Ballpark Meal Deal",
        "description": "Enjoy a stadium meal on us! Redeem for your choice of (1) hot dog or nachos, (1) medium soda, and (1) bucket of fries at any ballpark food stand.",
        "cost": 250,
        "code": "BALLPARK_MEAL",
        "isRecurring": True,
        "category": "general"
    },
    {
        "id": "mlb_tv_subscription",
        "name": "MLB.TV Access",
        "description": "Never miss a moment! Redeem for a free year of MLB.TV to watch games live.",
        "cost": 1600,
        "code": "MLBTV_ACCESS",
        "isRecurring": False,
        "category": "general"
    },
    {
        "id": "mlb_store_discount",
        "name": "MLB Shop Discount",
        "description": "Complete this challenge to receive an exclusive discount on official MLB merchandise from the MLB Shop.",
        "cost": 400,
        "code": "MLB_SHOP",
        "isRecurring": False,
        "category": "general"
    },
    {
        "id": "dodgers_merch_discount",
        "name": "Los Angeles Dodgers Gear Discount",
        "description": "Show your Los Angeles Dodgers pride! Redeem this challenge for exclusive savings on team merchandise.",
        "cost": 300,
        "code": "DODGERS_MERCH",
        "isRecurring": False,
        "category": "team",
        "team": "Los Angeles Dodgers"
    },
    {
        "id": "dodgers_vip_meet_greet",
        "name": "Los Angeles Dodgers VIP Meet & Greet",
        "description": "Win an exclusive opportunity to meet Los Angeles Dodgers players and legends.",
        "cost": 3000,
        "code": "DODGERS_VIP",
        "isRecurring": False,
        "category": "team",
        "team": "Los Angeles Dodgers"
    },
    {
        "id": "yankees_merch_discount",
        "name": "New York Yankees Gear Discount",
        "description": "Show your New York Yankees pride! Redeem this challenge for exclusive savings on team merchandise.",
        "cost": 300,
        "code": "YANKEES_MERCH",
        "isRecurring": False,
        "category": "team",
        "team": "New York Yankees"
    },
    {
        "id": "yankees_vip_meet_greet",
        "name": "New York Yankees VIP Meet & Greet",
        "description": "Win an exclusive opportunity to meet New York Yankees players and legends.",
        "cost": 3000,
        "code": "YANKEES_VIP",
        "isRecurring": False,
        "category": "team",
        "team": "New York Yankees"
    },
    {
        "id": "shohei_ohtani_signed_merch",
        "name": "Shohei Ohtani Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Shohei Ohtani.",
        "cost": 750,
        "code": "SHOHEI_OHTANI_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Shohei Ohtani",
        "team": "Los Angeles Dodgers"
    },
    {
        "id": "aaron_judge_signed_merch",
        "name": "Aaron Judge Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Aaron Judge.",
        "cost": 750,
        "code": "AARON_JUDGE_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Aaron Judge",
        "team": "New York Yankees"
    },
    {
        "id": "juan_soto_signed_merch",
        "name": "Juan Soto Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Juan Soto.",
        "cost": 750,
        "code": "JUAN_SOTO_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Juan Soto",
        "team": "San Diego Padres"
    },
    {
        "id": "mookie_betts_signed_merch",
        "name": "Mookie Betts Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Mookie Betts.",
        "cost": 750,
        "code": "MOOKIE_BETTS_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Mookie Betts",
        "team": "Los Angeles Dodgers"
    },
    {
        "id": "mike_trout_signed_merch",
        "name": "Mike Trout Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Mike Trout.",
        "cost": 750,
        "code": "MIKE_TROUT_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Mike Trout",
        "team": "Los Angeles Angels"
    },
    {
        "id": "francisco_lindor_signed_merch",
        "name": "Francisco Lindor Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Francisco Lindor.",
        "cost": 750,
        "code": "FRANCISCO_LINDOR_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Francisco Lindor",
        "team": "New York Mets"
    },
    {
        "id": "freddie_freeman_signed_merch",
        "name": "Freddie Freeman Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Freddie Freeman.",
        "cost": 750,
        "code": "FREDDIE_FREEMAN_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Freddie Freeman",
        "team": "Los Angeles Dodgers"
    },
    {
        "id": "bryce_harper_signed_merch",
        "name": "Bryce Harper Signed Memorabilia",
        "description": "Complete this challenge for a chance to claim an exclusive autographed item from Bryce Harper.",
        "cost": 750,
        "code": "BRYCE_HARPER_SIGNED",
        "isRecurring": False,
        "category": "player",
        "player": "Bryce Harper",
        "team": "Philadelphia Phillies"
    }
]

def add_or_update_tasks():
    """Adds new tasks or updates existing ones in Firestore"""
    tasks_collection = db.collection("rewards")

    for task in tasks:
        task_ref = tasks_collection.document(task["id"])
        existing_task = task_ref.get()

        if existing_task.exists:
            task_ref.update(task)
            print(f"Updated task: {task['name']}")
        else:
            task_ref.set(task)
            print(f"Added new task: {task['name']}")

if __name__ == "__main__":
    add_or_update_tasks()

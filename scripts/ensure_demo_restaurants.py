from datetime import datetime, timezone
from core.security import hash_password
from core.mongo import get_users_collection, get_restaurants_collection

DEMO_RESTAURANTS = [
    ("Pasta Paradise", "Italian", "456 Columbus Ave", "San Francisco", 2, "Fresh handmade pasta in a cozy, lively dining room.", "https://images.pexels.com/photos/1527603/pexels-photo-1527603.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Sushi Sakura", "Japanese", "789 Post St", "San Francisco", 3, "Omakase-style sushi with premium fish and elegant plating.", "https://images.pexels.com/photos/357756/pexels-photo-357756.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Taco Fiesta", "Mexican", "321 Mission St", "San Francisco", 1, "Street-style tacos, loaded burritos, and house salsas.", "https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Spice Garden", "Indian", "555 Valencia St", "San Francisco", 2, "Classic curries, tandoori, and vegetarian specialties.", "https://images.pexels.com/photos/5410400/pexels-photo-5410400.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Dragon Palace", "Chinese", "614 Jackson St", "San Francisco", 2, "Dim sum and Cantonese favorites for family-style meals.", "https://images.pexels.com/photos/955137/pexels-photo-955137.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Blue Harbor Grill", "American", "120 Embarcadero", "San Francisco", 3, "Modern grill with seafood, steaks, and bay views.", "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Seoul Kitchen", "Korean", "3801 Geary Blvd", "San Francisco", 2, "Korean BBQ, bibimbap, and comforting stews.", "https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Mediterraneo", "Mediterranean", "232 Hayes St", "San Francisco", 3, "Wood-fired meats, mezze platters, and fresh salads.", "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Bangkok Bowl", "Thai", "88 Market St", "San Francisco", 2, "Noodles, curries, and Thai street-food classics.", "https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Casa Verde", "Mexican", "901 Castro St", "San Francisco", 2, "Regional Mexican dishes with strong vegetarian options.", "https://images.pexels.com/photos/4958641/pexels-photo-4958641.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Ramen Theory", "Japanese", "140 8th St", "San Francisco", 2, "Rich broths, handmade noodles, and izakaya bites.", "https://images.pexels.com/photos/884600/pexels-photo-884600.jpeg?auto=compress&cs=tinysrgb&w=1400"),
    ("Bella Napoli", "Italian", "77 Union St", "San Francisco", 3, "Traditional Italian dining with wood-fired pizza.", "https://images.pexels.com/photos/315755/pexels-photo-315755.jpeg?auto=compress&cs=tinysrgb&w=1400"),
]


def ensure_demo_data() -> None:
    users = get_users_collection()
    restaurants = get_restaurants_collection()

    owner = users.find_one({"email": "demo.owner@yelp.com"})
    if not owner:
        result = users.insert_one({
            "name": "Demo Owner",
            "email": "demo.owner@yelp.com",
            "hashed_password": hash_password("password123"),
            "role": "owner",
            "city": "San Francisco",
            "country": "United States",
            "restaurant_location": "San Francisco",
            "created_at": datetime.now(timezone.utc),
        })
        owner_id = str(result.inserted_id)
    else:
        owner_id = str(owner["_id"])

    added = 0
    updated = 0
    for name, cuisine, address, city, price, description, photo_url in DEMO_RESTAURANTS:
        existing = restaurants.find_one({"name": name})
        if existing:
            current_photos = existing.get("photos", [])
            first_photo = current_photos[0] if current_photos else ""
            if not current_photos or "picsum.photos" in first_photo:
                restaurants.update_one({"_id": existing["_id"]}, {"$set": {"photos": [photo_url]}})
                updated += 1
            continue
        restaurants.insert_one({
            "name": name,
            "cuisine_type": cuisine,
            "address": address,
            "city": city,
            "price_range": price,
            "description": description,
            "amenities": ["WiFi", "Takeout", "Delivery"],
            "photos": [photo_url],
            "avg_rating": 4.4,
            "review_count": 12,
            "view_count": 0,
            "added_by": owner_id,
            "owner_id": None,
            "created_at": datetime.now(timezone.utc),
        })
        added += 1

    total = restaurants.count_documents({})
    print(f"Demo restaurant sync complete. Added: {added}, Updated: {updated}, Total restaurants: {total}")


if __name__ == "__main__":
    ensure_demo_data()

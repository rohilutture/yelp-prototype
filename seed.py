"""
seed.py — Populates the database with sample data for testing.
Run: python seed.py
"""
import sys, json
sys.path.insert(0, ".")

from core.database import SessionLocal, engine
from core.security import hash_password
import models
from models.user import User
from models.restaurant import Restaurant
from models.review import Review, UserPreference

# Create tables
from core.database import Base
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    # ── Users ─────────────────────────────────────────────────────────────────
    if db.query(User).count() > 0:
        print("Database already seeded. Skipping.")
        db.close()
        return

    users = [
        User(name="Alice Johnson", email="alice@example.com",
             hashed_password=hash_password("password123"), role="user",
             city="San Francisco", country="United States"),
        User(name="Bob Smith", email="bob@example.com",
             hashed_password=hash_password("password123"), role="user",
             city="New York", country="United States"),
        User(name="Marco Rossi", email="marco@example.com",
             hashed_password=hash_password("password123"), role="owner",
             restaurant_location="123 Little Italy, San Francisco"),
    ]
    for u in users:
        db.add(u)
    db.commit()
    for u in users:
        db.refresh(u)

    alice, bob, marco = users

    # ── Preferences ───────────────────────────────────────────────────────────
    db.add(UserPreference(
        user_id=alice.id,
        cuisines=json.dumps(["Italian", "Japanese"]),
        price_range=json.dumps([2, 3]),
        dietary=json.dumps(["Vegetarian"]),
        ambiance=json.dumps(["Casual", "Romantic"]),
        sort_by="Rating",
        location="San Francisco",
        radius=10,
    ))
    db.commit()

    # ── Restaurants ───────────────────────────────────────────────────────────
    restaurants_data = [
        dict(name="Pasta Paradise", cuisine_type="Italian", address="456 Columbus Ave",
             city="San Francisco", phone="(415) 555-0101", price_range=2,
             description="Authentic Italian pasta made fresh daily in the heart of North Beach.",
             hours="Mon–Thu: 11am–10pm\nFri–Sat: 11am–11pm\nSun: 12pm–9pm",
             amenities=json.dumps(["WiFi", "Outdoor seating", "Reservations"]),
             photos=json.dumps([]), avg_rating=4.5, review_count=0, added_by=alice.id),
        dict(name="Sushi Sakura", cuisine_type="Japanese", address="789 Post St",
             city="San Francisco", phone="(415) 555-0202", price_range=3,
             description="Omakase-style sushi with the freshest fish flown in daily from Tokyo.",
             hours="Tue–Sun: 5pm–10pm\nClosed Monday",
             amenities=json.dumps(["Reservations", "Fine dining"]),
             photos=json.dumps([]), avg_rating=4.8, review_count=0, added_by=alice.id),
        dict(name="Taco Fiesta", cuisine_type="Mexican", address="321 Mission St",
             city="San Francisco", phone="(415) 555-0303", price_range=1,
             description="Street-style tacos and margaritas. Vegan options available.",
             hours="Daily: 10am–midnight",
             amenities=json.dumps(["Outdoor seating", "Takeout", "Delivery"]),
             photos=json.dumps([]), avg_rating=4.2, review_count=0, added_by=bob.id),
        dict(name="Spice Garden", cuisine_type="Indian", address="555 Valencia St",
             city="San Francisco", phone="(415) 555-0404", price_range=2,
             description="North and South Indian cuisine with a wide vegan and vegetarian menu.",
             hours="Daily: 11:30am–10pm",
             amenities=json.dumps(["WiFi", "Takeout", "Delivery", "Vegetarian-friendly"]),
             photos=json.dumps([]), avg_rating=4.4, review_count=0, added_by=bob.id),
        dict(name="Candlelight Bistro", cuisine_type="French", address="88 Fillmore St",
             city="San Francisco", phone="(415) 555-0505", price_range=4,
             description="Romantic fine dining with classic French technique and Californian ingredients.",
             hours="Wed–Sun: 6pm–10pm",
             amenities=json.dumps(["Reservations", "Fine dining", "Romantic", "Wine bar"]),
             photos=json.dumps([]), avg_rating=4.7, review_count=0, added_by=alice.id, owner_id=marco.id),
        dict(name="Green Leaf Café", cuisine_type="American", address="200 Hayes St",
             city="San Francisco", phone="(415) 555-0606", price_range=1,
             description="100% plant-based menu. Casual, cozy, and community-focused.",
             hours="Mon–Fri: 8am–8pm\nSat–Sun: 9am–7pm",
             amenities=json.dumps(["WiFi", "Outdoor seating", "Vegan", "Gluten-free options"]),
             photos=json.dumps([]), avg_rating=4.3, review_count=0, added_by=bob.id),
        dict(name="Dragon Palace", cuisine_type="Chinese", address="614 Jackson St",
             city="San Francisco", phone="(415) 555-0707", price_range=2,
             description="Dim sum and Cantonese classics served in a lively family atmosphere.",
             hours="Daily: 10am–10pm",
             amenities=json.dumps(["Family-friendly", "Takeout", "Delivery", "Parking"]),
             photos=json.dumps([]), avg_rating=4.1, review_count=0, added_by=alice.id),
        dict(name="Seoul Kitchen", cuisine_type="Korean", address="3801 Geary Blvd",
             city="San Francisco", phone="(415) 555-0808", price_range=2,
             description="Korean BBQ and traditional dishes. Tabletop grilling experience.",
             hours="Tue–Sun: 11:30am–10pm",
             amenities=json.dumps(["Reservations", "Live music", "Family-friendly"]),
             photos=json.dumps([]), avg_rating=4.6, review_count=0, added_by=bob.id),
    ]

    restaurant_objs = []
    for data in restaurants_data:
        r = Restaurant(**data)
        db.add(r)
        restaurant_objs.append(r)
    db.commit()
    for r in restaurant_objs:
        db.refresh(r)

    # ── Reviews ───────────────────────────────────────────────────────────────
    reviews_data = [
        (restaurant_objs[0], alice, 5, "Best pasta I've ever had outside of Italy!"),
        (restaurant_objs[0], bob,   4, "Great food, a little noisy on weekends."),
        (restaurant_objs[1], bob,   5, "Omakase was absolutely transcendent. Worth every penny."),
        (restaurant_objs[2], alice, 4, "Perfect for a quick, delicious lunch. Love the vegan options."),
        (restaurant_objs[3], alice, 4, "Excellent curry. The daal is outstanding."),
        (restaurant_objs[3], bob,   5, "My go-to Indian spot in the city."),
        (restaurant_objs[4], bob,   5, "Perfect anniversary dinner. Impeccable service."),
        (restaurant_objs[5], alice, 4, "Amazing plant-based burgers. You won't miss the meat."),
        (restaurant_objs[6], alice, 4, "Dim sum on Sunday morning is a must. Come hungry."),
        (restaurant_objs[7], bob,   5, "Korean BBQ here is unmatched. Get the galbi."),
    ]

    for restaurant, user, rating, comment in reviews_data:
        db.add(Review(
            restaurant_id=restaurant.id,
            user_id=user.id,
            rating=rating,
            comment=comment,
        ))
    db.commit()

    # ── Recalculate ratings ───────────────────────────────────────────────────
    for r in restaurant_objs:
        db.refresh(r)
        all_reviews = db.query(Review).filter(Review.restaurant_id == r.id).all()
        r.review_count = len(all_reviews)
        r.avg_rating = round(sum(rev.rating for rev in all_reviews) / len(all_reviews), 2) if all_reviews else 0.0
    db.commit()

    print("✅ Seeded successfully!")
    print(f"   Users: {len(users)}")
    print(f"   Restaurants: {len(restaurant_objs)}")
    print(f"   Reviews: {len(reviews_data)}")
    print("\nTest credentials:")
    print("  User:  alice@example.com / password123")
    print("  User:  bob@example.com   / password123")
    print("  Owner: marco@example.com / password123")
    db.close()

if __name__ == "__main__":
    seed()

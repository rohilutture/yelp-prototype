import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from core.database import get_db
from core.security import get_current_user
from core.config import get_settings
from models.user import User
from models.restaurant import Restaurant
from models.review import UserPreference
from schemas.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])
settings = get_settings()

def parse_json(v):
    try: return json.loads(v) if v else []
    except: return []

def get_user_preferences(user: User, db: Session) -> dict:
    prefs = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
    if not prefs:
        return {}
    return {
        "cuisines": parse_json(prefs.cuisines),
        "price_range": parse_json(prefs.price_range),
        "dietary": parse_json(prefs.dietary),
        "ambiance": parse_json(prefs.ambiance),
        "sort_by": prefs.sort_by,
        "location": prefs.location,
    }

def query_restaurants(db: Session, cuisine: str = None, price: int = None,
                      keywords: list = None, city: str = None, limit: int = 5) -> list:
    query = db.query(Restaurant)
    if cuisine:
        query = query.filter(Restaurant.cuisine_type.ilike(f"%{cuisine}%"))
    if price:
        query = query.filter(Restaurant.price_range == price)
    if city:
        query = query.filter(Restaurant.city.ilike(f"%{city}%"))
    if keywords:
        for kw in keywords:
            query = query.filter(or_(
                Restaurant.description.ilike(f"%{kw}%"),
                Restaurant.name.ilike(f"%{kw}%"),
                Restaurant.amenities.ilike(f"%{kw}%"),
            ))
    return query.order_by(Restaurant.avg_rating.desc()).limit(limit).all()

def restaurant_to_dict(r: Restaurant) -> dict:
    return {
        "id": r.id, "name": r.name, "cuisine_type": r.cuisine_type,
        "address": r.address, "city": r.city, "phone": r.phone,
        "description": r.description, "hours": r.hours,
        "price_range": r.price_range, "photos": parse_json(r.photos),
        "avg_rating": r.avg_rating, "review_count": r.review_count,
        "amenities": parse_json(r.amenities),
    }

def build_price_label(p: int) -> str:
    return {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}.get(p, "?")

# ─── Chat endpoint ────────────────────────────────────────────────────────────
@router.post("/chat")
async def chat(body: ChatRequest, db: Session = Depends(get_db),
               current_user: User = Depends(get_current_user)):

    prefs = get_user_preferences(current_user, db)

    # Try to use LangChain + OpenAI if key is configured
    if settings.OPENAI_API_KEY:
        return await _langchain_chat(body, prefs, db, current_user)
    else:
        # Fallback: rule-based matching
        return _rule_based_chat(body, prefs, db)


async def _langchain_chat(body: ChatRequest, prefs: dict, db: Session, user: User):
    try:
        from langchain_openai import ChatOpenAI
        from langchain.schema import HumanMessage, SystemMessage, AIMessage
        from langchain_community.tools.tavily_search import TavilySearchResults

        # Get all restaurants for context
        all_restaurants = db.query(Restaurant).order_by(Restaurant.avg_rating.desc()).limit(50).all()
        restaurant_list = "\n".join([
            f"- ID:{r.id} | {r.name} | {r.cuisine_type} | {r.city} | Rating:{r.avg_rating} | Price:{build_price_label(r.price_range)} | {r.description or ''}"
            for r in all_restaurants
        ])

        prefs_str = json.dumps(prefs, indent=2) if prefs else "No preferences set"

        system_prompt = f"""You are a friendly restaurant discovery assistant for a Yelp-like platform.
You help users find restaurants based on their preferences and natural language queries.

USER PREFERENCES:
{prefs_str}

AVAILABLE RESTAURANTS IN DATABASE:
{restaurant_list}

INSTRUCTIONS:
1. Interpret the user's query naturally (occasion, cuisine, dietary needs, ambiance, price)
2. Cross-reference with the user's saved preferences
3. Recommend 2-3 restaurants from the database above that best match
4. Always mention restaurant ID, name, rating, and price tier in recommendations
5. Be conversational, warm, and helpful — not robotic
6. If no restaurants match well, suggest the closest options and explain why
7. For follow-up questions, refer to your previous recommendations
8. Format recommendations clearly with brief reasoning for each

Always end your response with a JSON block (hidden from display) listing matched restaurant IDs:
<restaurant_ids>[1, 2, 3]</restaurant_ids>"""

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
        )

        messages = [SystemMessage(content=system_prompt)]
        for msg in (body.conversation_history or []):
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        messages.append(HumanMessage(content=body.message))

        # Optionally enrich with Tavily web search
        web_context = ""
        if settings.TAVILY_API_KEY:
            try:
                from tavily import TavilyClient
                tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
                results = tavily.search(query=f"restaurants {body.message}", max_results=2)
                if results.get("results"):
                    web_context = "\n\nWEB CONTEXT (current info):\n" + "\n".join(
                        [f"- {r['title']}: {r['content'][:200]}" for r in results["results"]]
                    )
                    messages[-1] = HumanMessage(content=body.message + web_context)
            except Exception:
                pass

        response = llm.invoke(messages)
        ai_text = response.content

        # Extract restaurant IDs from response
        matched_restaurants = []
        if "<restaurant_ids>" in ai_text:
            try:
                start = ai_text.index("<restaurant_ids>") + len("<restaurant_ids>")
                end   = ai_text.index("</restaurant_ids>")
                ids   = json.loads(ai_text[start:end])
                id_map = {r.id: r for r in all_restaurants}
                matched_restaurants = [restaurant_to_dict(id_map[i]) for i in ids if i in id_map]
                # Clean hidden tag from display text
                ai_text = ai_text[:ai_text.index("<restaurant_ids>")].strip()
            except Exception:
                pass

        return {"message": ai_text, "restaurants": matched_restaurants}

    except Exception as e:
        # Fall back to rule-based on any LangChain error
        return _rule_based_chat(body, prefs, db)


def _rule_based_chat(body: ChatRequest, prefs: dict, db: Session) -> dict:
    """Simple keyword-based fallback when no OpenAI key is configured."""
    msg = body.message.lower()

    # Extract intent from keywords
    cuisine = None
    price   = None
    keywords = []

    cuisine_map = {
        "italian": "Italian", "pizza": "Italian", "pasta": "Italian",
        "chinese": "Chinese", "sushi": "Japanese", "japanese": "Japanese",
        "mexican": "Mexican", "tacos": "Mexican", "indian": "Indian", "curry": "Indian",
        "thai": "Thai", "french": "French", "american": "American", "burger": "American",
        "mediterranean": "Mediterranean", "korean": "Korean",
    }
    for kw, cui in cuisine_map.items():
        if kw in msg:
            cuisine = cui
            break

    if not cuisine and prefs.get("cuisines"):
        cuisine = prefs["cuisines"][0]

    if any(w in msg for w in ["cheap", "budget", "affordable"]):
        price = 1
    elif any(w in msg for w in ["fancy", "fine dining", "upscale", "romantic"]):
        price = 3
    elif "$$$$" in msg:
        price = 4

    if not price and prefs.get("price_range"):
        price = prefs["price_range"][0] if prefs["price_range"] else None

    if any(w in msg for w in ["vegan", "vegetarian", "halal", "gluten"]):
        keywords.append(next(w for w in ["vegan", "vegetarian", "halal", "gluten-free"] if w.split("-")[0] in msg))

    if any(w in msg for w in ["outdoor", "wifi", "family", "quiet", "romantic"]):
        keywords += [w for w in ["outdoor", "wifi", "family", "quiet", "romantic"] if w in msg]

    restaurants = query_restaurants(db, cuisine=cuisine, price=price, keywords=keywords, limit=3)

    if not restaurants:
        restaurants = query_restaurants(db, limit=3)

    if not restaurants:
        return {
            "message": "I couldn't find any restaurants matching your request right now. Try adding some restaurants to the platform first!",
            "restaurants": []
        }

    price_labels = {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}
    lines = ["Here are some great options for you:\n"]
    for i, r in enumerate(restaurants, 1):
        price_str = price_labels.get(r.price_range, "?")
        stars = "★" * round(r.avg_rating or 0)
        lines.append(f"{i}. **{r.name}** ({r.avg_rating:.1f}{stars}, {price_str})")
        if r.description:
            lines.append(f"   *{r.description[:100]}{'...' if len(r.description or '') > 100 else ''}*")

    if prefs.get("cuisines"):
        lines.append(f"\n_Personalised based on your preference for {', '.join(prefs['cuisines'][:2])} cuisine._")

    return {
        "message": "\n".join(lines),
        "restaurants": [restaurant_to_dict(r) for r in restaurants],
    }

import re
from fastapi import APIRouter, Depends
from core.security import get_current_user, UserDoc
from core.config import get_settings
from core.mongo import get_restaurants_collection, get_preferences_collection
from schemas.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])
settings = get_settings()


def _ilike(value: str) -> dict:
    return {"$regex": re.escape(value), "$options": "i"}


def get_user_preferences(user: UserDoc) -> dict:
    prefs = get_preferences_collection().find_one({"user_id": user.id})
    if not prefs:
        return {}
    return {
        "cuisines": prefs.get("cuisines", []),
        "price_range": prefs.get("price_range", []),
        "dietary": prefs.get("dietary", []),
        "ambiance": prefs.get("ambiance", []),
        "sort_by": prefs.get("sort_by"),
        "location": prefs.get("location"),
    }


def query_restaurants(cuisine=None, price=None, keywords=None, city=None, limit=5) -> list:
    restaurants = get_restaurants_collection()
    mongo_filter: dict = {}
    if cuisine:
        mongo_filter["cuisine_type"] = _ilike(cuisine)
    if price is not None:
        mongo_filter["price_range"] = price
    if city:
        mongo_filter["city"] = _ilike(city)
    if keywords:
        keyword_filters = []
        for kw in keywords:
            pattern = _ilike(kw)
            keyword_filters.append({"$or": [
                {"description": pattern},
                {"name": pattern},
                {"amenities": pattern},
            ]})
        if keyword_filters:
            mongo_filter["$and"] = keyword_filters
    return list(restaurants.find(mongo_filter).sort("avg_rating", -1).limit(limit))


def restaurant_to_dict(r: dict) -> dict:
    return {
        "id": str(r["_id"]),
        "name": r.get("name"),
        "cuisine_type": r.get("cuisine_type"),
        "address": r.get("address"),
        "city": r.get("city"),
        "phone": r.get("phone"),
        "description": r.get("description"),
        "hours": r.get("hours"),
        "price_range": r.get("price_range"),
        "photos": r.get("photos", []),
        "avg_rating": r.get("avg_rating", 0),
        "review_count": r.get("review_count", 0),
        "amenities": r.get("amenities", []),
    }


def build_price_label(p: int) -> str:
    return {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}.get(p, "?")


@router.post("/chat")
async def chat(body: ChatRequest, current_user: UserDoc = Depends(get_current_user)):
    prefs = get_user_preferences(current_user)
    if settings.OPENAI_API_KEY:
        return await _langchain_chat(body, prefs, current_user)
    return _rule_based_chat(body, prefs)


async def _langchain_chat(body: ChatRequest, prefs: dict, user: UserDoc):
    import json as _json
    try:
        from langchain_openai import ChatOpenAI
        from langchain.schema import HumanMessage, SystemMessage, AIMessage

        all_restaurants = list(
            get_restaurants_collection().find({}).sort("avg_rating", -1).limit(50)
        )
        restaurant_list = "\n".join([
            f"- ID:{str(r['_id'])} | {r.get('name')} | {r.get('cuisine_type')} | {r.get('city')} | Rating:{r.get('avg_rating', 0)} | Price:{build_price_label(r.get('price_range', 2))} | {r.get('description', '')}"
            for r in all_restaurants
        ])
        prefs_str = _json.dumps(prefs, indent=2) if prefs else "No preferences set"

        system_prompt = f"""You are a friendly restaurant discovery assistant for a Yelp-like platform.

USER PREFERENCES:
{prefs_str}

AVAILABLE RESTAURANTS IN DATABASE:
{restaurant_list}

INSTRUCTIONS:
1. Interpret the user's query naturally (occasion, cuisine, dietary needs, ambiance, price)
2. Cross-reference with the user's saved preferences
3. Recommend 2-3 restaurants from the database above that best match
4. Always mention restaurant ID, name, rating, and price tier in recommendations
5. Be conversational, warm, and helpful
6. Format recommendations clearly with brief reasoning for each

Always end your response with a JSON block listing matched restaurant IDs:
<restaurant_ids>[\"id1\", \"id2\"]</restaurant_ids>"""

        llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY, temperature=0.7)
        messages = [SystemMessage(content=system_prompt)]
        for msg in (body.conversation_history or []):
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        messages.append(HumanMessage(content=body.message))

        if settings.TAVILY_API_KEY:
            try:
                from tavily import TavilyClient
                tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
                results = tavily.search(query=f"restaurants {body.message}", max_results=2)
                if results.get("results"):
                    web_context = "\n\nWEB CONTEXT:\n" + "\n".join(
                        [f"- {r['title']}: {r['content'][:200]}" for r in results["results"]]
                    )
                    messages[-1] = HumanMessage(content=body.message + web_context)
            except Exception:
                pass

        response = llm.invoke(messages)
        ai_text = response.content

        matched_restaurants = []
        if "<restaurant_ids>" in ai_text:
            try:
                start = ai_text.index("<restaurant_ids>") + len("<restaurant_ids>")
                end = ai_text.index("</restaurant_ids>")
                ids = _json.loads(ai_text[start:end])
                id_map = {str(r["_id"]): r for r in all_restaurants}
                matched_restaurants = [restaurant_to_dict(id_map[i]) for i in ids if i in id_map]
                ai_text = ai_text[:ai_text.index("<restaurant_ids>")].strip()
            except Exception:
                pass

        return {"message": ai_text, "restaurants": matched_restaurants}

    except Exception:
        return _rule_based_chat(body, prefs)


def _rule_based_chat(body: ChatRequest, prefs: dict) -> dict:
    msg = body.message.lower()
    cuisine = None
    price = None
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

    restaurants = query_restaurants(cuisine=cuisine, price=price, keywords=keywords, limit=3)
    if not restaurants:
        restaurants = query_restaurants(limit=3)

    if not restaurants:
        return {"message": "I couldn't find any restaurants right now. Try adding some!", "restaurants": []}

    price_labels = {1: "$", 2: "$$", 3: "$$$", 4: "$$$$"}
    lines = ["Here are some great options for you:\n"]
    for i, r in enumerate(restaurants, 1):
        price_str = price_labels.get(r.get("price_range", 2), "?")
        stars = "★" * round(r.get("avg_rating") or 0)
        lines.append(f"{i}. **{r.get('name')}** ({r.get('avg_rating', 0):.1f}{stars}, {price_str})")
        if r.get("description"):
            desc = r["description"]
            lines.append(f"   *{desc[:100]}{'...' if len(desc) > 100 else ''}*")

    if prefs.get("cuisines"):
        lines.append(f"\n_Personalised based on your preference for {', '.join(prefs['cuisines'][:2])} cuisine._")

    return {"message": "\n".join(lines), "restaurants": [restaurant_to_dict(r) for r in restaurants]}

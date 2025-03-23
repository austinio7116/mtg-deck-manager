import httpx
from typing import Dict, List, Optional, Any
import asyncio
from app.schemas import CardCreate


async def get_card_by_name(name: str) -> Optional[Dict[str, Any]]:
    """
    Get card data from Scryfall API by exact name
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.scryfall.com/cards/named",
            params={"exact": name}
        )
        
        if response.status_code == 200:
            return response.json()
        return None


async def search_cards(query: str) -> List[Dict[str, Any]]:
    """
    Search for cards using Scryfall API
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.scryfall.com/cards/search",
            params={"q": query}
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("data", [])
        return []


async def get_card_by_set_and_number(set_code: str, collector_number: str) -> Optional[Dict[str, Any]]:
    """
    Get card data from Scryfall API by set code and collector number
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://api.scryfall.com/cards/{set_code}/{collector_number}"
        )
        
        if response.status_code == 200:
            return response.json()
        return None


def scryfall_to_card_model(scryfall_data: Dict[str, Any]) -> CardCreate:
    """
    Convert Scryfall API data to our CardCreate model
    """
    # Extract colors as comma-separated string
    colors = ",".join(scryfall_data.get("colors", []))
    
    # Get image URI (prioritize normal size)
    image_uris = scryfall_data.get("image_uris", {})
    image_uri = image_uris.get("normal") or image_uris.get("large") or image_uris.get("small")
    
    # Create CardCreate object
    return CardCreate(
        name=scryfall_data.get("name", ""),
        scryfall_id=scryfall_data.get("id", ""),
        image_uri=image_uri,
        type_line=scryfall_data.get("type_line", ""),
        mana_cost=scryfall_data.get("mana_cost", ""),
        cmc=scryfall_data.get("cmc", 0),
        colors=colors,
        rarity=scryfall_data.get("rarity", ""),
        set_code=scryfall_data.get("set", ""),
        collector_number=scryfall_data.get("collector_number", ""),
        oracle_text=scryfall_data.get("oracle_text", ""),
        additional_data={
            "keywords": scryfall_data.get("keywords", []),
            "legalities": scryfall_data.get("legalities", {}),
            "prices": scryfall_data.get("prices", {})
        }
    )


async def get_cards_batch(card_names: List[str]) -> List[CardCreate]:
    """
    Get multiple cards from Scryfall API in parallel
    """
    tasks = [get_card_by_name(name) for name in card_names]
    results = await asyncio.gather(*tasks)
    
    cards = []
    for result in results:
        if result:
            cards.append(scryfall_to_card_model(result))
    
    return cards
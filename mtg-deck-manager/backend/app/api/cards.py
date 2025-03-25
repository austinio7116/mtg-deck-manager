from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Tuple
from sqlalchemy import func

from app.database import get_db
from app.schemas import Card, CardCreate, CardSearch
from app.crud import (
    get_card, get_cards, search_cards, search_cards_advanced, create_card,
    update_card, delete_card, autocomplete_card_names
)
from app.utils import get_card_by_name, scryfall_to_card_model

router = APIRouter()


@router.get("/", response_model=List[Card])
def read_cards(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all cards
    """
    cards = get_cards(db, skip=skip, limit=limit)
    return cards


@router.post("/", response_model=Card)
def create_new_card(card: CardCreate, db: Session = Depends(get_db)):
    """
    Create a new card
    """
    return create_card(db, card)


@router.get("/search", response_model=List[Card])
def search_cards_endpoint(
    response: Response,
    skip: int = 0,
    limit: int = 100,
    name: Optional[str] = None,
    colors: Optional[str] = None,
    type_line: Optional[str] = None,
    cmc: Optional[int] = None,
    rarity: Optional[str] = None,
    set_code: Optional[str] = None,
    filter_type: Optional[str] = None,
    filter_json: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Search for cards with various filters
    
    Supports both simple filtering and complex filtering with nested AND/OR conditions.
    For complex filtering, provide the filter_json parameter with a JSON structure.
    """
    try:
        # Log the search parameters for debugging
        print(f"Card search parameters: skip={skip}, limit={limit}, name={name}, colors={colors}, type_line={type_line}, cmc={cmc}, rarity={rarity}, set_code={set_code}")
        print(f"Advanced filter parameters: filter_type={filter_type}, filter_json={filter_json}")
        
        # Convert cmc to int if it's a string
        cmc_value = None
        if cmc is not None:
            try:
                cmc_value = int(cmc)
                print(f"Converted cmc from {cmc} to {cmc_value}")
            except ValueError:
                print(f"Error converting cmc to int: {cmc}")
                cmc_value = None
        
        # Check if we're using advanced filtering
        if filter_json:
            import json
            try:
                filter_data = json.loads(filter_json)
                print(f"Parsed filter JSON: {filter_data}")
                
                # Use the advanced search function
                cards, total_count = search_cards_advanced(
                    db,
                    filter_data=filter_data,
                    skip=skip,
                    limit=limit
                )
            except json.JSONDecodeError as e:
                print(f"Error decoding filter JSON: {e}")
                # Fall back to simple search if JSON parsing fails
                cards, total_count = search_cards(
                    db,
                    name=name,
                    colors=colors,
                    type_line=type_line,
                    cmc=cmc_value,
                    rarity=rarity,
                    set_code=set_code,
                    skip=skip,
                    limit=limit
                )
        else:
            # Use the simple search function
            cards, total_count = search_cards(
                db,
                name=name,
                colors=colors,
                type_line=type_line,
                cmc=cmc_value,
                rarity=rarity,
                set_code=set_code,
                skip=skip,
                limit=limit
            )
        
        print(f"Found {len(cards)} cards out of {total_count} total matching the search criteria")
        
        # Set the total count in the response header
        response.headers["X-Total-Count"] = str(total_count)
        print(f"Setting X-Total-Count header to: {total_count}")
        
        return cards
    except Exception as e:
        print(f"Error in search_cards_endpoint: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while searching for cards: {str(e)}"
        )


@router.get("/autocomplete", response_model=List[str])
def autocomplete_cards(
    name_prefix: str = Query(..., min_length=1),
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Autocomplete card names
    """
    results = autocomplete_card_names(db, name_prefix, limit)
    return [result[0] for result in results]


@router.post("/fetch-from-scryfall", response_model=Card)
async def fetch_card_from_scryfall(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """
    Fetch a card from Scryfall API and save it to the database
    """
    # First check if the card already exists in our database
    existing_card = search_cards(db, name=name, limit=1)
    if existing_card:
        return existing_card[0]
    
    # Fetch from Scryfall
    scryfall_data = await get_card_by_name(name)
    if not scryfall_data:
        raise HTTPException(status_code=404, detail=f"Card '{name}' not found on Scryfall")
    
    # Convert to our model and save
    card_data = scryfall_to_card_model(scryfall_data)
    return create_card(db, card_data)


@router.get("/{card_id}", response_model=Card)
def read_card(card_id: int, db: Session = Depends(get_db)):
    """
    Get a specific card by ID
    """
    db_card = get_card(db, card_id=card_id)
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return db_card


@router.put("/{card_id}", response_model=Card)
def update_existing_card(card_id: int, card: CardCreate, db: Session = Depends(get_db)):
    """
    Update a card
    """
    db_card = update_card(db, card_id=card_id, card_data=card.model_dump())
    if db_card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return db_card


@router.delete("/{card_id}")
def delete_existing_card(card_id: int, db: Session = Depends(get_db)):
    """
    Delete a card
    """
    success = delete_card(db, card_id=card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"ok": True}
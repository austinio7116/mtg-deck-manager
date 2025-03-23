from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import asyncio

from app.database import get_db
from app.schemas import (
    Deck, DeckCreate, DeckWithCards, DeckImport, 
    DeckCard, DeckCardCreate, DeckStatistics
)
from app.crud import (
    get_deck, get_decks, create_deck, update_deck, delete_deck,
    add_card_to_deck, remove_card_from_deck, update_card_in_deck,
    get_deck_statistics
)
from app.utils import import_deck_to_db

router = APIRouter()


@router.get("/", response_model=List[Deck])
def read_decks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Get all decks
    """
    decks = get_decks(db, skip=skip, limit=limit)
    return decks


@router.post("/", response_model=Deck, status_code=status.HTTP_201_CREATED)
def create_new_deck(deck: DeckCreate, db: Session = Depends(get_db)):
    """
    Create a new deck
    """
    return create_deck(db, deck)


@router.get("/{deck_id}", response_model=DeckWithCards)
def read_deck(deck_id: int, db: Session = Depends(get_db)):
    """
    Get a specific deck by ID
    """
    db_deck = get_deck(db, deck_id=deck_id)
    if db_deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return db_deck


@router.put("/{deck_id}", response_model=Deck)
def update_existing_deck(deck_id: int, deck: DeckCreate, db: Session = Depends(get_db)):
    """
    Update a deck
    """
    db_deck = update_deck(db, deck_id=deck_id, deck_data=deck)
    if db_deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return db_deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_deck(deck_id: int, db: Session = Depends(get_db)):
    """
    Delete a deck
    """
    success = delete_deck(db, deck_id=deck_id)
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"ok": True}


@router.post("/{deck_id}/cards", response_model=DeckCard)
def add_card_to_existing_deck(
    deck_id: int, deck_card: DeckCardCreate, db: Session = Depends(get_db)
):
    """
    Add a card to a deck
    """
    db_deck = get_deck(db, deck_id=deck_id)
    if db_deck is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    
    return add_card_to_deck(db, deck_id=deck_id, deck_card=deck_card)


@router.delete("/{deck_id}/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_card_from_existing_deck(
    deck_id: int, card_id: int, db: Session = Depends(get_db)
):
    """
    Remove a card from a deck
    """
    success = remove_card_from_deck(db, deck_id=deck_id, card_id=card_id)
    if not success:
        raise HTTPException(status_code=404, detail="Card not found in deck")
    return {"ok": True}


@router.put("/{deck_id}/cards/{card_id}", response_model=DeckCard)
def update_card_in_existing_deck(
    deck_id: int, card_id: int, quantity: int, is_sideboard: bool = False, 
    db: Session = Depends(get_db)
):
    """
    Update a card in a deck (quantity and sideboard status)
    """
    db_deck_card = update_card_in_deck(
        db, deck_id=deck_id, card_id=card_id, 
        quantity=quantity, is_sideboard=is_sideboard
    )
    if db_deck_card is None:
        raise HTTPException(status_code=404, detail="Card not found in deck")
    return db_deck_card


@router.get("/{deck_id}/stats", response_model=DeckStatistics)
def get_deck_stats(deck_id: int, db: Session = Depends(get_db)):
    """
    Get statistics for a deck
    """
    stats = get_deck_statistics(db, deck_id=deck_id)
    if stats is None:
        raise HTTPException(status_code=404, detail="Deck not found")
    return stats


@router.post("/import", response_model=Deck, status_code=status.HTTP_201_CREATED)
async def import_deck(deck_import: DeckImport, db: Session = Depends(get_db)):
    """
    Import a deck from MTGA format
    """
    try:
        # Log the input data
        print(f"Importing deck: {deck_import.name}")
        print(f"Deck text: {deck_import.deck_text[:100]}...")  # Print first 100 chars
        print(f"Description: {deck_import.description}")
        print(f"Format: {deck_import.format}")
        print(f"Tags: {deck_import.tags}")
        
        result = await import_deck_to_db(
            db,
            deck_import.deck_text,
            deck_import.name,
            deck_import.description,
            deck_import.format,
            deck_import.tags
        )
        
        # Get the created deck with all its cards
        return get_deck(db, deck_id=result["deck_id"])
    except Exception as e:
        # Log the error
        print(f"Error importing deck: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to import deck: {str(e)}"
        )
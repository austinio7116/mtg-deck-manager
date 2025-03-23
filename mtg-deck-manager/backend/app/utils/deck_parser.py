from typing import Dict, List, Tuple, Set
import re
from sqlalchemy.orm import Session
from app.crud import get_or_create_card
from app.schemas import CardCreate
from app.utils.scryfall import get_card_by_name, scryfall_to_card_model
import asyncio


async def parse_mtga_deck(deck_text: str) -> Tuple[List[Tuple[int, str]], List[Tuple[int, str]]]:
    """
    Parse MTGA deck format and return main deck and sideboard cards
    
    Format example:
    1 Island
    1 Swamp
    4 Concealed Courtyard
    
    2 Duress
    2 Rest in Peace
    
    Returns:
    Tuple of (main_deck, sideboard) where each is a list of (quantity, card_name) tuples
    """
    lines = deck_text.strip().split('\n')
    
    main_deck = []
    sideboard = []
    
    # Flag to track if we've reached the sideboard section
    in_sideboard = False
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines, but use them to detect sideboard
        if not line:
            if main_deck:  # Only switch to sideboard if we've already seen main deck cards
                in_sideboard = True
            continue
        
        # Parse the line: quantity followed by card name
        match = re.match(r'^(\d+)\s+(.+)$', line)
        if match:
            quantity = int(match.group(1))
            card_name = match.group(2)
            
            if in_sideboard:
                sideboard.append((quantity, card_name))
            else:
                main_deck.append((quantity, card_name))
    
    return main_deck, sideboard


async def get_unique_cards_from_deck(main_deck: List[Tuple[int, str]], sideboard: List[Tuple[int, str]]) -> Set[str]:
    """
    Extract unique card names from a deck
    """
    unique_cards = set()
    
    for _, card_name in main_deck:
        unique_cards.add(card_name)
    
    for _, card_name in sideboard:
        unique_cards.add(card_name)
    
    return unique_cards


async def fetch_card_data_for_deck(main_deck: List[Tuple[int, str]], sideboard: List[Tuple[int, str]]) -> Dict[str, CardCreate]:
    """
    Fetch card data from Scryfall for all cards in a deck
    """
    unique_cards = await get_unique_cards_from_deck(main_deck, sideboard)
    
    # Fetch card data for each unique card
    card_data = {}
    for card_name in unique_cards:
        scryfall_data = await get_card_by_name(card_name)
        if scryfall_data:
            card_model = scryfall_to_card_model(scryfall_data)
            card_data[card_name] = card_model
    
    return card_data


async def import_deck_to_db(
    db: Session,
    deck_text: str,
    deck_name: str,
    deck_description: str = None,
    deck_format: str = None,
    deck_tags: str = None
) -> Dict:
    """
    Import a deck from MTGA format to the database
    """
    from app.crud import create_deck, add_card_to_deck
    
    # Log function entry
    print(f"Starting import_deck_to_db for deck: {deck_name}")
    
    try:
        # Parse the deck
        print("Parsing deck text...")
        main_deck, sideboard = await parse_mtga_deck(deck_text)
        print(f"Parsed deck: {len(main_deck)} main deck cards, {len(sideboard)} sideboard cards")
        
        # Fetch card data from Scryfall
        print("Fetching card data from Scryfall...")
        card_data = await fetch_card_data_for_deck(main_deck, sideboard)
        print(f"Fetched data for {len(card_data)} unique cards")
        
        # Create the deck
        from app.schemas import DeckCreate
        
        print("Creating deck in database...")
        deck_data = DeckCreate(
            name=deck_name,
            description=deck_description,
            format=deck_format,
            tags=deck_tags
        )
        
        print(f"Deck data: {deck_data}")
        db_deck = create_deck(db, deck_data)
        print(f"Created deck with ID: {db_deck.id}")
    except Exception as e:
        print(f"Error in import_deck_to_db: {str(e)}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise
    
    # Add cards to the deck
    for quantity, card_name in main_deck:
        if card_name in card_data:
            # Get or create the card in the database
            db_card = get_or_create_card(db, card_data[card_name])
            
            # Add the card to the deck
            from app.schemas import DeckCardCreate
            
            deck_card = DeckCardCreate(
                card_id=db_card.id,
                quantity=quantity,
                is_sideboard=False
            )
            
            add_card_to_deck(db, db_deck.id, deck_card)
    
    # Add sideboard cards
    for quantity, card_name in sideboard:
        if card_name in card_data:
            # Get or create the card in the database
            db_card = get_or_create_card(db, card_data[card_name])
            
            # Add the card to the deck
            from app.schemas import DeckCardCreate
            
            deck_card = DeckCardCreate(
                card_id=db_card.id,
                quantity=quantity,
                is_sideboard=True
            )
            
            add_card_to_deck(db, db_deck.id, deck_card)
    
    return {
        "deck_id": db_deck.id,
        "name": db_deck.name,
        "main_deck_count": sum(quantity for quantity, _ in main_deck),
        "sideboard_count": sum(quantity for quantity, _ in sideboard),
        "unique_cards": len(card_data)
    }
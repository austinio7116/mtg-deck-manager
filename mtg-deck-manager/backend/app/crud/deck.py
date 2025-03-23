from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Deck, DeckCard, Card
from app.schemas import DeckCreate, DeckCardCreate


def get_deck(db: Session, deck_id: int):
    return db.query(Deck).filter(Deck.id == deck_id).first()


def get_decks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Deck).offset(skip).limit(limit).all()


def create_deck(db: Session, deck: DeckCreate):
    db_deck = Deck(
        name=deck.name,
        description=deck.description,
        format=deck.format,
        tags=deck.tags
    )
    db.add(db_deck)
    db.commit()
    db.refresh(db_deck)
    return db_deck


def update_deck(db: Session, deck_id: int, deck_data: DeckCreate):
    db_deck = get_deck(db, deck_id)
    if db_deck:
        for key, value in deck_data.model_dump(exclude_unset=True).items():
            setattr(db_deck, key, value)
        db.commit()
        db.refresh(db_deck)
    return db_deck


def delete_deck(db: Session, deck_id: int):
    db_deck = get_deck(db, deck_id)
    if db_deck:
        db.delete(db_deck)
        db.commit()
        return True
    return False


def add_card_to_deck(db: Session, deck_id: int, deck_card: DeckCardCreate):
    db_deck_card = DeckCard(
        deck_id=deck_id,
        card_id=deck_card.card_id,
        quantity=deck_card.quantity,
        is_sideboard=deck_card.is_sideboard
    )
    db.add(db_deck_card)
    db.commit()
    db.refresh(db_deck_card)
    return db_deck_card


def remove_card_from_deck(db: Session, deck_id: int, card_id: int):
    db_deck_card = db.query(DeckCard).filter(
        DeckCard.deck_id == deck_id,
        DeckCard.card_id == card_id
    ).first()
    if db_deck_card:
        db.delete(db_deck_card)
        db.commit()
        return True
    return False


def update_card_in_deck(db: Session, deck_id: int, card_id: int, quantity: int, is_sideboard: bool):
    db_deck_card = db.query(DeckCard).filter(
        DeckCard.deck_id == deck_id,
        DeckCard.card_id == card_id
    ).first()
    if db_deck_card:
        db_deck_card.quantity = quantity
        db_deck_card.is_sideboard = is_sideboard
        db.commit()
        db.refresh(db_deck_card)
        return db_deck_card
    return None


def get_deck_statistics(db: Session, deck_id: int):
    deck = get_deck(db, deck_id)
    if not deck:
        return None
    
    # Get all cards in the deck with their details
    deck_cards = db.query(DeckCard, Card).join(Card).filter(DeckCard.deck_id == deck_id).all()
    
    # Initialize statistics
    total_cards = 0
    main_deck_count = 0
    sideboard_count = 0
    color_distribution = {}
    mana_curve = {}
    card_types = {}
    rarity_distribution = {}
    
    # Process each card
    for deck_card, card in deck_cards:
        card_count = deck_card.quantity
        total_cards += card_count
        
        if deck_card.is_sideboard:
            sideboard_count += card_count
        else:
            main_deck_count += card_count
        
        # Process colors
        if card.colors:
            for color in card.colors.split(','):
                color_distribution[color] = color_distribution.get(color, 0) + card_count
        
        # Process mana curve
        cmc_key = str(card.cmc) if card.cmc is not None else "Unknown"
        mana_curve[cmc_key] = mana_curve.get(cmc_key, 0) + card_count
        
        # Process card types
        if card.type_line:
            # Simplify type to main type (Creature, Instant, etc.)
            main_type = card.type_line.split('—')[0].strip().split(' ')[0]
            card_types[main_type] = card_types.get(main_type, 0) + card_count
        
        # Process rarity
        if card.rarity:
            rarity_distribution[card.rarity] = rarity_distribution.get(card.rarity, 0) + card_count
    
    return {
        "total_cards": total_cards,
        "main_deck_count": main_deck_count,
        "sideboard_count": sideboard_count,
        "color_distribution": color_distribution,
        "mana_curve": mana_curve,
        "card_types": card_types,
        "rarity_distribution": rarity_distribution
    }
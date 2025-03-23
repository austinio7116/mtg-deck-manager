from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict, Any
from app.models import Card
from app.schemas import CardCreate


def get_card(db: Session, card_id: int):
    return db.query(Card).filter(Card.id == card_id).first()


def get_card_by_scryfall_id(db: Session, scryfall_id: str):
    return db.query(Card).filter(Card.scryfall_id == scryfall_id).first()


def get_card_by_name(db: Session, name: str):
    return db.query(Card).filter(Card.name == name).first()


def get_cards(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Card).offset(skip).limit(limit).all()


def search_cards(db: Session, name: Optional[str] = None, colors: Optional[str] = None, 
                type_line: Optional[str] = None, cmc: Optional[int] = None, 
                rarity: Optional[str] = None, set_code: Optional[str] = None,
                skip: int = 0, limit: int = 100):
    query = db.query(Card)
    
    if name:
        query = query.filter(Card.name.ilike(f"%{name}%"))
    
    if colors:
        # For each color in the search, check if it's in the card's colors
        for color in colors.split(','):
            query = query.filter(Card.colors.like(f"%{color}%"))
    
    if type_line:
        query = query.filter(Card.type_line.ilike(f"%{type_line}%"))
    
    if cmc is not None:
        query = query.filter(Card.cmc == cmc)
    
    if rarity:
        query = query.filter(Card.rarity == rarity)
    
    if set_code:
        query = query.filter(Card.set_code == set_code)
    
    return query.offset(skip).limit(limit).all()


def create_card(db: Session, card: CardCreate):
    db_card = Card(
        name=card.name,
        scryfall_id=card.scryfall_id,
        image_uri=card.image_uri,
        type_line=card.type_line,
        mana_cost=card.mana_cost,
        cmc=card.cmc,
        colors=card.colors,
        rarity=card.rarity,
        set_code=card.set_code,
        collector_number=card.collector_number,
        oracle_text=card.oracle_text,
        additional_data=card.additional_data
    )
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


def update_card(db: Session, card_id: int, card_data: Dict[str, Any]):
    db_card = get_card(db, card_id)
    if db_card:
        for key, value in card_data.items():
            setattr(db_card, key, value)
        db.commit()
        db.refresh(db_card)
    return db_card


def delete_card(db: Session, card_id: int):
    db_card = get_card(db, card_id)
    if db_card:
        db.delete(db_card)
        db.commit()
        return True
    return False


def get_or_create_card(db: Session, card_data: CardCreate):
    # Try to find the card by Scryfall ID if available
    if card_data.scryfall_id:
        db_card = get_card_by_scryfall_id(db, card_data.scryfall_id)
        if db_card:
            return db_card
    
    # Try to find the card by name
    db_card = get_card_by_name(db, card_data.name)
    if db_card:
        return db_card
    
    # Create a new card if not found
    return create_card(db, card_data)


def autocomplete_card_names(db: Session, name_prefix: str, limit: int = 10):
    return db.query(Card.name).filter(
        Card.name.ilike(f"{name_prefix}%")
    ).distinct().limit(limit).all()
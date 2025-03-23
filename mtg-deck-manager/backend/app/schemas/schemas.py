from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class CardBase(BaseModel):
    name: str
    scryfall_id: Optional[str] = None
    image_uri: Optional[str] = None
    type_line: Optional[str] = None
    mana_cost: Optional[str] = None
    cmc: Optional[int] = None
    colors: Optional[str] = None
    rarity: Optional[str] = None
    set_code: Optional[str] = None
    collector_number: Optional[str] = None
    oracle_text: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None


class CardCreate(CardBase):
    pass


class Card(CardBase):
    id: int

    class Config:
        from_attributes = True


class DeckCardBase(BaseModel):
    quantity: int = 1
    is_sideboard: bool = False


class DeckCardCreate(DeckCardBase):
    card_id: int


class DeckCard(DeckCardBase):
    id: int
    deck_id: int
    card_id: int
    card: Card

    class Config:
        from_attributes = True


class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None
    format: Optional[str] = None
    tags: Optional[str] = None


class DeckCreate(DeckBase):
    pass


class Deck(DeckBase):
    id: int
    created_at: datetime
    updated_at: datetime
    cards: List[DeckCard] = []

    class Config:
        from_attributes = True


class DeckWithCards(Deck):
    cards: List[DeckCard]


# Schema for importing a deck from MTGA format
class DeckImport(BaseModel):
    deck_text: str
    name: str
    description: Optional[str] = None
    format: Optional[str] = None
    tags: Optional[str] = None


# Schema for deck statistics
class DeckStatistics(BaseModel):
    total_cards: int
    main_deck_count: int
    sideboard_count: int
    color_distribution: Dict[str, int]
    mana_curve: Dict[str, int]
    card_types: Dict[str, int]
    rarity_distribution: Dict[str, int]


# Schema for card search
class CardSearch(BaseModel):
    name: Optional[str] = None
    colors: Optional[str] = None
    type_line: Optional[str] = None
    cmc: Optional[int] = None
    rarity: Optional[str] = None
    set_code: Optional[str] = None
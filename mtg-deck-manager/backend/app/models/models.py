from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON, Table, ARRAY
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Deck(Base):
    __tablename__ = "decks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    format = Column(String, nullable=True)
    tags = Column(String, nullable=True)  # Store as comma-separated values

    # Relationship with DeckCard
    cards = relationship("DeckCard", back_populates="deck")


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    scryfall_id = Column(String, unique=True, index=True)
    image_uri = Column(String, nullable=True)
    type_line = Column(String, nullable=True)
    mana_cost = Column(String, nullable=True)
    cmc = Column(Integer, nullable=True)
    colors = Column(String, nullable=True)  # Store as comma-separated values
    rarity = Column(String, nullable=True)
    set_code = Column(String, nullable=True)
    collector_number = Column(String, nullable=True)
    oracle_text = Column(Text, nullable=True)
    additional_data = Column(JSON, nullable=True)

    # Relationship with DeckCard
    decks = relationship("DeckCard", back_populates="card")


class DeckCard(Base):
    __tablename__ = "deck_cards"

    id = Column(Integer, primary_key=True, index=True)
    deck_id = Column(Integer, ForeignKey("decks.id"))
    card_id = Column(Integer, ForeignKey("cards.id"))
    quantity = Column(Integer, default=1)
    is_sideboard = Column(Boolean, default=False)

    # Relationships
    deck = relationship("Deck", back_populates="cards")
    card = relationship("Card", back_populates="decks")
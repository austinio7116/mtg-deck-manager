from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Dict, Any, Union
from app.models import Card
from app.schemas import CardCreate
import json


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


# Function removed - replaced by build_condition_clause


def build_condition_clause(condition: Dict[str, Any]):
    """Build a SQLAlchemy filter clause from a condition"""
    field = condition.get('field')
    operator = condition.get('operator')
    value = condition.get('value')
    
    if not field or not operator or value is None or value == '':
        return None
    
    # Get the model attribute
    model_attr = getattr(Card, field, None)
    if not model_attr:
        print(f"Warning: Field {field} not found in Card model")
        return None
    
    # Handle special case for colors
    if field == 'colors' and operator == 'contains':
        # For colors, we need to check if each color is in the card's colors
        clauses = []
        for color in value.split(','):
            if color:
                clauses.append(model_attr.like(f"%{color}%"))
        if clauses:
            return and_(*clauses)
        return None
    
    # Apply the operator
    try:
        if operator == 'is':
            return model_attr == value
        elif operator == 'contains':
            return model_attr.ilike(f"%{value}%")
        elif operator == 'starts_with':
            return model_attr.ilike(f"{value}%")
        elif operator == 'ends_with':
            return model_attr.ilike(f"%{value}")
        elif operator == 'greater_than' and field == 'cmc':
            num_value = int(value)
            return model_attr > num_value
        elif operator == 'less_than' and field == 'cmc':
            num_value = int(value)
            return model_attr < num_value
        elif operator == 'equals' and field == 'cmc':
            num_value = int(value)
            return model_attr == num_value
        else:
            print(f"Warning: Unsupported operator {operator} for field {field}")
            return None
    except (ValueError, TypeError) as e:
        print(f"Warning: Error applying filter {field} {operator} {value}: {e}")
        return None


def process_filter_group(group: Dict[str, Any]):
    """Process a filter group recursively and return a SQLAlchemy filter clause"""
    if not group:
        return None
    
    group_type = group.get('type', 'AND')
    conditions = group.get('conditions', [])
    subgroups = group.get('groups', [])
    
    all_clauses = []
    
    # Process conditions in this group
    for condition in conditions:
        condition_clause = build_condition_clause(condition)
        if condition_clause is not None:
            all_clauses.append(condition_clause)
    
    # Process subgroups
    for subgroup in subgroups:
        subgroup_clause = process_filter_group(subgroup)
        if subgroup_clause is not None:
            all_clauses.append(subgroup_clause)
    
    # Combine all clauses based on group type
    if all_clauses:
        if group_type == 'AND':
            return and_(*all_clauses)
        else:  # OR
            return or_(*all_clauses)
    
    return None


def search_cards_advanced(db: Session, filter_data: Dict[str, Any], skip: int = 0, limit: int = 100):
    """
    Search for cards with complex filter conditions
    
    filter_data should be a dictionary with the following structure:
    {
        "type": "AND" or "OR",
        "conditions": [
            {
                "field": "name",
                "operator": "contains",
                "value": "dragon"
            },
            ...
        ],
        "groups": [
            {
                "type": "AND" or "OR",
                "conditions": [...],
                "groups": [...]
            },
            ...
        ]
    }
    """
    query = db.query(Card)
    
    # Process the filter structure
    filter_clause = process_filter_group(filter_data)
    
    # Apply the filter if it exists
    if filter_clause is not None:
        query = query.filter(filter_clause)
    
    # Apply pagination
    return query.offset(skip).limit(limit).all()


# Duplicate function removed
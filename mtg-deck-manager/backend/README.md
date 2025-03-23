# MTG Deck Manager Backend

This is the backend API for the Magic: The Gathering Deck Manager application. It's built with FastAPI, SQLAlchemy, and SQLite.

## Features

- RESTful API for managing MTG decks and cards
- Integration with Scryfall API for card data
- Support for importing decks from MTGA format
- Deck statistics and analysis
- Card search and filtering

## Setup

1. Ensure you have Python 3.8+ installed
2. Set up a virtual environment:
   ```
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # On Windows with PowerShell
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Application

```
python run.py
```

The API will be available at http://localhost:8000

API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Decks

- `GET /api/decks` - List all decks
- `GET /api/decks/{id}` - Get deck details
- `POST /api/decks` - Create a new deck
- `PUT /api/decks/{id}` - Update a deck
- `DELETE /api/decks/{id}` - Delete a deck
- `POST /api/decks/import` - Import a deck from MTGA text format
- `GET /api/decks/{id}/stats` - Get deck statistics

### Cards

- `GET /api/cards` - List all cards
- `GET /api/cards/{id}` - Get card details
- `GET /api/cards/search` - Search cards with filters
- `GET /api/cards/autocomplete` - Autocomplete card names
- `POST /api/cards/fetch-from-scryfall` - Fetch a card from Scryfall API

## Database

The application uses SQLite by default. The database file will be created in the root directory as `mtg_deck_manager.db`.
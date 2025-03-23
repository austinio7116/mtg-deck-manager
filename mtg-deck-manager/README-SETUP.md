# MTG Deck Manager - Setup Instructions

This document provides detailed instructions on how to set up and run the Magic the Gathering Deck Manager application.

## Prerequisites

- Python 3.8+ for the backend
- Node.js 14+ for the frontend
- npm for frontend package management
- pip for backend package management

## Running the Application

### Step 1: Start the Backend Server

The backend server must be running before starting the frontend, as the frontend makes API calls to the backend.

1. Open a terminal window
2. Navigate to the backend directory:
   ```
   cd mtg-deck-manager/backend
   ```

3. Activate the virtual environment:
   ```
   .\venv\Scripts\Activate.ps1  # On Windows with PowerShell
   ```

4. Run the backend server:
   ```
   python run.py
   ```

   The backend server will start and be available at http://localhost:8000
   
   You should see output similar to:
   ```
   INFO:     Started server process [12345]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
   ```

   You can verify the backend is running by visiting http://localhost:8000 in your browser, which should display a welcome message.

### Step 2: Start the Frontend Development Server

1. Open a new terminal window (keep the backend server running in the first terminal)
2. Navigate to the frontend directory:
   ```
   cd mtg-deck-manager/frontend
   ```

3. Install dependencies (if not already done):
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm start
   ```

   The frontend development server will start and be available at http://localhost:3000
   
   Your browser should automatically open to this address. If not, you can manually navigate to http://localhost:3000

## Troubleshooting

### "Proxy error: Could not proxy request /api/... to http://localhost:8000/"

This error occurs when the frontend is trying to connect to the backend, but the backend server is not running or is not accessible. Make sure:

1. The backend server is running and accessible at http://localhost:8000
2. There are no firewall or network issues preventing the connection
3. The proxy configuration in package.json is correct (it should be `"proxy": "http://localhost:8000/"`)

If you continue to experience proxy issues, we've updated the API service to use the full URL instead of relying on the proxy. This change has been made in `frontend/src/api/api.js`:

```javascript
// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

This direct approach bypasses the proxy configuration and should resolve connection issues.

### Database Issues

If you encounter database-related errors, the SQLite database might need to be initialized:

1. Stop the backend server (if running)
2. Delete the `mtg_deck_manager.db` file in the backend directory (if it exists)
3. Restart the backend server, which will create a new database file

### API Errors

If you encounter API errors, check the backend server logs for more information. Common issues include:

1. Missing dependencies - Make sure all required packages are installed
2. Database connection issues - Check the database configuration
3. API endpoint issues - Check the API endpoint implementation

#### 422 Unprocessable Entity Error

If you encounter a 422 Unprocessable Entity error when searching for cards, it may be due to a parameter validation issue. We've fixed this by:

1. Modifying the search_cards_endpoint function in `backend/app/api/cards.py` to accept query parameters directly instead of using the CardSearch schema as a dependency
2. Adding logging to help diagnose any further issues
3. Removing trailing slashes from API endpoint routes ("/search/" → "/search")
4. Adding error handling and type conversion for the cmc parameter
5. Reordering the route definitions to ensure specific routes come before parameterized routes

The issues were:
- The frontend was sending parameters as query parameters in the URL, but the backend was expecting them to be part of a Pydantic model
- FastAPI's routing was having issues with the trailing slashes in the route definitions
- The cmc parameter might be coming in as a string but the database expects an integer
- The route order in FastAPI matters - the "/{card_id}" route was catching "/search" requests because it was defined first

#### React Component Error in DeckBuilder

If you encounter errors in the DeckBuilder component with "Uncaught ReferenceError: ArrowBack is not defined", it's due to an icon import issue. We've fixed this by:

1. Ensuring the correct usage of imported icons in the DeckBuilder.js file
2. Changing `<ArrowBack />` to `<BackIcon />` to match the import statement `import { ArrowBack as BackIcon } from '@mui/icons-material'`

This ensures that the DeckBuilder component renders correctly and allows users to edit decks without errors.

#### 400 Bad Request Error When Importing Decks

If you encounter a 400 Bad Request error when importing decks, it may be due to an issue with the deck import functionality. We've fixed this by:

1. Updating the import_deck_to_db function in `backend/app/utils/deck_parser.py` to use proper Pydantic models (DeckCreate and DeckCardCreate) instead of dictionaries
2. This ensures that the data passed to the create_deck and add_card_to_deck functions is properly validated
3. Fixed a variable name collision where `card_data` was being used for both the Scryfall card data dictionary and the DeckCardCreate objects, causing a "object of type 'DeckCardCreate' has no len()" error

The issues were:
- We were passing dictionaries to functions that expected Pydantic model objects, which caused validation errors
- We were reusing the variable name `card_data` for different purposes, causing a TypeError when trying to call len() on a DeckCardCreate object

## API Documentation

When the backend is running, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
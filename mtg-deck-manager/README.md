# Magic: The Gathering Deck Manager

A full-stack application for managing Magic: The Gathering decks, with a React frontend and Python FastAPI backend.

## Features

- **Deck Management**: Create, view, edit, and delete MTG decks
- **MTGA Import**: Import decks from Magic: The Gathering Arena text format
- **Card Database**: Search and browse cards with data from Scryfall API
- **Deck Statistics**: View mana curve, color distribution, and other deck analytics
- **Drag-and-Drop Builder**: Intuitive deck building interface
- **Dark Mode**: Clean, modern UI with light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Project Structure

This project consists of two main parts:

- `frontend/`: React application with Material-UI
- `backend/`: Python FastAPI application with SQLAlchemy and SQLite

## Prerequisites

- Node.js 14+ for the frontend
- Python 3.8+ for the backend
- npm or yarn for frontend package management
- pip for backend package management

## Setup and Installation

### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # On Windows with PowerShell
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the backend server:
   ```
   python run.py
   ```

   The API will be available at http://localhost:8000

### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the development server:
   ```
   npm start
   ```

   The application will be available at http://localhost:3000

## API Documentation

When the backend is running, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Technologies Used

### Frontend
- React
- Material-UI
- React Router
- Axios
- React Beautiful DnD
- Recharts

### Backend
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- httpx (for Scryfall API integration)

## License

This project is for educational purposes only. Magic: The Gathering is owned by Wizards of the Coast. Card data is provided by Scryfall.

## Acknowledgements

- [Scryfall API](https://scryfall.com/docs/api) for card data
- [Magic: The Gathering](https://magic.wizards.com/) by Wizards of the Coast
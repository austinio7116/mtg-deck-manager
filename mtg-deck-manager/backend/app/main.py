from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import decks_router, cards_router
from app.database import engine
from app.models import models

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MTG Deck Manager API",
    description="API for managing Magic: The Gathering decks",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"],
)

# Include routers
app.include_router(decks_router, prefix="/api/decks", tags=["decks"])
app.include_router(cards_router, prefix="/api/cards", tags=["cards"])


@app.get("/")
def read_root():
    return {
        "message": "Welcome to the MTG Deck Manager API",
        "docs": "/docs",
        "version": "0.1.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
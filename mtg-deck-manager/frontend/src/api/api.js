import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Deck API
export const deckApi = {
  // Get all decks
  getDecks: async () => {
    const response = await api.get('/decks');
    return response.data;
  },

  // Get a specific deck by ID
  getDeck: async (id) => {
    const response = await api.get(`/decks/${id}`);
    return response.data;
  },

  // Create a new deck
  createDeck: async (deckData) => {
    const response = await api.post('/decks', deckData);
    return response.data;
  },

  // Update a deck
  updateDeck: async (id, deckData) => {
    const response = await api.put(`/decks/${id}`, deckData);
    return response.data;
  },

  // Delete a deck
  deleteDeck: async (id) => {
    await api.delete(`/decks/${id}`);
    return true;
  },

  // Import a deck from MTGA format
  importDeck: async (importData) => {
    const response = await api.post('/decks/import', importData);
    return response.data;
  },

  // Get deck statistics
  getDeckStats: async (id) => {
    const response = await api.get(`/decks/${id}/stats`);
    return response.data;
  },

  // Add a card to a deck
  addCardToDeck: async (deckId, cardData) => {
    const response = await api.post(`/decks/${deckId}/cards`, cardData);
    return response.data;
  },

  // Remove a card from a deck
  removeCardFromDeck: async (deckId, cardId) => {
    await api.delete(`/decks/${deckId}/cards/${cardId}`);
    return true;
  },

  // Update a card in a deck
  updateCardInDeck: async (deckId, cardId, quantity, isSideboard) => {
    const response = await api.put(
      `/decks/${deckId}/cards/${cardId}?quantity=${quantity}&is_sideboard=${isSideboard}`
    );
    return response.data;
  },
};

// Card API
export const cardApi = {
  // Get all cards
  getCards: async (page = 1, limit = 20) => {
    const response = await api.get('/cards', {
      params: { skip: (page - 1) * limit, limit },
    });
    return response.data;
  },

  // Get a specific card by ID
  getCard: async (id) => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  // Search cards
  searchCards: async (searchParams) => {
    const response = await api.get('/cards/search', { params: searchParams });
    return response.data;
  },

  // Autocomplete card names
  autocompleteCards: async (namePrefix) => {
    const response = await api.get('/cards/autocomplete', {
      params: { name_prefix: namePrefix },
    });
    return response.data;
  },

  // Fetch a card from Scryfall
  fetchFromScryfall: async (name) => {
    const response = await api.post('/cards/fetch-from-scryfall', null, {
      params: { name },
    });
    return response.data;
  },
};

export default {
  deck: deckApi,
  card: cardApi,
};
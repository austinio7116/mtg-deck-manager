import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Autocomplete,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { deckApi, cardApi } from '../api/api';

// Card type categories for grouping
const CARD_TYPES = [
  'Creature',
  'Planeswalker',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Land',
  'Other',
];

function DeckBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  // State for deck details
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckFormat, setDeckFormat] = useState('');
  const [deckTags, setDeckTags] = useState('');
  
  // State for cards
  const [mainDeckCards, setMainDeckCards] = useState([]);
  const [sideboardCards, setSideboardCards] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [cardPreview, setCardPreview] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Load deck data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      fetchDeck();
    }
  }, [id]);

  // Search for cards when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCards();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const fetchDeck = async () => {
    try {
      setLoading(true);
      const deckData = await deckApi.getDeck(id);
      
      // Set deck details
      setDeckName(deckData.name);
      setDeckDescription(deckData.description || '');
      setDeckFormat(deckData.format || '');
      setDeckTags(deckData.tags || '');
      
      // Separate main deck and sideboard cards
      const main = deckData.cards
        .filter(card => !card.is_sideboard)
        .map(card => ({
          id: card.id,
          card: card.card,
          quantity: card.quantity,
        }));
      
      const sideboard = deckData.cards
        .filter(card => card.is_sideboard)
        .map(card => ({
          id: card.id,
          card: card.card,
          quantity: card.quantity,
        }));
      
      setMainDeckCards(main);
      setSideboardCards(sideboard);
      setError(null);
    } catch (err) {
      console.error('Error fetching deck:', err);
      setError('Failed to load deck. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const searchCards = async () => {
    try {
      const results = await cardApi.searchCards({ name: searchTerm });
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching cards:', err);
    }
  };

  const handleSearchChange = (event, value) => {
    setSearchTerm(value || '');
  };

  const handleCardSelect = (event, card) => {
    setSelectedCard(card);
    setCardPreview(card);
  };

  const handleAddCard = (card, isSideboard = false) => {
    if (!card) return;
    
    const cardList = isSideboard ? sideboardCards : mainDeckCards;
    const setCardList = isSideboard ? setSideboardCards : setMainDeckCards;
    
    // Check if card already exists in the list
    const existingCardIndex = cardList.findIndex(
      item => item.card.id === card.id
    );
    
    if (existingCardIndex >= 0) {
      // Increment quantity if card already exists
      const updatedList = [...cardList];
      updatedList[existingCardIndex].quantity += 1;
      setCardList(updatedList);
    } else {
      // Add new card with quantity 1
      setCardList([
        ...cardList,
        {
          id: `temp-${Date.now()}`, // Temporary ID for new cards
          card: card,
          quantity: 1,
        },
      ]);
    }
    
    // Clear selected card
    setSelectedCard(null);
    setSearchTerm('');
  };

  const handleRemoveCard = (cardIndex, isSideboard = false) => {
    const cardList = isSideboard ? sideboardCards : mainDeckCards;
    const setCardList = isSideboard ? setSideboardCards : setMainDeckCards;
    
    const updatedList = [...cardList];
    
    // Decrement quantity or remove if quantity is 1
    if (updatedList[cardIndex].quantity > 1) {
      updatedList[cardIndex].quantity -= 1;
      setCardList(updatedList);
    } else {
      updatedList.splice(cardIndex, 1);
      setCardList(updatedList);
    }
  };

  const handleMoveCard = (cardIndex, fromSideboard, toSideboard) => {
    const sourceList = fromSideboard ? sideboardCards : mainDeckCards;
    const targetList = toSideboard ? sideboardCards : mainDeckCards;
    
    const setSourceList = fromSideboard ? setSideboardCards : setMainDeckCards;
    const setTargetList = toSideboard ? setSideboardCards : setMainDeckCards;
    
    const card = sourceList[cardIndex];
    
    // Check if card already exists in target list
    const existingCardIndex = targetList.findIndex(
      item => item.card.id === card.card.id
    );
    
    if (existingCardIndex >= 0) {
      // Increment quantity in target list
      const updatedTargetList = [...targetList];
      updatedTargetList[existingCardIndex].quantity += 1;
      setTargetList(updatedTargetList);
    } else {
      // Add to target list with quantity 1
      setTargetList([
        ...targetList,
        {
          id: `temp-${Date.now()}`,
          card: card.card,
          quantity: 1,
        },
      ]);
    }
    
    // Decrement or remove from source list
    handleRemoveCard(cardIndex, fromSideboard);
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Same list, same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // Determine source and destination lists
    const isSourceSideboard = source.droppableId === 'sideboard';
    const isDestSideboard = destination.droppableId === 'sideboard';
    
    // If moving within the same list
    if (source.droppableId === destination.droppableId) {
      const list = isSourceSideboard ? [...sideboardCards] : [...mainDeckCards];
      const [removed] = list.splice(source.index, 1);
      list.splice(destination.index, 0, removed);
      
      if (isSourceSideboard) {
        setSideboardCards(list);
      } else {
        setMainDeckCards(list);
      }
    } else {
      // Moving between lists
      const sourceList = isSourceSideboard ? [...sideboardCards] : [...mainDeckCards];
      const destList = isDestSideboard ? [...sideboardCards] : [...mainDeckCards];
      
      const [removed] = sourceList.splice(source.index, 1);
      destList.splice(destination.index, 0, removed);
      
      if (isSourceSideboard) {
        setSideboardCards(sourceList);
        setMainDeckCards(destList);
      } else {
        setMainDeckCards(sourceList);
        setSideboardCards(destList);
      }
    }
  };

  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      setError('Deck name is required.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const deckData = {
        name: deckName,
        description: deckDescription,
        format: deckFormat,
        tags: deckTags,
      };
      
      let savedDeck;
      
      if (isEditMode) {
        // Update existing deck
        savedDeck = await deckApi.updateDeck(id, deckData);
        
        // Update cards in the deck
        // First, remove all existing cards
        // Then add the current cards
        // This is a simplification - a real implementation would be more efficient
        
        // Add main deck cards
        for (const card of mainDeckCards) {
          await deckApi.addCardToDeck(savedDeck.id, {
            card_id: card.card.id,
            quantity: card.quantity,
            is_sideboard: false,
          });
        }
        
        // Add sideboard cards
        for (const card of sideboardCards) {
          await deckApi.addCardToDeck(savedDeck.id, {
            card_id: card.card.id,
            quantity: card.quantity,
            is_sideboard: true,
          });
        }
      } else {
        // Create new deck
        savedDeck = await deckApi.createDeck(deckData);
        
        // Add main deck cards
        for (const card of mainDeckCards) {
          await deckApi.addCardToDeck(savedDeck.id, {
            card_id: card.card.id,
            quantity: card.quantity,
            is_sideboard: false,
          });
        }
        
        // Add sideboard cards
        for (const card of sideboardCards) {
          await deckApi.addCardToDeck(savedDeck.id, {
            card_id: card.card.id,
            quantity: card.quantity,
            is_sideboard: true,
          });
        }
      }
      
      setSuccess(true);
      
      // Navigate to deck detail page after a short delay
      setTimeout(() => {
        navigate(`/decks/${savedDeck.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error saving deck:', err);
      setError('Failed to save deck. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCardHover = (card) => {
    setCardPreview(card);
  };

  const handleConfirmDelete = () => {
    setConfirmDialogOpen(true);
  };

  const handleDeleteDeck = async () => {
    try {
      setSaving(true);
      await deckApi.deleteDeck(id);
      setConfirmDialogOpen(false);
      navigate('/decks');
    } catch (err) {
      console.error('Error deleting deck:', err);
      setError('Failed to delete deck. Please try again later.');
      setConfirmDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const mainDeckCount = mainDeckCards.reduce(
    (sum, card) => sum + card.quantity,
    0
  );
  
  const sideboardCount = sideboardCards.reduce(
    (sum, card) => sum + card.quantity,
    0
  );

  // Group cards by type
  const groupCardsByType = (cards) => {
    const grouped = {};
    
    // Initialize groups
    CARD_TYPES.forEach(type => {
      grouped[type] = [];
    });
    
    // Group cards by type
    cards.forEach((deckCard, index) => {
      const card = deckCard.card;
      let assigned = false;
      
      // Determine card type category
      for (const type of CARD_TYPES) {
        if (card.type_line && card.type_line.includes(type)) {
          grouped[type].push({ ...deckCard, index });
          assigned = true;
          break;
        }
      }
      
      // If no category matched, put in Other
      if (!assigned) {
        grouped['Other'].push({ ...deckCard, index });
      }
    });
    
    return grouped;
  };

  const groupedMainDeck = groupCardsByType(mainDeckCards);
  const groupedSideboard = groupCardsByType(sideboardCards);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          {isEditMode ? 'Edit Deck' : 'Create New Deck'}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Deck saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Deck Details */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Deck Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Deck Name"
                  fullWidth
                  required
                  value={deckName}
                  onChange={(e) => setDeckName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Format"
                  fullWidth
                  value={deckFormat}
                  onChange={(e) => setDeckFormat(e.target.value)}
                  placeholder="Standard, Modern, Commander, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Tags"
                  fullWidth
                  value={deckTags}
                  onChange={(e) => setDeckTags(e.target.value)}
                  placeholder="Comma-separated tags"
                  helperText="E.g., aggro, control, combo"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  value={deckDescription}
                  onChange={(e) => setDeckDescription(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Card Search */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Add Cards
            </Typography>
            <Autocomplete
              freeSolo
              options={searchResults}
              getOptionLabel={(option) => 
                typeof option === 'string' ? option : option.name
              }
              inputValue={searchTerm}
              onInputChange={handleSearchChange}
              onChange={handleCardSelect}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search Cards"
                  variant="outlined"
                  fullWidth
                  placeholder="Type to search..."
                />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {option.type_line}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            
            {selectedCard && (
              <Box sx={{ mt: 2 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{selectedCard.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCard.type_line}
                    </Typography>
                    {selectedCard.mana_cost && (
                      <Typography variant="body2">
                        Mana Cost: {selectedCard.mana_cost}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddCard(selectedCard, false)}
                      >
                        Add to Main Deck
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleAddCard(selectedCard, true)}
                      >
                        Add to Sideboard
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
            
            {/* Card Preview */}
            {cardPreview && cardPreview.image_uri && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Card Preview
                </Typography>
                <Card>
                  <CardMedia
                    component="img"
                    image={cardPreview.image_uri}
                    alt={cardPreview.name}
                    sx={{ borderRadius: 1 }}
                  />
                </Card>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Deck Builder */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="deck tabs"
              >
                <Tab 
                  label={`Main Deck (${mainDeckCount})`} 
                  id="tab-0"
                  aria-controls="tabpanel-0"
                />
                <Tab 
                  label={`Sideboard (${sideboardCount})`} 
                  id="tab-1"
                  aria-controls="tabpanel-1"
                />
              </Tabs>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              {/* Main Deck Tab */}
              <TabPanel value={tabValue} index={0}>
                <Droppable droppableId="main-deck">
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ minHeight: 200 }}
                    >
                      {Object.entries(groupedMainDeck).map(([type, cards]) => {
                        if (cards.length === 0) return null;
                        
                        return (
                          <Box key={type} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {type} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
                            </Typography>
                            <Box>
                              {cards.map((deckCard, idx) => (
                                <Draggable
                                  key={deckCard.id || `main-${deckCard.index}`}
                                  draggableId={deckCard.id || `main-${deckCard.index}`}
                                  index={idx}
                                >
                                  {(provided) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      sx={{
                                        p: 1,
                                        mb: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        '&:hover': {
                                          bgcolor: 'action.hover',
                                        },
                                      }}
                                      onMouseEnter={() => handleCardHover(deckCard.card)}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ mr: 1, minWidth: 20 }}>
                                          {deckCard.quantity}x
                                        </Typography>
                                        <Typography variant="body1">
                                          {deckCard.card.name}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleAddCard(deckCard.card, false)}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveCard(deckCard.index, false)}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleMoveCard(deckCard.index, false, true)}
                                        >
                                          <ArrowBack fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  )}
                                </Draggable>
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                      {mainDeckCards.length === 0 && (
                        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                          Your main deck is empty. Search for cards to add them here.
                        </Typography>
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </TabPanel>

              {/* Sideboard Tab */}
              <TabPanel value={tabValue} index={1}>
                <Droppable droppableId="sideboard">
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ minHeight: 200 }}
                    >
                      {Object.entries(groupedSideboard).map(([type, cards]) => {
                        if (cards.length === 0) return null;
                        
                        return (
                          <Box key={type} sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {type} ({cards.reduce((sum, card) => sum + card.quantity, 0)})
                            </Typography>
                            <Box>
                              {cards.map((deckCard, idx) => (
                                <Draggable
                                  key={deckCard.id || `side-${deckCard.index}`}
                                  draggableId={deckCard.id || `side-${deckCard.index}`}
                                  index={idx}
                                >
                                  {(provided) => (
                                    <Box
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      sx={{
                                        p: 1,
                                        mb: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        '&:hover': {
                                          bgcolor: 'action.hover',
                                        },
                                      }}
                                      onMouseEnter={() => handleCardHover(deckCard.card)}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="body2" sx={{ mr: 1, minWidth: 20 }}>
                                          {deckCard.quantity}x
                                        </Typography>
                                        <Typography variant="body1">
                                          {deckCard.card.name}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleAddCard(deckCard.card, true)}
                                        >
                                          <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveCard(deckCard.index, true)}
                                        >
                                          <RemoveIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleMoveCard(deckCard.index, true, false)}
                                        >
                                          <ArrowBack fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
                                        </IconButton>
                                      </Box>
                                    </Box>
                                  )}
                                </Draggable>
                              ))}
                            </Box>
                          </Box>
                        );
                      })}
                      {sideboardCards.length === 0 && (
                        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                          Your sideboard is empty. Add cards from the main deck or search for new cards.
                        </Typography>
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </TabPanel>
            </DragDropContext>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                {isEditMode && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleConfirmDelete}
                    sx={{ mr: 1 }}
                  >
                    Delete Deck
                  </Button>
                )}
              </Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSaveDeck}
                disabled={saving || !deckName.trim()}
              >
                {saving ? 'Saving...' : 'Save Deck'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this deck? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDeck} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Tab Panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default DeckBuilder;
import React, { useState, useEffect, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CardMedia,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { deckApi } from '../api/api';

function DeckList() {
  const [decks, setDecks] = useState([]);
  const [filteredDecks, setFilteredDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState(null);
  const [sortOption, setSortOption] = useState('updated');
  const [filterFormat, setFilterFormat] = useState('');
  const [deckCards, setDeckCards] = useState({});

  const sortOptions = [
    { value: 'updated', label: 'Last Updated' },
    { value: 'created', label: 'Date Created' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
  ];

  // Get unique formats from decks
  const formats = [...new Set(decks.map((deck) => deck.format).filter(Boolean))];

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const data = await deckApi.getDecks();
      setDecks(data);
      setFilteredDecks(data);
      setError(null);
      
      // Fetch cards for each deck
      const deckCardsData = {};
      for (const deck of data) {
        try {
          const deckDetail = await deckApi.getDeck(deck.id);
          deckCardsData[deck.id] = deckDetail.cards;
        } catch (err) {
          console.error(`Error fetching cards for deck ${deck.id}:`, err);
        }
      }
      setDeckCards(deckCardsData);
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError('Failed to load decks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get featured cards for a deck
  const getFeaturedCards = (deckId) => {
    if (!deckCards[deckId]) return [];
    
    // First try to get nonland cards with quantity >= 4
    let eligibleCards = deckCards[deckId].filter(card =>
      !card.card.type_line.includes('Land') &&
      card.quantity >= 4 &&
      card.card.image_uri // Make sure it has an image
    );
    
    // If we don't have enough eligible cards, get any nonland cards
    if (eligibleCards.length < 3) {
      eligibleCards = deckCards[deckId].filter(card =>
        !card.card.type_line.includes('Land') &&
        card.card.image_uri // Make sure it has an image
      );
    }
    
    // If we still don't have enough cards, return what we have
    if (eligibleCards.length === 0) return [];
    
    // Randomly select up to 3 cards
    const shuffled = [...eligibleCards].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(3, shuffled.length));
  };

  useEffect(() => {
    // Apply search, sort, and filter
    let result = [...decks];

    // Apply search
    if (searchTerm) {
      result = result.filter(
        (deck) =>
          deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (deck.description &&
            deck.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply format filter
    if (filterFormat) {
      result = result.filter((deck) => deck.format === filterFormat);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at);
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    setFilteredDecks(result);
  }, [decks, searchTerm, sortOption, filterFormat]);

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;

    try {
      await deckApi.deleteDeck(deckToDelete.id);
      setDecks(decks.filter((deck) => deck.id !== deckToDelete.id));
      setDeleteDialogOpen(false);
      setDeckToDelete(null);
    } catch (err) {
      console.error('Error deleting deck:', err);
      setError('Failed to delete deck. Please try again later.');
    }
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (option) => {
    setSortOption(option);
    handleSortClose();
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (format) => {
    setFilterFormat(format);
    handleFilterClose();
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const confirmDelete = (deck) => {
    setDeckToDelete(deck);
    setDeleteDialogOpen(true);
  };

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
          Your Decks
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/decks/new"
          startIcon={<EditIcon />}
        >
          Create New Deck
        </Button>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <TextField
          placeholder="Search decks..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ width: { xs: '100%', sm: '300px' } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box>
          <IconButton
            aria-label="sort"
            aria-controls="sort-menu"
            aria-haspopup="true"
            onClick={handleSortClick}
          >
            <SortIcon />
          </IconButton>
          <Menu
            id="sort-menu"
            anchorEl={sortAnchorEl}
            keepMounted
            open={Boolean(sortAnchorEl)}
            onClose={handleSortClose}
          >
            {sortOptions.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => handleSortSelect(option.value)}
                selected={sortOption === option.value}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          <IconButton
            aria-label="filter"
            aria-controls="filter-menu"
            aria-haspopup="true"
            onClick={handleFilterClick}
            disabled={formats.length === 0}
          >
            <FilterIcon />
          </IconButton>
          <Menu
            id="filter-menu"
            anchorEl={filterAnchorEl}
            keepMounted
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
          >
            <MenuItem onClick={() => handleFilterSelect('')}>
              All Formats
            </MenuItem>
            <Divider />
            {formats.map((format) => (
              <MenuItem
                key={format}
                onClick={() => handleFilterSelect(format)}
                selected={filterFormat === format}
              >
                {format}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : filteredDecks.length > 0 ? (
        <Grid container spacing={3}>
          {filteredDecks.map((deck) => (
            <Grid item xs={12} sm={6} md={4} key={deck.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {deck.name}
                  </Typography>
                  {deck.format && (
                    <Chip
                      label={deck.format}
                      size="small"
                      color="primary"
                      sx={{ mb: 1 }}
                    />
                  )}
                  
                  {/* Featured Cards */}
                  {deckCards[deck.id] && (
                    <Box sx={{
                      height: 120,
                      position: 'relative',
                      my: 2,
                      display: 'flex',
                      justifyContent: 'center'
                    }}>
                      {getFeaturedCards(deck.id).map((card, index) => (
                        <Box
                          key={card.id}
                          sx={{
                            position: 'absolute',
                            left: `calc(50% - 40px + ${index * 30}px)`,
                            top: 0,
                            width: 80,
                            height: 112,
                            transform: `rotate(${(index - 1) * 5}deg)`,
                            transformOrigin: 'bottom center',
                            transition: 'transform 0.2s',
                            zIndex: index,
                            '&:hover': {
                              transform: `rotate(${(index - 1) * 5}deg) translateY(-10px)`,
                              zIndex: 10
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={card.card.image_uri}
                            alt={card.card.name}
                            sx={{
                              height: '100%',
                              width: '100%',
                              objectFit: 'cover',
                              borderRadius: 1,
                              boxShadow: 2
                            }}
                          />
                        </Box>
                      ))}
                      {getFeaturedCards(deck.id).length === 0 && (
                        <Box sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          width: '100%'
                        }}>
                          <Typography variant="caption" color="text.secondary">
                            No preview available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                  
                  {deck.tags && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      {deck.tags.split(',').map((tag) => (
                        <Chip
                          key={tag}
                          label={tag.trim()}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}
                  {deck.description && (
                    <Typography variant="body2" color="text.secondary">
                      {deck.description.length > 100
                        ? `${deck.description.substring(0, 100)}...`
                        : deck.description}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    Last updated:{' '}
                    {new Date(deck.updated_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    component={RouterLink}
                    to={`/decks/${deck.id}`}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    component={RouterLink}
                    to={`/decks/${deck.id}/edit`}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => confirmDelete(deck)}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">
          {searchTerm || filterFormat
            ? 'No decks match your search criteria. Try adjusting your filters.'
            : "You don't have any decks yet. Create your first deck to get started!"}
        </Alert>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the deck "{deckToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteDeck} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DeckList;
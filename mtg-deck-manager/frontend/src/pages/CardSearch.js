import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { cardApi } from '../api/api';

// Card colors
const COLORS = [
  { value: 'W', label: 'White', color: '#F8E7B9' },
  { value: 'U', label: 'Blue', color: '#B3CEEA' },
  { value: 'B', label: 'Black', color: '#B0AEAE' },
  { value: 'R', label: 'Red', color: '#EAA393' },
  { value: 'G', label: 'Green', color: '#C4D3B5' },
];

// Card types
const TYPES = [
  'Creature',
  'Planeswalker',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Land',
];

// Card rarities
const RARITIES = [
  'common',
  'uncommon',
  'rare',
  'mythic',
];

function CardSearch() {
  // Search parameters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [cmc, setCmc] = useState('');
  
  // Results state
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  const cardsPerPage = 20;

  // Effect to search cards when parameters change
  useEffect(() => {
    searchCards();
  }, [page]);

  const searchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build search parameters
      const params = {
        skip: (page - 1) * cardsPerPage,
        limit: cardsPerPage,
      };
      
      if (searchTerm) {
        params.name = searchTerm;
      }
      
      if (selectedColors.length > 0) {
        params.colors = selectedColors.join(',');
      }
      
      if (selectedType) {
        params.type_line = selectedType;
      }
      
      if (selectedRarity) {
        params.rarity = selectedRarity;
      }
      
      if (cmc && !isNaN(parseInt(cmc))) {
        params.cmc = parseInt(cmc);
      }
      
      const results = await cardApi.searchCards(params);
      setCards(results);
      
      // Calculate total pages (this is a simplification - in a real app, the API would return total count)
      setTotalPages(Math.ceil(results.length / cardsPerPage) || 1);
      
    } catch (err) {
      console.error('Error searching cards:', err);
      setError('Failed to search cards. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    searchCards();
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedColors([]);
    setSelectedType('');
    setSelectedRarity('');
    setCmc('');
    setPage(1);
    searchCards();
  };

  const handleColorToggle = (color) => {
    setSelectedColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Card Search
      </Typography>

      {/* Search Form */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search Cards"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="clear search"
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={toggleFilters}
                sx={{ mr: 1 }}
              >
                {filtersVisible ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                sx={{ mr: 1 }}
              >
                Clear
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SearchIcon />}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          {filtersVisible && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Colors
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {COLORS.map((color) => (
                      <Chip
                        key={color.value}
                        label={color.label}
                        onClick={() => handleColorToggle(color.value)}
                        sx={{
                          bgcolor: selectedColors.includes(color.value)
                            ? color.color
                            : 'default',
                          '&:hover': {
                            bgcolor: selectedColors.includes(color.value)
                              ? color.color
                              : 'action.hover',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="type-select-label">Card Type</InputLabel>
                    <Select
                      labelId="type-select-label"
                      value={selectedType}
                      label="Card Type"
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="rarity-select-label">Rarity</InputLabel>
                    <Select
                      labelId="rarity-select-label"
                      value={selectedRarity}
                      label="Rarity"
                      onChange={(e) => setSelectedRarity(e.target.value)}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {RARITIES.map((rarity) => (
                        <MenuItem key={rarity} value={rarity}>
                          {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Mana Value (CMC)"
                    type="number"
                    value={cmc}
                    onChange={(e) => setCmc(e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </form>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : cards.length > 0 ? (
        <>
          <Typography variant="subtitle1" gutterBottom>
            Showing {cards.length} results
          </Typography>
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid item xs={6} sm={4} md={3} lg={2} key={card.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                  className="card-hover"
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/cards/${card.id}`}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    {card.image_uri ? (
                      <CardMedia
                        component="img"
                        image={card.image_uri}
                        alt={card.name}
                        sx={{ aspectRatio: '0.716' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 0,
                          paddingTop: '139.6%', // MTG card aspect ratio
                          bgcolor: 'action.hover',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            p: 1,
                          }}
                        >
                          {card.name}
                        </Typography>
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {card.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {card.type_line}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <Alert severity="info">
          No cards found. Try adjusting your search criteria.
        </Alert>
      )}
    </Box>
  );
}

export default CardSearch;
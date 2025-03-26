import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import ManaSymbol from '../components/ManaSymbol';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  OpenInNew as ExternalLinkIcon,
} from '@mui/icons-material';
import { cardApi } from '../api/api';

// Card colors mapping
const MANA_COLORS = {
  W: { name: 'White', color: '#F8E7B9' },
  U: { name: 'Blue', color: '#B3CEEA' },
  B: { name: 'Black', color: '#B0AEAE' },
  R: { name: 'Red', color: '#EAA393' },
  G: { name: 'Green', color: '#C4D3B5' },
};

function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addToDeckDialogOpen, setAddToDeckDialogOpen] = useState(false);

  useEffect(() => {
    fetchCard();
  }, [id]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      const cardData = await cardApi.getCard(id);
      setCard(cardData);
      setError(null);
    } catch (err) {
      console.error('Error fetching card:', err);
      setError('Failed to load card details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleAddToDeck = () => {
    setAddToDeckDialogOpen(true);
  };

  // Parse colors from card data
  const getCardColors = (card) => {
    if (!card || !card.colors) return [];
    
    return card.colors.split(',').map(color => ({
      code: color,
      name: MANA_COLORS[color]?.name || color,
      color: MANA_COLORS[color]?.color || '#888888',
    }));
  };

  // Format legality information
  const formatLegalities = (legalities) => {
    if (!legalities) return {};
    
    try {
      // If legalities is a string, parse it
      const legalitiesObj = typeof legalities === 'string' 
        ? JSON.parse(legalities) 
        : legalities;
      
      return legalitiesObj;
    } catch (e) {
      console.error('Error parsing legalities:', e);
      return {};
    }
  };

  // Format price information
  const formatPrices = (prices) => {
    if (!prices) return {};
    
    try {
      // If prices is a string, parse it
      const pricesObj = typeof prices === 'string' 
        ? JSON.parse(prices) 
        : prices;
      
      return pricesObj;
    } catch (e) {
      console.error('Error parsing prices:', e);
      return {};
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!card) {
    return <Alert severity="info">Card not found.</Alert>;
  }

  const cardColors = getCardColors(card);
  
  // Get additional data if available
  const additionalData = card.additional_data || {};
  const legalities = formatLegalities(additionalData.legalities);
  const prices = formatPrices(additionalData.prices);

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
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={handleGoBack}
        >
          Back
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Card Image */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            {card.image_uri ? (
              <CardMedia
                component="img"
                image={card.image_uri}
                alt={card.name}
                sx={{ width: '100%', borderRadius: 1 }}
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
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    p: 2,
                  }}
                >
                  {card.name}
                </Typography>
              </Box>
            )}
          </Card>

          {/* External Links */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              External Links
            </Typography>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<ExternalLinkIcon />}
              href={`https://scryfall.com/card/${card.set_code}/${card.collector_number}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mb: 1 }}
            >
              View on Scryfall
            </Button>
            <Button
              variant="outlined"
              size="small"
              fullWidth
              startIcon={<ExternalLinkIcon />}
              href={`https://gatherer.wizards.com/Pages/Search/Default.aspx?name=+[${encodeURIComponent(card.name)}]`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Gatherer
            </Button>
          </Paper>
        </Grid>

        {/* Card Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {card.name}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {card.rarity && (
                <Chip
                  label={card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
              {card.set_code && (
                <Chip
                  label={`Set: ${card.set_code.toUpperCase()}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {cardColors.map((color) => (
                <Chip
                  key={color.code}
                  label={color.name}
                  size="small"
                  sx={{
                    bgcolor: color.color,
                    color: 'text.primary',
                  }}
                />
              ))}
            </Box>

            <Typography variant="h6" gutterBottom>
              {card.type_line}
            </Typography>

            {card.mana_cost && (
              <Typography variant="body1" gutterBottom>
                <strong>Mana Cost:</strong> <ManaSymbol manaCost={card.mana_cost} size="medium" />
              </Typography>
            )}

            {card.oracle_text && (
              <Box sx={{ my: 2 }}>
                <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
                  {card.oracle_text}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Card Details Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  {card.cmc !== null && card.cmc !== undefined && (
                    <TableRow>
                      <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                        <strong>Mana Value (CMC)</strong>
                      </TableCell>
                      <TableCell>{card.cmc}</TableCell>
                    </TableRow>
                  )}
                  {card.colors && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Colors</strong>
                      </TableCell>
                      <TableCell>
                        {cardColors.map((color) => color.name).join(', ') || 'Colorless'}
                      </TableCell>
                    </TableRow>
                  )}
                  {card.set_code && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Set</strong>
                      </TableCell>
                      <TableCell>{card.set_code.toUpperCase()}</TableCell>
                    </TableRow>
                  )}
                  {card.collector_number && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Collector Number</strong>
                      </TableCell>
                      <TableCell>{card.collector_number}</TableCell>
                    </TableRow>
                  )}
                  {card.rarity && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Rarity</strong>
                      </TableCell>
                      <TableCell>
                        {card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Legalities */}
            {Object.keys(legalities).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Format Legality
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {Object.entries(legalities).map(([format, legality]) => (
                        <TableRow key={format}>
                          <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                            {format.charAt(0).toUpperCase() + format.slice(1)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={legality}
                              size="small"
                              color={legality === 'legal' ? 'success' : 'error'}
                              variant={legality === 'legal' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Prices */}
            {Object.keys(prices).length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Prices
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableBody>
                      {prices.usd && (
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ width: '30%' }}>
                            Regular
                          </TableCell>
                          <TableCell>${prices.usd}</TableCell>
                        </TableRow>
                      )}
                      {prices.usd_foil && (
                        <TableRow>
                          <TableCell component="th" scope="row">
                            Foil
                          </TableCell>
                          <TableCell>${prices.usd_foil}</TableCell>
                        </TableRow>
                      )}
                      {prices.eur && (
                        <TableRow>
                          <TableCell component="th" scope="row">
                            EUR
                          </TableCell>
                          <TableCell>€{prices.eur}</TableCell>
                        </TableRow>
                      )}
                      {prices.tix && (
                        <TableRow>
                          <TableCell component="th" scope="row">
                            MTGO Tickets
                          </TableCell>
                          <TableCell>{prices.tix}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add to Deck Dialog would go here */}
      {/* This would be implemented with a Dialog component that shows a list of the user's decks */}
      {/* For brevity, I'm not implementing the full dialog here */}
    </Box>
  );
}

export default CardDetail;
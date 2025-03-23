import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
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
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { deckApi } from '../api/api';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

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

// Colors for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Mana symbols mapping
const MANA_COLORS = {
  W: '#F8E7B9', // White
  U: '#B3CEEA', // Blue
  B: '#B0AEAE', // Black
  R: '#EAA393', // Red
  G: '#C4D3B5', // Green
};

function DeckDetail() {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchDeckAndStats = async () => {
      try {
        setLoading(true);
        const [deckData, statsData] = await Promise.all([
          deckApi.getDeck(id),
          deckApi.getDeckStats(id),
        ]);
        setDeck(deckData);
        setStats(statsData);
        
        // Set the first card as the hovered card initially
        if (deckData.cards && deckData.cards.length > 0) {
          setHoveredCard(deckData.cards[0].card);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching deck details:', err);
        setError('Failed to load deck details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDeckAndStats();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Group cards by type
  const groupCardsByType = (cards, isSideboard = false) => {
    const grouped = {};
    
    // Initialize groups
    CARD_TYPES.forEach(type => {
      grouped[type] = [];
    });
    
    // Filter by sideboard status and group by type
    cards
      .filter(card => card.is_sideboard === isSideboard)
      .forEach(deckCard => {
        const card = deckCard.card;
        let assigned = false;
        
        // Determine card type category
        for (const type of CARD_TYPES) {
          if (card.type_line && card.type_line.includes(type)) {
            grouped[type].push({ ...deckCard, card });
            assigned = true;
            break;
          }
        }
        
        // If no category matched, put in Other
        if (!assigned) {
          grouped['Other'].push({ ...deckCard, card });
        }
      });
    
    return grouped;
  };

  // Prepare data for mana curve chart
  const prepareManaData = (stats) => {
    if (!stats || !stats.mana_curve) return [];
    
    return Object.entries(stats.mana_curve)
      .map(([cmc, count]) => ({
        name: cmc === 'Unknown' ? 'X' : cmc,
        count: count,
      }))
      .sort((a, b) => {
        if (a.name === 'X') return 1;
        if (b.name === 'X') return -1;
        return parseInt(a.name) - parseInt(b.name);
      });
  };

  // Prepare data for color distribution chart
  const prepareColorData = (stats) => {
    if (!stats || !stats.color_distribution) return [];
    
    return Object.entries(stats.color_distribution).map(([color, count]) => ({
      name: color,
      value: count,
      color: MANA_COLORS[color] || '#888888',
    }));
  };

  // Prepare data for card types chart
  const prepareTypeData = (stats) => {
    if (!stats || !stats.card_types) return [];
    
    return Object.entries(stats.card_types).map(([type, count]) => ({
      name: type,
      count: count,
    }));
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

  if (!deck) {
    return <Alert severity="info">Deck not found.</Alert>;
  }

  const mainDeckCards = deck.cards.filter(card => !card.is_sideboard);
  const sideboardCards = deck.cards.filter(card => card.is_sideboard);
  const mainDeckCount = mainDeckCards.reduce((sum, card) => sum + card.quantity, 0);
  const sideboardCount = sideboardCards.reduce((sum, card) => sum + card.quantity, 0);
  
  const groupedMainDeck = groupCardsByType(deck.cards, false);
  const groupedSideboard = groupCardsByType(deck.cards, true);

  const manaData = prepareManaData(stats);
  const colorData = prepareColorData(stats);
  const typeData = prepareTypeData(stats);

  return (
    <Box>
      {/* Deck Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {deck.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {deck.format && (
                <Chip
                  label={deck.format}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              <Typography variant="body2" color="text.secondary">
                {mainDeckCount} cards in main deck
                {sideboardCount > 0 && `, ${sideboardCount} in sideboard`}
              </Typography>
            </Box>
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
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, sm: 0 } }}>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              component={RouterLink}
              to={`/decks/${deck.id}/edit`}
            >
              Edit Deck
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
          </Box>
        </Box>
        {deck.description && (
          <Typography variant="body1" paragraph>
            {deck.description}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Created: {new Date(deck.created_at).toLocaleDateString()} | Last updated:{' '}
          {new Date(deck.updated_at).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Tabs for Deck List and Statistics */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="deck tabs"
          >
            <Tab label="Deck List" />
            <Tab label="Statistics" icon={<StatsIcon />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Deck List Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Main Deck */}
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom>
                Main Deck ({mainDeckCount})
              </Typography>
              {CARD_TYPES.map((type) => {
                const cards = groupedMainDeck[type];
                if (cards.length === 0) return null;
                
                const typeCount = cards.reduce((sum, card) => sum + card.quantity, 0);
                
                return (
                  <Box key={type} sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {type} ({typeCount})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell width="10%">Qty</TableCell>
                            <TableCell width="50%">Name</TableCell>
                            <TableCell width="20%">Mana Cost</TableCell>
                            <TableCell width="20%">Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cards.map((deckCard) => (
                            <TableRow
                              key={deckCard.id}
                              hover
                              onMouseEnter={() => setHoveredCard(deckCard.card)}
                            >
                              <TableCell>{deckCard.quantity}</TableCell>
                              <TableCell>
                                <RouterLink
                                  to={`/cards/${deckCard.card.id}`}
                                  style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  {deckCard.card.name}
                                </RouterLink>
                              </TableCell>
                              <TableCell>{deckCard.card.mana_cost || '-'}</TableCell>
                              <TableCell>{deckCard.card.type_line}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                );
              })}
            </Grid>

            {/* Sideboard */}
            <Grid item xs={12} md={4}>
              {sideboardCount > 0 && (
                <>
                  <Typography variant="h5" gutterBottom>
                    Sideboard ({sideboardCount})
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell width="10%">Qty</TableCell>
                          <TableCell width="60%">Name</TableCell>
                          <TableCell width="30%">Type</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sideboardCards.map((deckCard) => (
                          <TableRow
                            key={deckCard.id}
                            hover
                            onMouseEnter={() => setHoveredCard(deckCard.card)}
                          >
                            <TableCell>{deckCard.quantity}</TableCell>
                            <TableCell>
                              <RouterLink
                                to={`/cards/${deckCard.card.id}`}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                              >
                                {deckCard.card.name}
                              </RouterLink>
                            </TableCell>
                            <TableCell>{deckCard.card.type_line}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              {/* Preview Card */}
              <Box sx={{ mt: 4, position: 'sticky', top: 20 }}>
                <Typography variant="h6" gutterBottom>
                  Card Preview
                </Typography>
                <Card sx={{ maxWidth: 300, mx: 'auto' }}>
                  {hoveredCard && hoveredCard.image_uri ? (
                    <CardMedia
                      component="img"
                      image={hoveredCard.image_uri}
                      alt={hoveredCard.name}
                      sx={{
                        borderRadius: 1,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    />
                  ) : deck.cards.length > 0 && deck.cards[0].card.image_uri ? (
                    <CardMedia
                      component="img"
                      image={deck.cards[0].card.image_uri}
                      alt={deck.cards[0].card.name}
                      sx={{
                        borderRadius: 1,
                        transition: 'all 0.3s ease-in-out'
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 420,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" align="center">
                        Hover over a card to see its image
                      </Typography>
                    </Box>
                  )}
                </Card>
                {hoveredCard && (
                  <Typography
                    variant="subtitle1"
                    align="center"
                    sx={{ mt: 1 }}
                  >
                    {hoveredCard.name}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={1}>
          {stats ? (
            <Grid container spacing={4}>
              {/* Mana Curve */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Mana Curve
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={manaData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Cards" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Color Distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Color Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={colorData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {colorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Card Types */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Card Types
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={typeData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#82ca9d" name="Cards" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Deck Composition */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Deck Composition
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Total Cards</TableCell>
                          <TableCell align="right">{stats.total_cards}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Main Deck</TableCell>
                          <TableCell align="right">{stats.main_deck_count}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sideboard</TableCell>
                          <TableCell align="right">{stats.sideboard_count}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={2}>
                            <Divider sx={{ my: 1 }} />
                          </TableCell>
                        </TableRow>
                        {stats.rarity_distribution && Object.entries(stats.rarity_distribution).map(([rarity, count]) => (
                          <TableRow key={rarity}>
                            <TableCell>{rarity.charAt(0).toUpperCase() + rarity.slice(1)}</TableCell>
                            <TableCell align="right">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              Statistics are not available for this deck.
            </Alert>
          )}
        </TabPanel>
      </Box>
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
      id={`deck-tabpanel-${index}`}
      aria-labelledby={`deck-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default DeckDetail;
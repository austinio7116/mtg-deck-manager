import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewList as ViewListIcon,
  Search as SearchIcon,
  FileUpload as ImportIcon,
} from '@mui/icons-material';
import { deckApi } from '../api/api';

function Dashboard() {
  const [recentDecks, setRecentDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecentDecks = async () => {
      try {
        setLoading(true);
        const decks = await deckApi.getDecks();
        // Sort by updated_at and take the 4 most recent
        const sorted = [...decks].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        ).slice(0, 4);
        setRecentDecks(sorted);
        setError(null);
      } catch (err) {
        console.error('Error fetching recent decks:', err);
        setError('Failed to load recent decks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDecks();
  }, []);

  const quickActions = [
    {
      title: 'Create New Deck',
      description: 'Build a deck from scratch with our drag-and-drop builder',
      icon: <AddIcon fontSize="large" color="primary" />,
      link: '/decks/new',
      color: 'primary',
    },
    {
      title: 'Browse Decks',
      description: 'View and manage your existing decks',
      icon: <ViewListIcon fontSize="large" color="secondary" />,
      link: '/decks',
      color: 'secondary',
    },
    {
      title: 'Search Cards',
      description: 'Find cards by name, color, type, and more',
      icon: <SearchIcon fontSize="large" color="info" />,
      link: '/cards',
      color: 'info',
    },
    {
      title: 'Import Deck',
      description: 'Import a deck from MTGA text format',
      icon: <ImportIcon fontSize="large" color="success" />,
      link: '/import',
      color: 'success',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to MTG Deck Manager
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Manage your Magic: The Gathering decks with ease. Build, analyze, and optimize your decks.
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            {quickActions.map((action) => (
              <Grid item xs={12} sm={6} md={3} key={action.title}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    {action.icon}
                    <Typography variant="h6" align="center" sx={{ mt: 1 }}>
                      {action.title}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ mb: 2, flexGrow: 1 }}
                  >
                    {action.description}
                  </Typography>
                  <Button
                    variant="contained"
                    color={action.color}
                    component={RouterLink}
                    to={action.link}
                    fullWidth
                  >
                    {action.title}
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Decks */}
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>
            Recent Decks
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : recentDecks.length > 0 ? (
            <Grid container spacing={2}>
              {recentDecks.map((deck) => (
                <Grid item xs={12} sm={6} md={3} key={deck.id}>
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
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Format: {deck.format}
                        </Typography>
                      )}
                      {deck.description && (
                        <Typography variant="body2" color="text.secondary">
                          {deck.description.length > 100
                            ? `${deck.description.substring(0, 100)}...`
                            : deck.description}
                        </Typography>
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/decks/${deck.id}`}
                      >
                        View Deck
                      </Button>
                      <Button
                        size="small"
                        component={RouterLink}
                        to={`/decks/${deck.id}/edit`}
                      >
                        Edit
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              You don't have any decks yet. Create your first deck to get started!
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
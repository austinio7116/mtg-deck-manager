import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Chip,
} from '@mui/material';
import { FileUpload as ImportIcon } from '@mui/icons-material';
import { deckApi } from '../api/api';

function ImportDeck() {
  const navigate = useNavigate();
  const [deckText, setDeckText] = useState('');
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckFormat, setDeckFormat] = useState('');
  const [deckTags, setDeckTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [importedDeckId, setImportedDeckId] = useState(null);

  const handleImport = async (e) => {
    e.preventDefault();
    
    if (!deckText.trim() || !deckName.trim()) {
      setError('Deck text and name are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const importData = {
        deck_text: deckText,
        name: deckName,
        description: deckDescription,
        format: deckFormat,
        tags: deckTags,
      };
      
      const result = await deckApi.importDeck(importData);
      
      setSuccess(true);
      setImportedDeckId(result.id);
      
      // Clear form
      setDeckText('');
      setDeckName('');
      setDeckDescription('');
      setDeckFormat('');
      setDeckTags('');
      
    } catch (err) {
      console.error('Error importing deck:', err);
      setError('Failed to import deck. Please check your deck format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDeck = () => {
    if (importedDeckId) {
      navigate(`/decks/${importedDeckId}`);
    }
  };

  const exampleDeckText = `1 Island
1 Swamp
4 Concealed Courtyard
3 Caves of Koilos
1 Adarkar Wastes
3 Underground River
4 Darkslick Shores
4 Seachrome Coast
1 Destroy Evil
3 Dreams of Steel and Oil
4 Hopeless Nightmare

2 Duress
2 Rest in Peace
2 Destroy Evil`;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Import Deck
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Import a deck from Magic: The Gathering Arena text format.
      </Typography>

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleViewDeck}>
              View Deck
            </Button>
          }
        >
          Deck imported successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleImport}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Tags"
                    fullWidth
                    value={deckTags}
                    onChange={(e) => setDeckTags(e.target.value)}
                    placeholder="Comma-separated tags"
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
                <Grid item xs={12}>
                  <TextField
                    label="Deck List (MTGA Format)"
                    fullWidth
                    required
                    multiline
                    rows={10}
                    value={deckText}
                    onChange={(e) => setDeckText(e.target.value)}
                    placeholder="Paste your deck list here..."
                    helperText="Paste your deck from MTGA. Main deck and sideboard should be separated by a blank line."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <ImportIcon />}
                  >
                    {loading ? 'Importing...' : 'Import Deck'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Format Instructions
            </Typography>
            <Typography variant="body2" paragraph>
              The deck should be in MTGA export format:
            </Typography>
            <Typography variant="body2" component="div">
              <ul>
                <li>Each line should contain a quantity followed by a card name</li>
                <li>Separate the main deck and sideboard with a blank line</li>
                <li>Set codes and collector numbers are optional</li>
              </ul>
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Example
            </Typography>
            <Box
              sx={{
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {exampleDeckText}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" color="text.secondary">
              After importing, you can edit the deck, add or remove cards, and view detailed statistics.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ImportDeck;
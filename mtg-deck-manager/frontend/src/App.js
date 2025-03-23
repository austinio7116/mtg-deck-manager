import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { ThemeContext } from './context/ThemeContext';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import DeckList from './pages/DeckList';
import DeckDetail from './pages/DeckDetail';
import DeckBuilder from './pages/DeckBuilder';
import CardSearch from './pages/CardSearch';
import CardDetail from './pages/CardDetail';
import ImportDeck from './pages/ImportDeck';
import NotFound from './pages/NotFound';

function App() {
  const { mode } = useContext(ThemeContext);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/decks" element={<DeckList />} />
          <Route path="/decks/:id" element={<DeckDetail />} />
          <Route path="/decks/new" element={<DeckBuilder />} />
          <Route path="/decks/:id/edit" element={<DeckBuilder />} />
          <Route path="/cards" element={<CardSearch />} />
          <Route path="/cards/:id" element={<CardDetail />} />
          <Route path="/import" element={<ImportDeck />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </Box>
  );
}

export default App;
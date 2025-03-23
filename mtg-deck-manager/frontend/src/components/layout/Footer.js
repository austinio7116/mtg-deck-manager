import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' MTG Deck Manager. All rights reserved.'}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: { xs: 2, sm: 0 },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              Powered by{' '}
              <Link
                color="inherit"
                href="https://scryfall.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Scryfall
              </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Card images & data © Wizards of the Coast
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default Footer;
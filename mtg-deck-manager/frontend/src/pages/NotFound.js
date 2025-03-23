import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 8,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 500,
        }}
      >
        <Typography variant="h1" color="primary" sx={{ mb: 2, fontSize: '6rem' }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Paper>
    </Box>
  );
}

export default NotFound;
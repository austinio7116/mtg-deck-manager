# MTG Deck Manager Frontend

This is the frontend for the Magic: The Gathering Deck Manager application. It's built with React and Material-UI.

## Features

- Clean, modern UI with dark mode support
- Deck management (create, view, edit, delete)
- Deck import from MTGA format
- Card search and filtering
- Deck statistics (mana curve, color distribution)
- Responsive design for desktop and mobile

## Setup

1. Ensure you have Node.js 14+ installed
2. Install dependencies:
   ```
   npm install
   ```

## Running the Application

```
npm start
```

The application will be available at http://localhost:3000

## Project Structure

- `src/api` - API service for communicating with the backend
- `src/components` - Reusable UI components
- `src/context` - React context providers (theme, etc.)
- `src/hooks` - Custom React hooks
- `src/pages` - Page components
- `src/utils` - Utility functions

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Dependencies

- React
- React Router
- Material-UI
- Axios
- React Beautiful DnD
- Recharts

## Backend API

The frontend communicates with the backend API running at http://localhost:8000. Make sure the backend server is running before starting the frontend application.
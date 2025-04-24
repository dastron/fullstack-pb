# App Frontend

Vite-powered React frontend for the Fullstack-PB application.

## Overview

This workspace contains the React frontend application built with Vite, Chakra UI, and TypeScript. It communicates with the Functions service and PocketBase directly.

## Development

```bash
# Start the frontend in development mode
yarn dev

# Build the application
yarn build

# Run tests
yarn test

# Format code
yarn format

# Lint code
yarn lint

# Preview production build
yarn preview
```

## Key Features

- React 18 with TypeScript
- Chakra UI for component styling
- React Router for navigation
- React Hook Form for form handling
- PocketBase client for direct database access
- Integration with backend Functions service

## Environment Variables

Configure these variables in the root `.env` file:

- `VITE_FUNCTIONS_URL`: URL for the backend Functions service
- `VITE_POCKETBASE_URL`: URL for PocketBase database

## Project Structure

```
app/
├── public/          # Static assets
├── src/
│   ├── components/  # Reusable UI components
│   ├── hooks/       # Custom React hooks
│   ├── pages/       # Page components
│   ├── utils/       # Utility functions
│   ├── App.tsx      # Main application component
│   └── main.tsx     # Application entry point
└── package.json     # Workspace dependencies
```

## Integration

The App frontend integrates with:
- Backend Functions service (`functions` workspace)
- PocketBase database (`pb` directory)
- Shared utilities (`shared` workspace)

See the root README for more details on the full stack architecture and local development setup.

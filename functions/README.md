# Functions Service

Node.js/Express backend service for the Fullstack-PB application.

## Overview

This service provides the backend API functionality for the application, connecting to PocketBase for data storage and offering additional server-side features. It handles:

- API endpoints for frontend requests
- Authentication with PocketBase
- Business logic implementation
- OpenAI API integration for AI features
- Data validation and processing

## Development

```bash
# Start the functions service in development mode
yarn dev

# Build the service
yarn build

# Run tests
yarn test

# Run type checking
yarn typecheck

# Format code
yarn format

# Lint code
yarn lint
```

## Project Structure

```
functions/
├── src/
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── routes/        # API route definitions
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── index.ts       # Application entry point
├── tests/             # Test files
└── package.json       # Workspace dependencies
```

## Dependencies

- **Express**: Web server framework
- **PocketBase**: Client for PocketBase database connection
- **OpenAI**: AI capabilities integration
- **Zod**: Schema validation
- **Shared**: Internal shared package (`@project/shared`)

## Environment Variables

This service requires the following environment variables (defined in the root `.env` file):

- `FUNCTIONS_PORT`: Port for the Express server (default: 8081)
- `API_URL`: PocketBase URL for backend connection
- `OPENAI_API_KEY`: OpenAI API key (if using AI features)
- `PB_SUPERUSER_EMAIL`: PocketBase admin email
- `PB_SUPERUSER_PASSWORD`: PocketBase admin password

## Integration

The Functions service works alongside:
- Frontend (`app` workspace)
- PocketBase database (`pb` directory)
- Shared utilities (`shared` workspace)

See the root README for more details on the overall architecture and setup.

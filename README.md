# FULLSTACK-PB-TEMPLATE

## Overview

Fullstack is a comprehensive full stack project template with React frontend, Node.js/Express backend, and PocketBase database.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/dastron/project.git
cd project

# Install dependencies
yarn install

# Complete setup (runs scripts, builds everything)
yarn setup

# Start development environment
yarn dev
```

## Scripts

### Core Commands

```bash
# Install dependencies
yarn install

# Complete setup (runs scripts, installs dependencies, builds)
yarn setup

# Start development environment (frontend, backend, shared, PocketBase)
yarn dev

# Build all workspaces
yarn build

```

### Database Commands

```bash
# Run PocketBase server only
yarn pb

# Sync dev database migrations to/from project
yarn pb:sync


# Creates a migration snapshot of the current pb
yarn pb:snapshot
```

### Testing & Quality

```bash
yarn test         # Run tests across all workspaces
yarn check        # Run all checks (format, lint, typecheck)
yarn lint         # Run linting across all workspaces
yarn format       # Format code across all workspaces
yarn typecheck    # Run type checking across all workspaces
yarn clean        # Clean all workspaces
```

### Dependency Management

```bash
yarn outdated     # Check for outdated packages
yarn update-deps  # Update all dependencies
yarn focus        # Focus on a specific workspace
yarn why          # Check why a package is installed
```

## Project Structure

```
project/
├── app/           # Vite React frontend
│   └── package.json
├── functions/     # Node.js/Express backend
│   └── package.json
├── shared/        # Shared code between workspaces
│   └── package.json
├── pb/            # PocketBase backend
├── package.json   # Root configuration
└── README.md
```

## Development Environment

### Prerequisites

- [Yarn](https://yarnpkg.com/) v4.7.0 or higher
- [Node.js](https://nodejs.org/) v14 or higher
- [Docker](https://www.docker.com/) (optional, for production testing)

### Environment Setup

1. Create a `.env` file in the root directory by copying the example:

   ```bash
   cp .envExample .env
   ```

2. Configure the environment variables in `.env`:

   ```
   # Functions Service (Node)
   FUNCTIONS_PORT=8081
   API_URL='http://localhost:8080' # PocketBase URL for backend
   OPENAI_API_KEY='sk-proj-...'
   PB_SUPERUSER_EMAIL='admin@example.com'
   PB_SUPERUSER_PASSWORD='password'

   # App Service (Vite)
   VITE_FUNCTIONS_URL='http://localhost:8081' # Functions URL for frontend
   VITE_POCKETBASE_URL='http://localhost:8080' # PocketBase URL for frontend

   # PocketBase (used in docker/staging)
   PB_VERSION=0.27.0 # Specify desired PocketBase version
   ```

3. Adjust the configuration as needed for your environment.

### Installation

1. Install dependencies:

    ```bash
    yarn install
    ```

2. Complete setup (runs scripts, installs dependencies, builds):

    ```bash
    yarn setup
    ```

3. Start the development environment:

    ```bash
    yarn dev
    ```

This will concurrently run:
- Shared workspace watcher
- React frontend (Vite)
- Express backend
- PocketBase server

## Working with Workspaces

This project uses Yarn Workspaces to manage dependencies across multiple packages:

```bash
# To work on a specific workspace
yarn workspace @project/app <command>

# To run commands across all workspaces
yarn workspaces foreach <command>

# To focus on a specific workspace
yarn focus @project/app
```

## Production Deployment

### Docker

You can run the application in a production-like environment using Docker:

```bash
# Build and run the Docker container locally
yarn staging
```

#### Testing Docker Locally

To manually build and run the Docker container:

```bash
# Build the Docker image
docker build -t fullstack-pb-template:local .

# Create a .dockerEnv file from .env
cp .dockerEnvExample .dockerEnv

# Run the container
docker run --rm -it \
  --env-file .dockerEnv \
  -p 8081:8081 \
  -p 8000:80 \
  -p 8080:8080 \
  fullstack-pb-template:local
```

This exposes:
- Frontend on http://localhost:8000
- PocketBase on http://localhost:8080
- API functions on http://localhost:8081

The Docker image includes:
- Compiled frontend (served via Nginx)
- Backend API server
- PocketBase database
- Process management with Supervisor

### CI/CD with GitHub Actions

This project uses GitHub Actions for continuous integration and deployment:

1. **Automated Testing**: On every push and pull request, tests are run to ensure code quality.

2. **Docker Image Building**: When a release is created or on pushes to the main branch:
   - A Docker image is built using the multi-stage Dockerfile
   - The image is tagged and pushed to the Docker registry
   - Both versioned tags and latest/nightly tags are created

3. **Release Management**: Release Please handles versioning based on conventional commits.

### Docker Image Tags

The following Docker image tags are available:

- `dastro/project:latest` - Latest stable release
- `dastro/project:x.y.z` - Specific version (e.g., 1.0.0)
- `dastro/project:nightly` - Latest nightly build
- `dastro/project:nightly-YYYYMMDD` - Specific nightly build date

## Release Process

This project uses [Release Please](https://github.com/googleapis/release-please) to automate versioning and changelog generation.

### How it Works

1. Commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
   - `feat: add new feature` - Minor version bump
   - `fix: resolve bug` - Patch version bump
   - `docs: update README` - No version bump
   - `chore: update dependencies` - No version bump
   - `BREAKING CHANGE: redesign API` - Major version bump

2. When commits are pushed to the main branch, Release Please automatically creates or updates a release PR.

3. When the release PR is merged, Release Please:
   - Creates a new GitHub release with a generated changelog
   - Tags the release with the new version
   - Triggers the release Docker build workflow

### Versioning

This project uses semantic versioning managed by Release Please. When a new release is created:

1. The version number is automatically incremented based on commit types
2. The version is passed to the Docker build process as a build argument
3. The Docker image is tagged with both the specific version and "latest"
4. Inside the Docker container:
   - The version is available as an environment variable
   - Frontend apps can access it via `VITE_APP_VERSION`
   - Backend services can access it via `APP_VERSION`
   - The version is displayed in logs during container startup
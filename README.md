# FULLSTACK-PB-TEMPLATE

## Overview

Fullstack is a comprehensive full stack project designed.

## Scripts

### Setup Project

Complete setup of the project (run scripts, install dependencies, build):

```bash
yarn setup
```

### Install Dependencies

Install dependencies for all workspaces:

```bash
yarn install
```

### Build Project

Build all workspaces:

```bash
yarn build
```

### Run Development Environment

Starts the frontend, backend, shared workspace, and PocketBase server concurrently:

```bash
yarn dev
```

### Serve PocketBase

Launches the PocketBase server:

```bash
yarn pb
```

### Migrate Collections

Applies database migrations:

```bash
yarn pb:snapshot
```

### Deploy to Staging

Builds and runs the Docker container for staging:

```bash
yarn staging
```

### Additional Scripts

```bash
yarn test         # Run tests across all workspaces
yarn clean        # Clean all workspaces
yarn lint         # Run linting across all workspaces
yarn format       # Format code across all workspaces
yarn typecheck    # Run type checking across all workspaces
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
├── pb/   # PocketBase backend
├── package.json   # Root configuration
└── README.md
```

## Getting Started

### Prerequisites

- [Yarn](https://yarnpkg.com/) v4.7.0 or higher
- [Node.js](https://nodejs.org/) v14 or higher
- [Docker](https://www.docker.com/) for staging deployment

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/dastron/project.git
    cd project
    ```

2. Complete setup (includes installation and build):

    ```bash
    yarn setup
    ```

   Or install dependencies and build separately:

    ```bash
    yarn install
    yarn build
    ```

### Running the Project

Start the development environment:

```bash
yarn dev
```

This will concurrently run the shared workspace, React frontend, Express backend, and PocketBase server.

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
   - Try

### Docker Images

The following Docker image tags are available:

- `dastro/project:latest` - Latest stable release
- `dastro/project:x.y.z` - Specific version (e.g., 1.0.0)
- `dastro/project:nightly` - Latest nightly build
- `dastro/project:nightly-YYYYMMDD` - Specific nightly build date

### Versioning

This project uses semantic versioning managed by Release Please. When a new release is created:

1. The version number is automatically incremented based on commit types (e.g., feat, fix)
2. The version is passed to the Docker build process as a build argument
3. The Docker image is tagged with both the specific version and "latest"
4. Inside the Docker image:
   - The version is available as an environment variable
   - Frontend apps can access it via `VITE_APP_VERSION`
   - Backend services can access it via `APP_VERSION`
   - The version is displayed in logs during container startup

Nightly builds include the date in the version (e.g., "nightly-20240515") for traceability.
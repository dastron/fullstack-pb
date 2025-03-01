# Fullstack

## Overview

Fullstack is a comprehensive full stack project designed.


## Scripts

### Install Dependencies

Install dependencies for all workspaces:

```bash
yarn install
```

### Run Development Environment

Starts the frontend, backend, and PocketBase server concurrently:

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

## Project Structure

```
fullstack/
├── app/           # Vite React frontend
│   └── package.json
├── functions/     # Node.js/Express backend
│   └── package.json
├── pocket_base/   # PocketBase backend
├── package.json    # Root configuration
└── README.md
```

## Getting Started

### Prerequisites

- [Yarn](https://yarnpkg.com/) v1 or higher
- [Node.js](https://nodejs.org/) v14 or higher
- [Docker](https://www.docker.com/) for staging deployment

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/dastron/fullstack-pb.git
    cd fullstack-pb
    ```

2. Install dependencies:

    ```bash
    yarn install
    ```

### Running the Project

Start the development environment:

```bash
yarn dev
```

This will concurrently run the React frontend, Express backend, and PocketBase server.
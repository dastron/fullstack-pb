#!/bin/bash

# Default PocketBase version if not set in environment
DEFAULT_PB_VERSION="0.27.0"
PB_VERSION=${PB_VERSION:-$DEFAULT_PB_VERSION}
PB_PATH="./pocket_base"

# Load superuser credentials from .env file if it exists
if [ -f ".env" ]; then
    echo "Loading superuser credentials from .env file..."
    # Simple approach to load just the two variables we need
    export $(grep -E "^PB_SUPERUSER_EMAIL=" .env)
    export $(grep -E "^PB_SUPERUSER_PASSWORD=" .env)
fi

# Determine operating system
OS=$(uname -s)
case $OS in
    Linux*)   TARGETOS="linux" ;;
    Darwin*)  TARGETOS="darwin" ;;
    CYGWIN*|MINGW*|MSYS*) TARGETOS="windows" ;;
    *)        echo "Unsupported operating system: $OS"; exit 1 ;;
esac

# Determine architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)  TARGETARCH="amd64" ;;
    arm64|aarch64) TARGETARCH="arm64" ;;
    *)       echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Function to download and extract PocketBase
download_pocketbase() {
    echo "Downloading PocketBase v${PB_VERSION} for ${TARGETOS} (${TARGETARCH})..."
    mkdir -p "${PB_PATH}/tmp"
    
    # Use curl if wget is not available
    if command -v wget >/dev/null 2>&1; then
        wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${TARGETOS}_${TARGETARCH}.zip" -O "${PB_PATH}/tmp/pb.zip"
    else
        curl -sL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${TARGETOS}_${TARGETARCH}.zip" -o "${PB_PATH}/tmp/pb.zip"
    fi
    
    yes | unzip -o "${PB_PATH}/tmp/pb.zip" -d "${PB_PATH}/"
    rm "${PB_PATH}/tmp/pb.zip"
    echo "PocketBase v${PB_VERSION} installed successfully"
}

# Create pocketbase directory if it doesn't exist
if [ ! -d "${PB_PATH}" ]; then
    echo "Creating pocketbase directory..."
    mkdir -p "${PB_PATH}"
    download_pocketbase
else
    # Check current version if pocketbase exists
    if [ -f "${PB_PATH}/pocketbase" ]; then
        CURRENT_VERSION=$("${PB_PATH}/pocketbase" --version 2>&1 | sed 's/^.*version //' | sed 's/^v//')
        if [ "$CURRENT_VERSION" != "$PB_VERSION" ]; then
            echo "Updating PocketBase from v${CURRENT_VERSION} to v${PB_VERSION}..."
            rm -rf "${PB_PATH}/pocketbase"
            download_pocketbase
        else
            echo "PocketBase is already at version ${PB_VERSION}"
        fi
    else
        echo "PocketBase executable not found, downloading..."
        download_pocketbase
    fi
fi

# Copy migrations and data if they exist
if [ -d "./pb/pb_migrations" ]; then
    echo "Copying migrations..."
    mkdir -p "${PB_PATH}/pb_migrations"
    cp -R ./pb/pb_migrations/* "${PB_PATH}/pb_migrations/"
fi

if [ -d "./pb/pb_data" ]; then
    echo "Copying data..."
    mkdir -p "${PB_PATH}/pb_data"
    cp -R ./pb/pb_data/* "${PB_PATH}/pb_data/"
fi

# Check if superuser credentials are provided and valid
if [ -n "$PB_SUPERUSER_EMAIL" ] && [ -n "$PB_SUPERUSER_PASSWORD" ]; then
    echo "Superuser credentials provided. Validating..."
    # Basic email format validation
    if echo "$PB_SUPERUSER_EMAIL" | grep -qE '^[^ ]+@[^ ]+\.[^ ]+$'; then
        # Password length validation
        if [ ${#PB_SUPERUSER_PASSWORD} -ge 10 ]; then
            echo "Credentials valid. Attempting to create superuser..."
            "${PB_PATH}/pocketbase" superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD"
            # Check the exit status of the command
            if [ $? -eq 0 ]; then
                echo "Superuser created successfully or already exists."
            else
                echo "Failed to create superuser. Check PocketBase logs for details."
            fi
        else
            echo "Password validation failed: Password must be at least 10 characters long."
        fi
    else
        echo "Email validation failed: Invalid email format."
    fi
else
    echo "Superuser credentials not provided or incomplete. Skipping superuser creation."
fi

echo "Setup complete!"

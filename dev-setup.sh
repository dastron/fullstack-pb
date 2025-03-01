#!/bin/bash

# Default PocketBase version if not set in environment
DEFAULT_PB_VERSION="0.25.5"
PB_VERSION=${PB_VERSION:-$DEFAULT_PB_VERSION}
PB_PATH="./pocket_base"

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

echo "Setup complete!"

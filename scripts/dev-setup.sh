#!/bin/bash
set -euo pipefail

DEFAULT_PB_VERSION="0.34.2"
PB_VERSION="${PB_VERSION:-$DEFAULT_PB_VERSION}"
PB_PATH="./pocketbase"

# Load superuser credentials from .env file if it exists
if [ -f ".env" ]; then
  echo "Loading superuser credentials from .env file..."
  # shellcheck disable=SC2046
  export $(grep -E "^PB_SUPERUSER_EMAIL=" .env | xargs)
  # shellcheck disable=SC2046
  export $(grep -E "^PB_SUPERUSER_PASSWORD=" .env | xargs)
fi

# Determine operating system
detect_os() {
  case $(uname -s) in
    Linux*)   echo "linux" ;;
    Darwin*)  echo "darwin" ;;
    CYGWIN*|MINGW*|MSYS*) echo "windows" ;;
    *)        echo "Unsupported operating system: $(uname -s)" >&2; exit 1 ;;
  esac
}

# Determine architecture
detect_arch() {
  case $(uname -m) in
    x86_64)   echo "amd64" ;;
    arm64|aarch64) echo "arm64" ;;
    *)        echo "Unsupported architecture: $(uname -m)" >&2; exit 1 ;;
  esac
}

TARGETOS=$(detect_os)
TARGETARCH=$(detect_arch)

# Download and extract PocketBase
download_pocketbase() {
  echo "Downloading PocketBase v${PB_VERSION} for ${TARGETOS} (${TARGETARCH})..."
  mkdir -p "${PB_PATH}/tmp"

  local url="https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${TARGETOS}_${TARGETARCH}.zip"
  local zip_file="${PB_PATH}/tmp/pb.zip"

  if command -v wget >/dev/null 2>&1; then
    wget -q "$url" -O "$zip_file"
  else
    curl -sL "$url" -o "$zip_file"
  fi

  yes | unzip -o "$zip_file" -d "${PB_PATH}/" >/dev/null
  rm "$zip_file"
  echo "PocketBase v${PB_VERSION} installed successfully"
}

# Check and install PocketBase
if [ ! -d "${PB_PATH}" ]; then
  echo "Creating pocketbase directory..."
  mkdir -p "${PB_PATH}"
  download_pocketbase
elif [ -f "${PB_PATH}/pocketbase" ]; then
  CURRENT_VERSION=$("${PB_PATH}/pocketbase" --version 2>&1 | sed 's/^.*version //' | sed 's/^v//')
  if [ "$CURRENT_VERSION" != "$PB_VERSION" ]; then
    echo "Updating PocketBase from v${CURRENT_VERSION} to v${PB_VERSION}..."
    rm -f "${PB_PATH}/pocketbase"
    download_pocketbase
  else
    echo "PocketBase is already at version ${PB_VERSION}"
  fi
else
  echo "PocketBase executable not found, downloading..."
  download_pocketbase
fi

# Ensure required directories exist
mkdir -p "${PB_PATH}/pb_migrations"
mkdir -p "${PB_PATH}/pb_data"
mkdir -p "${PB_PATH}/pb_hooks"

echo "PocketBase directories initialized"

# Initialize PocketBase database
echo "Initializing PocketBase database..."
"${PB_PATH}/pocketbase" migrate up 2>/dev/null || true

# Generate snapshot if none exists
SNAPSHOT_COUNT=$(find "${PB_PATH}/pb_migrations" -name "*_collections_snapshot.js" -o -name "*_snapshot.js" 2>/dev/null | wc -l | tr -d ' ')

if [ "$SNAPSHOT_COUNT" -eq 0 ]; then
  echo "No snapshots found. Generating initial snapshot from PocketBase..."
  echo "y" | "${PB_PATH}/pocketbase" migrate collections >/dev/null

  SNAPSHOT_COUNT=$(find "${PB_PATH}/pb_migrations" -name "*_collections_snapshot.js" -o -name "*_snapshot.js" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
    echo "Snapshot generated successfully (found ${SNAPSHOT_COUNT} snapshot(s))"
  else
    echo "Warning: No snapshot file found after generation"
  fi
else
  echo "Snapshots already exist (found ${SNAPSHOT_COUNT} snapshot(s)). Skipping snapshot generation."
fi

# Create superuser if credentials are provided
create_superuser() {
  local email="${PB_SUPERUSER_EMAIL:-}"
  local password="${PB_SUPERUSER_PASSWORD:-}"

  if [ -z "$email" ] || [ -z "$password" ]; then
    echo "Superuser credentials not provided or incomplete. Skipping superuser creation."
    return
  fi

  echo "Superuser credentials provided. Validating..."

  # Validate email format
  if ! echo "$email" | grep -qE '^[^ ]+@[^ ]+\.[^ ]+$'; then
    echo "Email validation failed: Invalid email format."
    return
  fi

  # Validate password length
  if [ ${#password} -lt 10 ]; then
    echo "Password validation failed: Password must be at least 10 characters long."
    return
  fi

  echo "Credentials valid. Attempting to create superuser..."

  if "${PB_PATH}/pocketbase" superuser upsert "$email" "$password"; then
    echo "Superuser created successfully or already exists."
  else
    echo "Failed to create superuser. Check PocketBase logs for details."
  fi
}

create_superuser

echo "Setup complete!"


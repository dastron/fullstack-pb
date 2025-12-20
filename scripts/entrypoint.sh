#!/bin/sh
set -euo pipefail

# Display version information if available
if [ -n "${VERSION:-}" ]; then
  echo "Starting application version: $VERSION"
fi

# Wait for PocketBase lock files to be released
wait_for_lock_files() {
  local timeout=3
  local interval=1
  local attempt=1
  local max_attempts=$((timeout / interval))

  while [ $attempt -le $max_attempts ]; do
    if [ ! -f "/pocketbase/pb_data/auxiliary.db-shm" ] && \
       [ ! -f "/pocketbase/pb_data/auxiliary.db-wal" ] && \
       [ ! -f "/pocketbase/pb_data/data.db-shm" ] && \
       [ ! -f "/pocketbase/pb_data/data.db-wal" ]; then
      echo "All lock files are gone."
      break
    fi

    echo "Lock files present, waiting $interval seconds (attempt $attempt/$max_attempts)..."
    sleep $interval
    attempt=$((attempt + 1))
  done

  if [ $attempt -gt $max_attempts ]; then
    echo "Timeout reached after $timeout seconds. Lock files still present. Starting server anyway."
  else
    echo "Starting server..."
  fi
}

wait_for_lock_files

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

  if /pocketbase/pocketbase superuser upsert "$email" "$password"; then
    echo "Superuser created successfully or already exists."
  else
    echo "Failed to create superuser. Check PocketBase logs for details."
  fi
}

create_superuser

exec "$@"


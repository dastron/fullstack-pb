#!/bin/sh

# Display version information if available
if [ -n "$VERSION" ]; then
    echo "Starting application version: $VERSION"
fi

check_files() {
    if [ -f "/pb/pb_data/auxiliary.db-shm" ]  || \
        [ -f "/pb/pb_data/auxiliary.db-wal" ] || \
        [ -f "/pb/pb_data/data.db-shm" ] || \
        [ -f "/pb/pb_data/data.db-wal" ]; then
        return 0  # Files exist, keep waiting
    else
        return 1  # Files don't exist, safe to proceed
    fi
}

TIMEOUT=3
INTERVAL=1
MAX_ATTEMPTS=$((TIMEOUT / INTERVAL))

ATTEMPT=1
while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    if ! check_files; then
        echo "All lock files are gone."
        break
    else
        echo "Lock files present, waiting $INTERVAL seconds (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
        sleep $INTERVAL
        ATTEMPT=$((ATTEMPT + 1))
    fi
done

if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
    echo "Timeout reached after $TIMEOUT seconds. Lock files still present. Starting server anyway."
else
    echo "Starting server..."
fi

exec "$@"

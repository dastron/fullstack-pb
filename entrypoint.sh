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

# Check if superuser credentials are provided and valid
if [ -n "$PB_SUPERUSER_EMAIL" ] && [ -n "$PB_SUPERUSER_PASSWORD" ]; then
    echo "Superuser credentials provided. Validating..."
    # Basic email format validation
    if echo "$PB_SUPERUSER_EMAIL" | grep -qE '^[^ ]+@[^ ]+\.[^ ]+$'; then
        # Password length validation
        if [ ${#PB_SUPERUSER_PASSWORD} -ge 10 ]; then
            echo "Credentials valid. Attempting to create superuser..."
            /pb/pocketbase superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD"
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

exec "$@"

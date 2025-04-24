#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status

PB_PATH="./pocket_base"
PB_MIGRATIONS="${PB_PATH}/pb_migrations"
APP_MIGRATIONS="./pb/pb_migrations"

echo "Starting PocketBase migration process..."

# Ensure migration directories exist
mkdir -p "${PB_MIGRATIONS}"
mkdir -p "${APP_MIGRATIONS}"

# Sync migrations between both folders (bidirectional sync)
echo "Syncing migration files..."

# Copy from app migrations to PocketBase migrations
if [ -d "${APP_MIGRATIONS}" ] && [ "$(ls -A ${APP_MIGRATIONS} 2>/dev/null)" ]; then
    echo "Copying app migrations to PocketBase..."
    cp -R "${APP_MIGRATIONS}/"* "${PB_MIGRATIONS}/"
fi

# Copy from PocketBase migrations to app migrations
if [ -d "${PB_MIGRATIONS}" ] && [ "$(ls -A ${PB_MIGRATIONS} 2>/dev/null)" ]; then
    echo "Copying PocketBase migrations to app..."
    cp -R "${PB_MIGRATIONS}/"* "${APP_MIGRATIONS}/"
fi

# Run migrations
echo "Running migrations..."
"${PB_PATH}/pocketbase" migrate up

echo "Migration completed successfully!"
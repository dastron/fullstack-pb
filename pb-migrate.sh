#!/bin/sh
set -e  # Exit immediately if a command exits with a non-zero status

PB_PATH="./pocketbase"
PB_MIGRATIONS="${PB_PATH}/pb_migrations"

echo "Starting PocketBase migration process..."

# Ensure migration directory exists
mkdir -p "${PB_MIGRATIONS}"

# Run migrations
echo "Running migrations..."
"${PB_PATH}/pocketbase" migrate up

echo "Migration completed successfully!"
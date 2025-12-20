#!/bin/bash
set -euo pipefail

OLD_DIR="./pocket_base"
NEW_DIR="./pocketbase"

echo "🔄 PocketBase Data Migration Helper"
echo ""

# Check if old directory exists
if [ ! -d "$OLD_DIR" ]; then
  echo "✅ No old pocket_base directory found - nothing to migrate"
  exit 0
fi

# Check if new directory exists
if [ ! -d "$NEW_DIR" ]; then
  echo "❌ New ./pocketbase directory not found. Please run 'yarn setup' first."
  exit 1
fi

echo "Found old PocketBase directory. This script will help you migrate your data."
echo ""
echo "⚠️  WARNING: This will overwrite any existing data in ./pocketbase/pb_data/"
echo ""
read -p "Do you want to migrate your data? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled."
  exit 0
fi

# Backup existing pb_data if it exists
if [ -d "$NEW_DIR/pb_data" ]; then
  BACKUP_DIR="$NEW_DIR/pb_data_backup_$(date +%Y%m%d_%H%M%S)"
  echo "📦 Backing up existing data to $BACKUP_DIR"
  cp -r "$NEW_DIR/pb_data" "$BACKUP_DIR"
fi

# Copy database files
echo "📋 Copying database files..."

if [ -f "$OLD_DIR/pb_data/data.db" ]; then
  cp "$OLD_DIR/pb_data/data.db" "$NEW_DIR/pb_data/"
  echo "   ✅ data.db copied"
fi

if [ -f "$OLD_DIR/pb_data/auxiliary.db" ]; then
  cp "$OLD_DIR/pb_data/auxiliary.db" "$NEW_DIR/pb_data/"
  echo "   ✅ auxiliary.db copied"
fi

# Copy storage directory
if [ -d "$OLD_DIR/pb_data/storage" ]; then
  echo "📁 Copying storage directory..."
  mkdir -p "$NEW_DIR/pb_data/storage"
  cp -r "$OLD_DIR/pb_data/storage/"* "$NEW_DIR/pb_data/storage/" 2>/dev/null || true
  echo "   ✅ storage copied"
fi

# Copy types
if [ -f "$OLD_DIR/pb_data/types.d.ts" ]; then
  cp "$OLD_DIR/pb_data/types.d.ts" "$NEW_DIR/pb_data/"
  echo "   ✅ types.d.ts copied"
fi

# Copy executable if needed
if [ -f "$OLD_DIR/pocketbase" ] && [ ! -f "$NEW_DIR/pocketbase" ]; then
  echo "📦 Copying PocketBase executable..."
  cp "$OLD_DIR/pocketbase" "$NEW_DIR/"
  echo "   ✅ pocketbase executable copied"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "You can now safely remove the old directory with:"
echo "   rm -rf $OLD_DIR"


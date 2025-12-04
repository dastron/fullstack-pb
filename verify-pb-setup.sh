#!/bin/bash

# Verification script for PocketBase consolidation
echo "🔍 Verifying PocketBase setup..."
echo ""

# Check if old directories exist
OLD_DIRS_FOUND=false

if [ -d "./pocket_base" ]; then
    echo "⚠️  WARNING: Old ./pocket_base directory still exists"
    echo "   You can safely remove it with: rm -rf ./pocket_base"
    echo ""
    OLD_DIRS_FOUND=true
fi

if [ -d "./pb" ]; then
    echo "⚠️  WARNING: Old ./pb directory still exists"
    echo "   You can safely remove it after verifying ./pocketbase is working"
    echo ""
    OLD_DIRS_FOUND=true
fi

if [ "$OLD_DIRS_FOUND" = false ]; then
    echo "✅ No old directories found (./pocket_base, ./pb)"
fi

# Check if new directory exists
if [ -d "./pocketbase" ]; then
    echo "✅ ./pocketbase directory exists"
else
    echo "❌ ./pocketbase directory not found"
    echo "   Run: yarn setup"
    exit 1
fi

# Check for PocketBase executable
if [ -f "./pocketbase/pocketbase" ]; then
    echo "✅ PocketBase executable found"
    VERSION=$(./pocketbase/pocketbase --version 2>&1 | sed 's/^.*version //' | sed 's/^v//')
    echo "   Version: $VERSION"
else
    echo "⚠️  PocketBase executable not found"
    echo "   Run: yarn setup"
fi

# Check for required directories
if [ -d "./pocketbase/pb_migrations" ]; then
    echo "✅ pb_migrations directory exists"
    
    # Count total migrations
    MIGRATION_COUNT=$(ls -1 ./pocketbase/pb_migrations/*.js 2>/dev/null | wc -l | tr -d ' ')
    
    # Count snapshots (files containing "_snapshot" or "_collections_snapshot")
    SNAPSHOT_COUNT=$(ls -1 ./pocketbase/pb_migrations/*_snapshot.js ./pocketbase/pb_migrations/*_collections_snapshot.js 2>/dev/null | wc -l | tr -d ' ')
    
    echo "   Total migrations: $MIGRATION_COUNT"
    echo "   Snapshots: $SNAPSHOT_COUNT"
else
    echo "⚠️  pb_migrations directory not found"
    echo "   Run: yarn setup"
fi

if [ -d "./pocketbase/pb_hooks" ]; then
    echo "✅ pb_hooks directory exists"
else
    echo "⚠️  pb_hooks directory not found"
    echo "   Run: yarn setup"
fi

if [ -d "./pocketbase/pb_data" ]; then
    echo "✅ pb_data directory exists"
else
    echo "ℹ️  pb_data directory will be created on first run"
fi

# Check .gitignore
echo ""
echo "🔍 Checking .gitignore..."
GITIGNORE_OK=true

if grep -q "^\*.db$" .gitignore; then
    echo "✅ Database files excluded from git"
else
    echo "❌ Database files not excluded from git"
    GITIGNORE_OK=false
fi

if grep -q "^pocketbase/pb_data/storage/$" .gitignore; then
    echo "✅ Storage directory excluded from git"
else
    echo "❌ Storage directory not excluded from git"
    GITIGNORE_OK=false
fi

if grep -q "^pb/$" .gitignore || grep -q "^pb/\$" .gitignore; then
    echo "✅ Old pb/ directory excluded from git"
else
    echo "ℹ️  Old pb/ directory not in .gitignore (optional)"
fi

if grep -q "^pocket_base/$" .gitignore || grep -q "^pocket_base/\$" .gitignore; then
    echo "✅ Old pocket_base/ directory excluded from git"
else
    echo "ℹ️  Old pocket_base/ directory not in .gitignore (optional)"
fi

echo ""
if [ "$GITIGNORE_OK" = true ] && [ "$OLD_DIRS_FOUND" = false ]; then
    echo "✨ PocketBase setup verified successfully!"
    echo "   Your PocketBase consolidation is complete and ready to use."
else
    echo "⚠️  Verification complete with warnings"
    echo "   Please review the warnings above and take appropriate action."
fi

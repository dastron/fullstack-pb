#!/bin/bash
set -euo pipefail

PB_PATH="./pocketbase"
PB_MIGRATIONS="${PB_PATH}/pb_migrations"

echo "🚀 Starting PocketBase migration process..."

# Ensure migration directory exists
mkdir -p "${PB_MIGRATIONS}"

# Step 1: Generate migrations from schema
echo ""
echo "📝 Step 1: Checking for schema changes and generating migrations..."

if [ ! -d "shared" ]; then
  echo "❌ Error: shared directory not found"
  exit 1
fi

cd shared
GEN_OUTPUT=$(yarn migrate:generate 2>&1 || true)
echo "$GEN_OUTPUT"

if echo "$GEN_OUTPUT" | grep -qiE "created|generated|migration.*\.js"; then
  echo "✓ New migration(s) generated"
else
  echo "✓ No migrations needed (schema is in sync)"
fi
cd - > /dev/null

# Step 2: Apply migrations to PocketBase
echo ""
echo "🔄 Step 2: Applying migrations to PocketBase..."

if ! "${PB_PATH}/pocketbase" migrate up; then
  echo "❌ Failed to apply migrations"
  exit 1
fi

echo "✓ Migrations applied successfully"

# Step 3: Verify migration success
echo ""
echo "✅ Step 3: Verifying schema synchronization..."

cd shared
STATUS_OUTPUT=$(yarn migrate:status 2>&1 || true)
cd - > /dev/null

SYNC_PATTERNS="schema is in sync|no differences|everything is up to date|no changes|in sync|synchronized"
DIFF_PATTERNS="difference|change|migration|new|modified|deleted"

if echo "$STATUS_OUTPUT" | grep -qiE "$SYNC_PATTERNS"; then
  if ! echo "$STATUS_OUTPUT" | grep -qiE "$DIFF_PATTERNS"; then
    echo "✓ Schema verification passed - database is in sync with schemas"
    echo ""
    echo "🎉 Migration process completed successfully!"
    exit 0
  fi
fi

# Report differences if found
echo "⚠️  Schema verification found differences:"
echo "$STATUS_OUTPUT"
echo ""
echo "This might indicate:"
echo "  1. The migration didn't fully apply"
echo "  2. There are additional schema changes not yet migrated"
echo ""
echo "Run 'yarn migrate:status' for more details"
exit 1


# Test Fixtures

This directory contains test fixtures for the migration test suite.

## Directory Structure

### reference-migrations/

Contains manually created PocketBase migrations copied from `pocketbase/pb_migrations/`. These serve as the expected output for test validation.

**Available Fixtures:**

- `1764625712_created_create_new_collection_with_columns.js` - Collection with all field types
- `1764625735_created_create_new_collection_blank.js` - Minimal collection with only base fields
- `1764625772_created_create_new_collection_with_unique_index.js` - Collection with unique index
- `1764625807_created_create_new_collection_with_unrestricted_api_rules.js` - Collection with empty string permissions
- `1764625943_created_create_new_collection_with_restricted_api_rules.js` - Collection with filter expression permissions
- `1764625982_created_edit_collection_add_field.js` - Initial migration for field addition test
- `1764626004_updated_edit_collection_add_field.js` - Update migration adding a field
- `1764626024_created_edit_collection_add_index.js` - Initial migration for index addition test
- `1764626069_updated_edit_collection_add_index.js` - Update migration adding an index

### schemas/

Contains Zod schema definitions that correspond to the reference migrations. These are used as input to the migration generator during tests.

**Available Schema Fixtures:**

- `create-collection-with-columns.ts` - Schema for collection with all field types (text, editor, number, bool, email, url, date, select, file, relation, json, geoPoint, autodate)
- `create-collection-blank.ts` - Schema for minimal collection with only base fields (id, created, updated)
- `create-collection-with-unique-index.ts` - Schema for collection with unique index on a text field
- `create-collection-with-unrestricted-api-rules.ts` - Schema with empty string permissions (unrestricted access)
- `create-collection-with-restricted-api-rules.ts` - Schema with filter expression permissions (owner-based access)
- `edit-collection-add-field-before.ts` - Schema for collection before adding a field (only base fields)
- `edit-collection-add-field-after.ts` - Schema for collection after adding a text field
- `edit-collection-add-index-before.ts` - Schema for collection before adding an index (only base fields)
- `edit-collection-add-index-after.ts` - Schema for collection after adding a number field and index
- `index.ts` - Exports all schema fixtures for easy import

### snapshots/

Contains snapshot states representing the database schema at various points in time. Used for testing diff detection and update migrations.

**Available Snapshot Fixtures:**

- `edit-collection-add-field-before.json` - Snapshot of collection before adding a field (only base fields)
- `edit-collection-add-index-before.json` - Snapshot of collection before adding an index (only base fields)

## Usage

Tests load fixtures from these directories to:

1. Build schema definitions
2. Run the migration generator
3. Compare generated output against reference migrations
4. Validate that the migration system produces correct PocketBase migrations

## Adding New Fixtures

When adding new test scenarios:

1. Create the migration manually in PocketBase or copy from `pocketbase/pb_migrations/`
2. Copy the migration file to `reference-migrations/`
3. Create corresponding schema definition in `schemas/`
4. Create snapshot files in `snapshots/` if testing update scenarios
5. Document the fixture purpose in this README

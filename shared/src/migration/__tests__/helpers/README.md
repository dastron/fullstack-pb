# Test Helpers

This directory contains helper utilities for the migration test suite.

## Implemented Helpers

### migration-parser.ts

Parses PocketBase migration JavaScript files into structured data for comparison.

**Functions:**

- `parseMigrationFile(filePath: string): ParsedMigration` - Parse complete migration file
- `parseCollectionDefinition(code: string): ParsedCollection` - Extract collection schema from JSON
- `extractOperations(code: string): MigrationOperation[]` - Identify migration operations (addAt, removeById, etc.)

**Implementation Details:**

- Uses `@babel/parser` for AST-based parsing of JavaScript migration files
- Extracts both up and down functions from migrate() calls
- Identifies collection creation, field operations, and rule updates
- Handles Collection and Field constructor calls

### schema-builder.ts

Programmatically builds schema definitions for testing with a fluent API.

**Classes:**

- `SchemaBuilder` - Main builder for creating test schemas with multiple collections
- `CollectionBuilder` - Builder for individual collection schemas with fluent API

**Convenience Methods:**

- `addTextField()` - Add text fields with min/max/pattern options
- `addNumberField()` - Add number fields with min/max/onlyInt options
- `addBoolField()` - Add boolean fields
- `addEmailField()` - Add email fields with domain restrictions
- `addUrlField()` - Add URL fields with domain restrictions
- `addDateField()` - Add date fields with min/max constraints
- `addSelectField()` - Add select fields with values and maxSelect
- `addFileField()` - Add file fields with size/mime/thumbs options
- `addRelationField()` - Add relation fields with cascade options
- `addJsonField()` - Add JSON fields with maxSize
- `addIndex()` - Add index SQL statements
- `setPermissions()` - Set collection permissions/rules

**Example Usage:**

```typescript
const schema = new SchemaBuilder()
  .addCollection("posts", "base")
  .addTextField("title", { required: true, max: 200 })
  .addRelationField("author", "users", { cascadeDelete: true })
  .setPermissions({ listRule: "", createRule: '@request.auth.id != ""' })
  .build()
  .build();
```

### diff-matcher.ts

Compares generated migrations with reference migrations and provides detailed diffs.

**Functions:**

- `compareMigrations(generated, reference): MigrationComparison` - Compare complete migrations
- `compareCollections(generated, reference): Difference[]` - Compare collection definitions
- `compareFields(generated, reference): Difference[]` - Compare field arrays
- `formatDifferences(differences): string` - Format differences for display

**Features:**

- Semantic comparison with whitespace normalization
- Path-based difference tracking (e.g., "upFunction.collections[0].fields[1].type")
- Severity levels: critical, warning, info
- Deep equality checking for nested objects and arrays
- Index SQL normalization for comparison
- Detailed error messages with expected vs actual values

## Usage

These helpers are used by integration tests to:

1. Parse reference migrations into comparable structures
2. Build test schema definitions programmatically
3. Compare generated output against expected output
4. Generate detailed diff reports for test failures

## Testing

Run the helper tests:

```bash
npm test -- helpers.test.ts --run
```

All helpers are fully tested and verified to work correctly.

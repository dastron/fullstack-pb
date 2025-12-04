# Schema-Driven PocketBase Migrations

## Overview

The schema-driven migration system automatically generates PocketBase database migrations from Zod schema definitions. This approach ensures your database structure stays synchronized with your TypeScript types and validation schemas, eliminating manual migration creation and reducing errors.

## Table of Contents

- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Schema Structure](#schema-structure)
- [Type Mapping](#type-mapping)
- [Naming Conventions](#naming-conventions)
- [Migration Workflow](#migration-workflow)
- [Configuration](#configuration)
- [CLI Commands](#cli-commands)
- [Examples](#examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

1. **Define your schema** in `shared/src/schema/`:

```typescript
// shared/src/schema/post.ts
import { z } from "zod";
import { baseSchema } from "./base";

export const PostInputSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  content: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  User: z.string(), // Single relation to Users collection
});

export const PostSchema = PostInputSchema.extend(baseSchema);
```

2. **Generate migration**:

```bash
yarn migrate:generate
```

3. **Apply migration** (PocketBase applies automatically on startup):

```bash
yarn pb
```

## How It Works

The migration system follows a snapshot-based approach similar to Prisma Migrate:

1. **Schema Analysis**: Parses Zod schemas from `shared/src/schema/`
2. **Snapshot Comparison**: Compares current schema with previous snapshot (`.migration-snapshot.json`)
3. **Diff Detection**: Identifies changes (new collections, fields, modifications)
4. **Migration Generation**: Creates PocketBase migration files in `pb/pb_migrations/`
5. **Snapshot Update**: Saves new snapshot for future comparisons

```
┌─────────────────┐
│  Zod Schemas    │
│  (Source of     │
│   Truth)        │
└────────┬────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Schema Analyzer  │────▶│ Current Schema   │
└──────────────────┘     └────────┬─────────┘
                                  │
         ┌────────────────────────┘
         │
         ▼
┌──────────────────┐     ┌──────────────────┐
│ Snapshot Manager │────▶│ Previous Snapshot│
└────────┬─────────┘     └──────────────────┘
         │                         │
         └─────────┬───────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │   Diff Engine    │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Migration        │
         │ Generator        │
         └────────┬─────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Migration File   │
         │ + New Snapshot   │
         └──────────────────┘
```

## Schema Structure

### Base Schema Pattern

All entity schemas should extend from `baseSchema` which provides standard PocketBase fields:

```typescript
// shared/src/schema/base.ts
export const baseSchema = {
  id: z.string(),
  collectionId: z.string(),
  collectionName: z.string(),
  created: z.string(),
  updated: z.string(),
  expand: z.record(z.any()).optional(),
};
```

### Entity Schema Guidelines

**1. Input Schemas** - Define validation for user input:

```typescript
export const EntityInputSchema = z.object({
  name: z.string().min(2, "Name must be longer"),
  email: z.string().email("Invalid email format"),
  status: StatusEnum,
  // ... other fields
});
```

**2. Database Schemas** - Extend input schemas with base fields:

```typescript
export const EntitySchema = EntityInputSchema.extend(baseSchema);
```

**3. Enum Integration** - Use shared enums for consistency:

```typescript
// shared/src/enums.ts
export const StatusEnum = z.enum(["active", "pending", "inactive"]);

// shared/src/schema/entity.ts
import { StatusEnum } from "../enums";

export const EntityInputSchema = z.object({
  status: StatusEnum,
});
```

### File Upload Handling

For collections with file uploads:

```typescript
// Input schema for forms (includes file validation)
export const inputImageFileSchema = {
  image: z
    .instanceof(File)
    .refine((file) => file.size <= 5000000, "Max file size is 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Only .jpg and .png formats are supported"
    ),
};

export const EntityInputSchema = z.object({
  name: z.string(),
  ...inputImageFileSchema,
});

// Database schema (file field stored as string)
export const baseImageFileSchema = {
  image: z.string(),
};

export const EntitySchema = z.object({
  name: z.string(),
  ...baseImageFileSchema,
}).extend(baseSchema);
```

### Index Definitions

Define database indexes using the `withIndexes()` helper to improve query performance:

```typescript
import { withIndexes, withPermissions } from './base';

const EntityDatabaseSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  status: z.enum(['active', 'inactive']),
});

export const EntitySchema = withIndexes(
  withPermissions(
    EntityDatabaseSchema.extend(baseSchema),
    EntityPermissions
  ),
  [
    'CREATE UNIQUE INDEX idx_entities_email ON entities (email)',
    'CREATE INDEX idx_entities_status ON entities (status)',
    'CREATE INDEX idx_entities_name_status ON entities (name, status)'
  ]
);
```

**Index SQL Format:**
- Use PocketBase/SQLite index syntax
- Include `CREATE INDEX` or `CREATE UNIQUE INDEX`
- Specify index name (convention: `idx_<collection>_<field(s)>`)
- Specify table name (should match collection name)
- Specify column(s) to index

**Common Index Patterns:**
```sql
-- Unique constraint (prevents duplicates)
CREATE UNIQUE INDEX idx_users_email ON users (email)

-- Single column index (speeds up queries on that column)
CREATE INDEX idx_posts_status ON posts (status)

-- Composite index (speeds up queries on multiple columns)
CREATE INDEX idx_posts_author_date ON posts (author, created)

-- Partial index (indexes only rows matching condition)
CREATE INDEX idx_posts_active ON posts (status) WHERE status = 'active'
```

**When to Use Indexes:**
- Unique constraints (email, username, etc.)
- Frequently queried fields (status, category, etc.)
- Foreign key fields (relation fields)
- Fields used in sorting or filtering
- Composite indexes for common multi-field queries

**Index Considerations:**
- Indexes improve read performance but slow down writes
- Each index adds storage overhead
- Too many indexes can hurt overall performance
- Test query performance before and after adding indexes

## Type Mapping

The migration system automatically maps Zod types to PocketBase field types:

| Zod Type | PocketBase Field | Notes |
|----------|------------------|-------|
| `z.string()` | `text` | Basic text field |
| `z.string().email()` | `email` | Email validation |
| `z.string().url()` | `url` | URL validation |
| `z.number()` | `number` | Numeric field |
| `z.boolean()` | `bool` | Boolean field |
| `z.date()` | `date` | Date field |
| `z.enum([...])` | `text` | Text with enum validation |
| `z.array(z.string())` | `relation` | Multiple relation (if field name suggests entity) |
| `z.string()` | `relation` | Single relation (if field name matches collection) |
| `z.record(z.any())` | `json` | JSON field |
| `z.instanceof(File)` | `file` | File upload field |

### Validation Constraints

Zod validation rules are mapped to PocketBase field options:

```typescript
// Zod schema
z.string()
  .min(2, "Too short")
  .max(100, "Too long")
  .regex(/^[a-z]+$/, "Lowercase only")

// Becomes PocketBase field
{
  type: "text",
  required: true,
  min: 2,
  max: 100,
  pattern: "^[a-z]+$"
}
```

## Naming Conventions

### Collection Names

- **Schema file name** determines collection name
- **Automatically pluralized**: `user.ts` → `Users` collection
- **Special cases handled**: 
  - `person.ts` → `People`
  - `category.ts` → `Categories`

### Relation Fields

Relation fields are detected by naming convention:

**Single Relations** - Field name matches collection name:
```typescript
{
  User: z.string(),        // → relation to Users collection (maxSelect: 1)
  Author: z.string(),      // → relation to Authors collection (maxSelect: 1)
  Category: z.string(),    // → relation to Categories collection (maxSelect: 1)
}
```

**Multiple Relations** - Field name ends with collection name:
```typescript
{
  SubscriberUsers: z.array(z.string()),  // → relation to Users (maxSelect: 999)
  Tags: z.array(z.string()),             // → relation to Tags (maxSelect: 999)
  Categories: z.array(z.string()),       // → relation to Categories (maxSelect: 999)
}
```

### Auth Collections

Collections are automatically detected as auth collections when they contain:
- `email` field
- `password` field (optional in schema, added automatically)

```typescript
// This becomes an auth collection
export const UserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  // password field added automatically by PocketBase
});
```

## Migration Workflow

### Initial Setup (First Migration)

1. Define your schemas in `shared/src/schema/`
2. Run `yarn migrate:generate`
3. System detects no previous snapshot
4. Generates migration creating all collections
5. Creates initial snapshot file

### Incremental Changes

1. Modify existing schema or add new schema file
2. Run `yarn migrate:generate`
3. System compares with previous snapshot
4. Generates migration with only the changes
5. Updates snapshot file

### Example Workflow

```bash
# 1. Create initial schema
# shared/src/schema/post.ts

# 2. Generate first migration
yarn migrate:generate
# Output: Created 1234567890_create_posts.js

# 3. Start PocketBase (applies migration)
yarn pb

# 4. Modify schema (add field)
# Add: featured: z.boolean()

# 5. Generate incremental migration
yarn migrate:generate
# Output: Created 1234567891_add_featured_to_posts.js

# 6. Restart PocketBase (applies new migration)
yarn pb
```

## Configuration

### Default Configuration

The migration system uses sensible defaults:

```javascript
{
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
    format: 'timestamp_description',
  },
  snapshot: {
    path: '.migration-snapshot.json',
  },
}
```

### Custom Configuration

Create `shared/migrate.config.js` to customize:

```javascript
export default {
  schema: {
    directory: 'src/schema',
    exclude: ['base.ts', 'index.ts', 'helpers.ts'],
  },
  migrations: {
    directory: '../../pb/pb_migrations',
  },
  snapshot: {
    path: '.migration-snapshot.json',
  },
  diff: {
    warnOnDelete: true,
    requireForceForDestructive: true,
  },
};
```

## CLI Commands

### Generate Migration

```bash
yarn migrate:generate [options]
```

Generates a new migration based on schema changes.

**Options:**
- `--output <path>` - Custom output directory for migrations
- `--snapshot <path>` - Custom snapshot file path
- `--force` - Skip confirmation for destructive changes

**Examples:**
```bash
# Basic generation
yarn migrate:generate

# Custom output directory
yarn migrate:generate --output ./custom/migrations

# Force destructive changes
yarn migrate:generate --force
```

### Check Status

```bash
yarn migrate:status
```

Shows current schema state and pending changes without generating migration.

**Output:**
```
Schema Status:
✓ Users collection - up to date
✓ Posts collection - up to date
⚠ Comments collection - 1 field added
⚠ Tags collection - new collection

Pending changes detected. Run 'yarn migrate:generate' to create migration.
```

## Examples

### Example 1: Basic Collection

```typescript
// shared/src/schema/article.ts
import { z } from "zod";
import { baseSchema } from "./base";

export const ArticleInputSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string(),
  published: z.boolean(),
  User: z.string(), // Author relation
});

export const ArticleSchema = ArticleInputSchema.extend(baseSchema);
```

**Generated Migration:**
```javascript
migrate((app) => {
  const collection = new Collection({
    name: "Articles",
    type: "base",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        min: 5,
        max: 200,
      },
      {
        name: "content",
        type: "text",
        required: true,
      },
      {
        name: "published",
        type: "bool",
        required: true,
      },
      {
        name: "User",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
      }
    ],
  });
  
  app.save(collection);
});
```

### Example 2: Auth Collection

```typescript
// shared/src/schema/user.ts
import { z } from "zod";
import { baseSchema } from "./base";

export const UserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  bio: z.string().optional(),
});

export const UserSchema = UserInputSchema.extend(baseSchema);
```

**Generated Migration:**
```javascript
migrate((app) => {
  const collection = new Collection({
    name: "Users",
    type: "auth", // Detected as auth collection
    fields: [
      {
        name: "username",
        type: "text",
        required: true,
        min: 3,
        max: 50,
      },
      {
        name: "bio",
        type: "text",
        required: false,
      }
    ],
  });
  
  app.save(collection);
});
```

### Example 3: Multiple Relations

```typescript
// shared/src/schema/post.ts
import { z } from "zod";
import { baseSchema } from "./base";

export const PostInputSchema = z.object({
  title: z.string(),
  User: z.string(), // Single relation
  Tags: z.array(z.string()), // Multiple relation
  Categories: z.array(z.string()), // Multiple relation
});

export const PostSchema = PostInputSchema.extend(baseSchema);
```

**Generated Migration:**
```javascript
migrate((app) => {
  const collection = new Collection({
    name: "Posts",
    type: "base",
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "User",
        type: "relation",
        required: true,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
      },
      {
        name: "Tags",
        type: "relation",
        required: true,
        maxSelect: 999,
        collectionId: "tags_collection_id",
      },
      {
        name: "Categories",
        type: "relation",
        required: true,
        maxSelect: 999,
        collectionId: "categories_collection_id",
      }
    ],
  });
  
  app.save(collection);
});
```

### Example 4: Adding Field to Existing Collection

**Before:**
```typescript
export const PostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
});
```

**After:**
```typescript
export const PostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  featured: z.boolean(), // New field
});
```

**Generated Migration:**
```javascript
migrate((app) => {
  const collection = app.findCollectionByNameOrId("Posts");
  
  collection.fields.add(new BoolField({
    name: "featured",
    required: true,
  }));
  
  app.save(collection);
}, (app) => {
  // Down migration
  const collection = app.findCollectionByNameOrId("Posts");
  const field = collection.fields.getByName("featured");
  collection.fields.remove(field.id);
  app.save(collection);
});
```

### Example 5: Collection with Indexes

```typescript
// shared/src/schema/user.ts
import { z } from "zod";
import { baseSchema, withIndexes, withPermissions } from "./base";

const UserDatabaseSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  name: z.string().min(2),
  status: z.enum(['active', 'inactive', 'suspended']),
});

export const UserSchema = withIndexes(
  withPermissions(
    UserDatabaseSchema.extend(baseSchema),
    UserPermissions
  ),
  [
    'CREATE UNIQUE INDEX idx_users_email ON users (email)',
    'CREATE UNIQUE INDEX idx_users_username ON users (username)',
    'CREATE INDEX idx_users_status ON users (status)',
    'CREATE INDEX idx_users_name ON users (name)'
  ]
);
```

**Generated Migration:**
```javascript
migrate((app) => {
  const collection = new Collection({
    name: "Users",
    type: "auth",
    fields: [
      {
        name: "username",
        type: "text",
        required: true,
        min: 3,
        max: 50,
      },
      {
        name: "name",
        type: "text",
        required: true,
        min: 2,
      },
      {
        name: "status",
        type: "text",
        required: true,
      }
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_users_email ON users (email)",
      "CREATE UNIQUE INDEX idx_users_username ON users (username)",
      "CREATE INDEX idx_users_status ON users (status)",
      "CREATE INDEX idx_users_name ON users (name)"
    ],
  });
  
  app.save(collection);
});
```

## Best Practices

### 1. Schema Organization

- Keep one entity per schema file
- Use descriptive file names (singular form)
- Group related schemas in subdirectories if needed
- Always extend from `baseSchema` for database schemas

### 2. Migration Safety

- **Always review generated migrations** before applying
- **Test in development first** before production
- **Backup database** before applying destructive changes
- **Use version control** for migration files and snapshots

### 3. Schema Design

- **Start simple** - add complexity incrementally
- **Use enums** for fixed value sets
- **Add validation** at schema level for data integrity
- **Document complex fields** with comments

### 4. Relation Fields

- **Follow naming conventions** for automatic detection
- **Use descriptive names** for clarity
- **Consider cascade delete** for dependent data
- **Plan relation direction** carefully

### 5. Version Control

- **Commit snapshots** - `.migration-snapshot.json` should be in git
- **Commit migrations** - all migration files should be tracked
- **Atomic commits** - schema + migration + snapshot together
- **Descriptive messages** - explain what changed and why

### 6. Team Collaboration

- **Coordinate schema changes** to avoid conflicts
- **Communicate breaking changes** to team
- **Review migrations** in pull requests
- **Document complex migrations** with comments

## Troubleshooting

### Issue: "No changes detected" but schema was modified

**Cause**: Schema file not being parsed or excluded

**Solution**:
1. Check file is in `shared/src/schema/`
2. Ensure file is not in exclude list
3. Verify file exports schema correctly
4. Check for syntax errors in schema file

### Issue: Relation field not detected

**Cause**: Field name doesn't match naming convention

**Solution**:
- Single relation: Field name must match collection name exactly
- Multiple relation: Field name must end with collection name
- Example: `User` (single) or `SubscriberUsers` (multiple)

### Issue: Migration fails to apply

**Cause**: Invalid migration code or database constraint violation

**Solution**:
1. Check PocketBase logs for specific error
2. Verify migration syntax is correct
3. Check for data that violates new constraints
4. Consider data migration before schema change

### Issue: Type mapping incorrect

**Cause**: Unsupported Zod type or complex validation

**Solution**:
1. Check type mapping table for supported types
2. Simplify complex Zod chains
3. Use basic types with PocketBase validation
4. Consider custom field options in migration

### Issue: Snapshot out of sync

**Cause**: Manual database changes or snapshot corruption

**Solution**:
```bash
# Regenerate snapshot from current schemas
rm shared/.migration-snapshot.json
yarn migrate:generate
```

### Issue: Destructive change warning

**Cause**: Field deletion or type change detected

**Solution**:
- Review the change carefully
- Backup data if needed
- Use `--force` flag if intentional
- Consider data migration script

## Advanced Topics

### Custom Field Options

You can add custom PocketBase field options by modifying generated migrations:

```javascript
// After generation, edit migration file
collection.fields.add(new TextField({
  name: "slug",
  required: true,
  pattern: "^[a-z0-9-]+$", // Custom regex
  presentable: true, // Show in listings
}));
```

### Data Migrations

For complex data transformations, create separate migration:

```javascript
// pb/pb_migrations/1234567890_migrate_user_data.js
migrate((app) => {
  const users = app.findCollectionByNameOrId("Users");
  const records = app.findRecordsByFilter(users.id, "");
  
  records.forEach((record) => {
    // Transform data
    record.set("newField", transformOldField(record.get("oldField")));
    app.save(record);
  });
});
```

### Rollback Strategy

Always include down migrations for rollback capability:

```javascript
migrate((app) => {
  // Up migration
  const collection = app.findCollectionByNameOrId("Posts");
  collection.fields.add(new TextField({ name: "slug" }));
  app.save(collection);
}, (app) => {
  // Down migration
  const collection = app.findCollectionByNameOrId("Posts");
  const field = collection.fields.getByName("slug");
  collection.fields.remove(field.id);
  app.save(collection);
});
```

## Additional Resources

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Zod Documentation](https://zod.dev/)
- [Project README](../README.md)
- [Schema Examples](./src/schema/)

## Support

For issues or questions:
1. Check this guide and troubleshooting section
2. Review existing schema examples
3. Check PocketBase documentation
4. Open an issue in the project repository

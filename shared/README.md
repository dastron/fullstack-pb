# Shared Package

This package contains shared [Zod](https://github.com/colinhacks/zod) schemas and utilities for use across the project. These schemas provide runtime validation, TypeScript type inference, and serve as the source of truth for PocketBase database migrations.

## Features

- **Zod Schemas**: Runtime validation and TypeScript types
- **Schema-Driven Migrations**: Automatic PocketBase migration generation
- **Shared Utilities**: Common functions and types across workspaces
- **Type Safety**: Full TypeScript support with type inference

## Documentation

### Migration System
- **[Migration Guide](./MIGRATION_GUIDE.md)** - Complete guide for schema-driven migrations
- **[Type Mapping Reference](./TYPE_MAPPING.md)** - Zod to PocketBase type conversions
- **[Naming Conventions](./NAMING_CONVENTIONS.md)** - Collection and field naming rules
- **[Configuration Reference](./CONFIGURATION.md)** - Configuration options and settings

### Examples
- **[Schema Examples](./src/schema/)** - Example schema definitions

## Usage

### Building the Package

```bash
# Install dependencies
yarn install

# Build the package
yarn build

# Start development mode with file watching
yarn dev
```

> **Note:** The `yarn dev` command uses nodemon to watch for changes in the `src` directory and automatically runs the build process whenever a file changes. This ensures that `.d.ts` type declaration files are always generated with each change.

### Using in Other Projects

#### 1. As a Local Package

Add this package to your project's package.json:

```json
{
  "dependencies": {
    "schema": "workspace:*"
  }
}
```

Make sure your project is using Yarn workspaces for local dependencies.

#### 2. Importing Schemas

```typescript
import { todoSchema, type Todo, createTodoSchema, updateTodoSchema } from 'schema';

// Validate data with the schema
const validatedData = todoSchema.parse({
  title: 'Complete project',
  description: 'Finish the project by Friday',
  completed: false
});

// Use the type
const newTodo: Todo = {
  id: '123',
  title: 'New task',
  completed: false
};

// Use the create schema for form validation
const createData = createTodoSchema.parse({
  title: 'Task name',
  description: 'Task description'
});
```

## Schema-Driven Migrations

This package includes a powerful migration system that automatically generates PocketBase migrations from your Zod schemas.

### Quick Start

```bash
# Generate migration from schema changes
yarn migrate:generate

# Check migration status
yarn migrate:status
```

### How It Works

1. Define Zod schemas in `src/schema/`
2. Run `yarn migrate:generate`
3. System compares with previous snapshot
4. Generates PocketBase migration files
5. PocketBase applies migrations on startup

For complete documentation, see the [Migration Guide](./MIGRATION_GUIDE.md).

## Available Schemas

Current schemas in this package:

- `UserSchema` / `UserInputSchema` - User entity with auth
- `ProjectSchema` / `ProjectInputSchema` - Project entity
- `baseSchema` - Base fields for all entities

## Adding New Schemas

1. Create a new file in `src/schema/` (e.g., `src/schema/article.ts`)
2. Define your schema using Zod:

```typescript
import { z } from "zod";
import { baseSchema } from "./base";

export const ArticleInputSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string(),
  User: z.string(), // Relation to Users collection
});

export const ArticleSchema = ArticleInputSchema.extend(baseSchema);
```

3. Export the schema in `src/schema/index.ts`
4. Generate migration: `yarn migrate:generate`
5. Start PocketBase to apply: `yarn pb`

### Schema Naming Conventions

- **File name** determines collection name (pluralized automatically)
  - `article.ts` → `Articles` collection
  - `user.ts` → `Users` collection
- **Relation fields** detected by naming:
  - `User: z.string()` → single relation to Users
  - `Tags: z.array(z.string())` → multiple relation to Tags
- **Auth collections** detected by `email` field presence

For more details, see the [Migration Guide](./MIGRATION_GUIDE.md) 
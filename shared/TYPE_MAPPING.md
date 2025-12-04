# Type Mapping Reference

This document provides a quick reference for how Zod schema types are mapped to PocketBase field types in the migration system.

## Basic Type Mappings

| Zod Type | PocketBase Field | Example |
|----------|------------------|---------|
| `z.string()` | `text` | `name: z.string()` |
| `z.string().email()` | `email` | `email: z.string().email()` |
| `z.string().url()` | `url` | `website: z.string().url()` |
| `z.number()` | `number` | `age: z.number()` |
| `z.boolean()` | `bool` | `active: z.boolean()` |
| `z.date()` | `date` | `birthdate: z.date()` |
| `z.enum([...])` | `text` | `status: z.enum(["active", "inactive"])` |
| `z.record(z.any())` | `json` | `metadata: z.record(z.any())` |
| `z.instanceof(File)` | `file` | `avatar: z.instanceof(File)` |

## Relation Type Mappings

Relations are detected by field naming conventions:

### Single Relations

Field name matches a collection name (singular or plural):

```typescript
{
  User: z.string(),           // → relation to Users (maxSelect: 1)
  Author: z.string(),         // → relation to Authors (maxSelect: 1)
  Category: z.string(),       // → relation to Categories (maxSelect: 1)
}
```

**Generated PocketBase Field:**
```javascript
{
  name: "User",
  type: "relation",
  required: true,
  maxSelect: 1,
  collectionId: "users_collection_id"
}
```

### Multiple Relations

Field name ends with a collection name:

```typescript
{
  Tags: z.array(z.string()),              // → relation to Tags (maxSelect: 999)
  SubscriberUsers: z.array(z.string()),   // → relation to Users (maxSelect: 999)
  Categories: z.array(z.string()),        // → relation to Categories (maxSelect: 999)
}
```

**Generated PocketBase Field:**
```javascript
{
  name: "Tags",
  type: "relation",
  required: true,
  maxSelect: 999,
  collectionId: "tags_collection_id"
}
```

## Validation Constraint Mappings

Zod validation methods are mapped to PocketBase field options:

### String Constraints

| Zod Validation | PocketBase Option | Example |
|----------------|-------------------|---------|
| `.min(n)` | `min: n` | `z.string().min(2)` → `min: 2` |
| `.max(n)` | `max: n` | `z.string().max(100)` → `max: 100` |
| `.regex(pattern)` | `pattern: "..."` | `z.string().regex(/^[a-z]+$/)` → `pattern: "^[a-z]+$"` |
| `.email()` | `type: "email"` | `z.string().email()` → `type: "email"` |
| `.url()` | `type: "url"` | `z.string().url()` → `type: "url"` |

**Example:**
```typescript
// Zod schema
title: z.string().min(5).max(200)

// PocketBase field
{
  name: "title",
  type: "text",
  required: true,
  min: 5,
  max: 200
}
```

### Number Constraints

| Zod Validation | PocketBase Option | Example |
|----------------|-------------------|---------|
| `.min(n)` | `min: n` | `z.number().min(0)` → `min: 0` |
| `.max(n)` | `max: n` | `z.number().max(100)` → `max: 100` |
| `.int()` | `onlyInt: true` | `z.number().int()` → `onlyInt: true` |

**Example:**
```typescript
// Zod schema
age: z.number().int().min(0).max(150)

// PocketBase field
{
  name: "age",
  type: "number",
  required: true,
  min: 0,
  max: 150,
  onlyInt: true
}
```

### Optional Fields

| Zod Validation | PocketBase Option | Example |
|----------------|-------------------|---------|
| `.optional()` | `required: false` | `z.string().optional()` → `required: false` |
| `.nullable()` | `required: false` | `z.string().nullable()` → `required: false` |

**Example:**
```typescript
// Zod schema
bio: z.string().optional()

// PocketBase field
{
  name: "bio",
  type: "text",
  required: false
}
```

## File Upload Mappings

File uploads require special handling due to form data vs. database storage:

### Input Schema (Form Validation)

```typescript
import { z } from "zod";

export const inputImageFileSchema = {
  avatar: z
    .instanceof(File)
    .refine((file) => file.size <= 5000000, "Max 5MB")
    .refine(
      (file) => ["image/jpeg", "image/png"].includes(file.type),
      "Only JPG/PNG"
    ),
};

export const UserInputSchema = z.object({
  name: z.string(),
  ...inputImageFileSchema,
});
```

### Database Schema (Storage)

```typescript
export const baseImageFileSchema = {
  avatar: z.string(), // Stored as filename string
};

export const UserSchema = z.object({
  name: z.string(),
  ...baseImageFileSchema,
}).extend(baseSchema);
```

### Generated PocketBase Field

```javascript
{
  name: "avatar",
  type: "file",
  required: true,
  maxSelect: 1,
  maxSize: 5242880, // 5MB in bytes
  mimeTypes: ["image/jpeg", "image/png"]
}
```

## Enum Mappings

Zod enums are mapped to PocketBase text fields with validation:

### Zod Enum

```typescript
import { z } from "zod";

export const StatusEnum = z.enum(["draft", "published", "archived"]);

export const PostInputSchema = z.object({
  status: StatusEnum,
});
```

### Generated PocketBase Field

```javascript
{
  name: "status",
  type: "text",
  required: true,
  options: {
    values: ["draft", "published", "archived"]
  }
}
```

## Collection Type Detection

Collections are automatically typed based on their fields:

### Auth Collection

Detected when schema contains `email` field:

```typescript
export const UserInputSchema = z.object({
  email: z.string().email(),
  username: z.string(),
});
```

**Generated Collection:**
```javascript
{
  name: "Users",
  type: "auth", // Automatically detected
  fields: [...]
}
```

### Base Collection

Default type for all other collections:

```typescript
export const PostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
});
```

**Generated Collection:**
```javascript
{
  name: "Posts",
  type: "base",
  fields: [...]
}
```

## Special Cases

### Array Fields (Non-Relation)

Arrays that don't match relation naming conventions:

```typescript
{
  tags: z.array(z.string()), // Not matching any collection name
}
```

**Generated PocketBase Field:**
```javascript
{
  name: "tags",
  type: "json", // Stored as JSON array
  required: true
}
```

### JSON Fields

Complex objects stored as JSON:

```typescript
{
  metadata: z.record(z.any()),
  settings: z.object({
    theme: z.string(),
    notifications: z.boolean(),
  }),
}
```

**Generated PocketBase Field:**
```javascript
{
  name: "metadata",
  type: "json",
  required: true
}
```

### Date Fields

Date handling:

```typescript
{
  publishedAt: z.date(),
  createdAt: z.string(), // ISO string
}
```

**Generated PocketBase Field:**
```javascript
{
  name: "publishedAt",
  type: "date",
  required: true
}
```

## Unsupported Types

The following Zod types are not directly supported and will need manual migration editing:

- `z.union()` - Use discriminated unions or separate fields
- `z.intersection()` - Flatten to single object
- `z.tuple()` - Use array or separate fields
- `z.map()` - Use record or JSON field
- `z.set()` - Use array field
- `z.promise()` - Not applicable to database
- `z.function()` - Not applicable to database

## Best Practices

1. **Keep it simple** - Use basic Zod types that map cleanly
2. **Use enums** - For fixed value sets instead of unions
3. **Follow naming conventions** - For automatic relation detection
4. **Separate input/database schemas** - For file uploads
5. **Add validation messages** - For better user feedback
6. **Document complex mappings** - With comments in schema

## Examples

### Complete Entity Example

```typescript
import { z } from "zod";
import { baseSchema } from "./base";

// Shared enum
export const PostStatusEnum = z.enum(["draft", "published", "archived"]);

// Input schema for forms/API
export const PostInputSchema = z.object({
  title: z.string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  
  content: z.string()
    .min(10, "Content must be at least 10 characters"),
  
  excerpt: z.string()
    .max(500, "Excerpt must be less than 500 characters")
    .optional(),
  
  status: PostStatusEnum,
  
  featured: z.boolean(),
  
  publishedAt: z.date().optional(),
  
  viewCount: z.number().int().min(0),
  
  User: z.string(), // Author (single relation)
  
  Tags: z.array(z.string()), // Multiple relation
  
  metadata: z.record(z.any()).optional(),
});

// Database schema
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
        min: 5,
        max: 200,
      },
      {
        name: "slug",
        type: "text",
        required: true,
        pattern: "^[a-z0-9-]+$",
      },
      {
        name: "content",
        type: "text",
        required: true,
        min: 10,
      },
      {
        name: "excerpt",
        type: "text",
        required: false,
        max: 500,
      },
      {
        name: "status",
        type: "text",
        required: true,
        options: {
          values: ["draft", "published", "archived"]
        }
      },
      {
        name: "featured",
        type: "bool",
        required: true,
      },
      {
        name: "publishedAt",
        type: "date",
        required: false,
      },
      {
        name: "viewCount",
        type: "number",
        required: true,
        min: 0,
        onlyInt: true,
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
        name: "metadata",
        type: "json",
        required: false,
      }
    ],
  });
  
  app.save(collection);
});
```

## See Also

- [Migration Guide](./MIGRATION_GUIDE.md) - Complete migration documentation
- [PocketBase Field Types](https://pocketbase.io/docs/collections/) - Official PocketBase docs
- [Zod Documentation](https://zod.dev/) - Zod validation library

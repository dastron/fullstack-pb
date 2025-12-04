# Naming Conventions Reference

This document outlines the naming conventions used in the schema-driven migration system.

## Collection Names

Collection names are automatically derived from schema file names and pluralized.

### Basic Rules

| Schema File | Collection Name | Notes |
|-------------|-----------------|-------|
| `user.ts` | `Users` | Standard pluralization |
| `post.ts` | `Posts` | Standard pluralization |
| `article.ts` | `Articles` | Standard pluralization |
| `comment.ts` | `Comments` | Standard pluralization |
| `tag.ts` | `Tags` | Standard pluralization |

### Special Pluralization Cases

| Schema File | Collection Name | Rule |
|-------------|-----------------|------|
| `person.ts` | `People` | Irregular plural |
| `category.ts` | `Categories` | -y → -ies |
| `company.ts` | `Companies` | -y → -ies |
| `city.ts` | `Cities` | -y → -ies |
| `country.ts` | `Countries` | -y → -ies |
| `story.ts` | `Stories` | -y → -ies |
| `activity.ts` | `Activities` | -y → -ies |

### Naming Best Practices

✅ **DO:**
- Use singular form for file names: `user.ts`, `post.ts`
- Use lowercase for file names: `article.ts`, not `Article.ts`
- Use descriptive entity names: `blogPost.ts`, `userProfile.ts`
- Keep names simple and clear: `tag.ts`, `comment.ts`

❌ **DON'T:**
- Use plural in file names: ~~`users.ts`~~
- Use special characters: ~~`user-profile.ts`~~
- Use abbreviations: ~~`usr.ts`~~, ~~`pst.ts`~~
- Mix naming styles: ~~`User.ts`~~, ~~`user_profile.ts`~~

## Field Names

### Standard Fields

Use camelCase for regular field names:

```typescript
{
  firstName: z.string(),
  lastName: z.string(),
  emailAddress: z.string().email(),
  phoneNumber: z.string(),
  isActive: z.boolean(),
  createdAt: z.date(),
}
```

### Relation Fields

Relation fields follow special naming conventions for automatic detection.

#### Single Relations (One-to-One, Many-to-One)

Field name should match the target collection name (singular or plural):

```typescript
{
  User: z.string(),           // → Users collection (maxSelect: 1)
  Author: z.string(),         // → Authors collection (maxSelect: 1)
  Category: z.string(),       // → Categories collection (maxSelect: 1)
  Post: z.string(),           // → Posts collection (maxSelect: 1)
}
```

**Pattern:** `CollectionName: z.string()`

**Generated Field:**
```javascript
{
  name: "User",
  type: "relation",
  maxSelect: 1,
  collectionId: "users_collection_id"
}
```

#### Multiple Relations (One-to-Many, Many-to-Many)

Field name should end with the target collection name:

```typescript
{
  Tags: z.array(z.string()),              // → Tags collection (maxSelect: 999)
  Categories: z.array(z.string()),        // → Categories collection (maxSelect: 999)
  SubscriberUsers: z.array(z.string()),   // → Users collection (maxSelect: 999)
  AuthorUsers: z.array(z.string()),       // → Users collection (maxSelect: 999)
}
```

**Pattern:** `[Prefix]CollectionName: z.array(z.string())`

**Generated Field:**
```javascript
{
  name: "Tags",
  type: "relation",
  maxSelect: 999,
  collectionId: "tags_collection_id"
}
```

### Relation Naming Examples

#### Blog Post Example

```typescript
// post.ts
export const PostInputSchema = z.object({
  title: z.string(),
  content: z.string(),
  
  // Single relations
  User: z.string(),           // Post author (Users collection)
  Category: z.string(),       // Post category (Categories collection)
  
  // Multiple relations
  Tags: z.array(z.string()),              // Post tags (Tags collection)
  CoauthorUsers: z.array(z.string()),     // Co-authors (Users collection)
});
```

#### E-commerce Order Example

```typescript
// order.ts
export const OrderInputSchema = z.object({
  orderNumber: z.string(),
  total: z.number(),
  
  // Single relations
  User: z.string(),           // Customer (Users collection)
  ShippingAddress: z.string(), // Address (Addresses collection)
  
  // Multiple relations
  Products: z.array(z.string()),          // Ordered products (Products collection)
  Coupons: z.array(z.string()),           // Applied coupons (Coupons collection)
});
```

#### Social Media Post Example

```typescript
// socialPost.ts
export const SocialPostInputSchema = z.object({
  content: z.string(),
  
  // Single relations
  User: z.string(),           // Post author (Users collection)
  
  // Multiple relations
  LikerUsers: z.array(z.string()),        // Users who liked (Users collection)
  MentionedUsers: z.array(z.string()),    // Mentioned users (Users collection)
  Tags: z.array(z.string()),              // Hashtags (Tags collection)
});
```

### Field Naming Best Practices

✅ **DO:**
- Use camelCase: `firstName`, `emailAddress`
- Use descriptive names: `publishedAt`, `viewCount`
- Use boolean prefixes: `isActive`, `hasAccess`, `canEdit`
- Match collection names for relations: `User`, `Category`
- Add prefix for multiple relations to same collection: `SubscriberUsers`, `AuthorUsers`

❌ **DON'T:**
- Use snake_case: ~~`first_name`~~, ~~`email_address`~~
- Use abbreviations: ~~`usr`~~, ~~`cat`~~, ~~`pub_at`~~
- Use generic names: ~~`data`~~, ~~`info`~~, ~~`value`~~
- Mix naming styles: ~~`first_name`~~, ~~`emailAddress`~~

## File Organization

### Schema Directory Structure

```
shared/src/schema/
├── index.ts              # Export all schemas
├── base.ts               # Base schema definitions
├── user.ts               # User entity
├── post.ts               # Post entity
├── comment.ts            # Comment entity
├── tag.ts                # Tag entity
└── category.ts           # Category entity
```

### File Naming Rules

✅ **DO:**
- Use singular entity names: `user.ts`, `post.ts`
- Use camelCase for multi-word entities: `blogPost.ts`, `userProfile.ts`
- Keep names concise: `tag.ts`, `comment.ts`
- Group related schemas in subdirectories if needed

❌ **DON'T:**
- Use plural: ~~`users.ts`~~, ~~`posts.ts`~~
- Use kebab-case: ~~`blog-post.ts`~~, ~~`user-profile.ts`~~
- Use snake_case: ~~`blog_post.ts`~~, ~~`user_profile.ts`~~
- Use PascalCase: ~~`User.ts`~~, ~~`BlogPost.ts`~~

## Schema Export Names

### Input Schema

For form validation and API input:

```typescript
export const EntityInputSchema = z.object({
  // fields...
});
```

**Pattern:** `[Entity]InputSchema`

**Examples:**
- `UserInputSchema`
- `PostInputSchema`
- `CommentInputSchema`
- `BlogPostInputSchema`

### Database Schema

For database storage (includes base fields):

```typescript
export const EntitySchema = EntityInputSchema.extend(baseSchema);
```

**Pattern:** `[Entity]Schema`

**Examples:**
- `UserSchema`
- `PostSchema`
- `CommentSchema`
- `BlogPostSchema`

### Type Exports

TypeScript types inferred from schemas:

```typescript
export type Entity = z.infer<typeof EntitySchema>;
export type EntityInput = z.infer<typeof EntityInputSchema>;
```

**Pattern:** `[Entity]` and `[Entity]Input`

**Examples:**
- `User`, `UserInput`
- `Post`, `PostInput`
- `Comment`, `CommentInput`

## Enum Names

### Enum Definition

```typescript
export const EntityStatusEnum = z.enum(["active", "inactive", "pending"]);
```

**Pattern:** `[Entity][Property]Enum`

**Examples:**
- `UserStatusEnum`
- `PostStatusEnum`
- `OrderStatusEnum`
- `PaymentMethodEnum`

### Enum Usage

```typescript
import { PostStatusEnum } from "../enums";

export const PostInputSchema = z.object({
  status: PostStatusEnum,
});
```

## Migration File Names

Migration files are automatically generated with timestamps:

**Pattern:** `[timestamp]_[description].js`

**Examples:**
- `1234567890_create_users.js`
- `1234567891_add_featured_to_posts.js`
- `1234567892_create_comments.js`
- `1234567893_add_tags_relation_to_posts.js`

## Complete Example

Here's a complete example showing all naming conventions:

```typescript
// File: shared/src/schema/blogPost.ts

import { z } from "zod";
import { baseSchema } from "./base";
import { PostStatusEnum } from "../enums";

// Input schema for forms/API
export const BlogPostInputSchema = z.object({
  // Standard fields (camelCase)
  title: z.string().min(5).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  content: z.string(),
  excerpt: z.string().optional(),
  
  // Enum field
  status: PostStatusEnum,
  
  // Boolean fields (with prefix)
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  
  // Date fields
  publishedAt: z.date().optional(),
  
  // Single relations (match collection name)
  User: z.string(),           // Author
  Category: z.string(),       // Primary category
  
  // Multiple relations (end with collection name)
  Tags: z.array(z.string()),              // Post tags
  CoauthorUsers: z.array(z.string()),     // Co-authors
  RelatedPosts: z.array(z.string()),      // Related posts
});

// Database schema (extends base)
export const BlogPostSchema = BlogPostInputSchema.extend(baseSchema);

// Type exports
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;
```

**Generated Collection:** `BlogPosts`

**Generated Migration:** `1234567890_create_blog_posts.js`

## Quick Reference

### Collection Names
- File: `entity.ts` → Collection: `Entities`
- Singular file name → Plural collection name
- Special cases: `person.ts` → `People`, `category.ts` → `Categories`

### Field Names
- Standard: `camelCase` (e.g., `firstName`, `emailAddress`)
- Single relation: `CollectionName` (e.g., `User`, `Category`)
- Multiple relation: `[Prefix]CollectionName` (e.g., `Tags`, `SubscriberUsers`)
- Boolean: `is/has/can` prefix (e.g., `isActive`, `hasAccess`)

### Schema Names
- Input: `[Entity]InputSchema` (e.g., `UserInputSchema`)
- Database: `[Entity]Schema` (e.g., `UserSchema`)
- Enum: `[Entity][Property]Enum` (e.g., `UserStatusEnum`)

### File Names
- Schema: `entity.ts` (singular, camelCase)
- Migration: `[timestamp]_[description].js` (auto-generated)

## See Also

- [Migration Guide](./MIGRATION_GUIDE.md) - Complete migration documentation
- [Type Mapping Reference](./TYPE_MAPPING.md) - Type conversion rules
- [Schema Examples](./src/schema/) - Example schema definitions

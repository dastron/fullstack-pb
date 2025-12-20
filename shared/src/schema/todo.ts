import { baseSchemaWithTimestamps, defineCollection, RelationField } from "pocketbase-zod-schema/schema";
import { z } from "zod";

// Define the Zod schema for input validation (form data)
export const TodoInputSchema = z.object({
  // Required fields
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean().default(false),

  // Single relation to users collection (owner)
  User: RelationField({ collection: "Users" }),
});

// Define the database schema (includes system fields)
export const TodoSchema = TodoInputSchema.extend(baseSchemaWithTimestamps);

// Define the collection with permissions
const TodoCollection = defineCollection({
  collectionName: "todos",
  schema: TodoInputSchema,
  permissions: {
    template: "owner-only",
    ownerField: "User",
    customRules: {
      // Allow authenticated users to list their own todos
      listRule: '@request.auth.id != "" && User = @request.auth.id',
      // Allow viewing if user is owner
      viewRule: '@request.auth.id != "" && User = @request.auth.id',
    },
  },
});

export default TodoCollection;

// Export types for use in components
export type TodoInput = z.infer<typeof TodoInputSchema>;
export type Todo = z.infer<typeof TodoSchema>;

import { baseSchema, baseSchemaWithTimestamps, defineCollection } from "pocketbase-zod-schema/schema";
import { z } from "zod";

// Define the Zod schema for user input (includes passwordConfirm for validation)
export const UserInputSchema = z
  .object({
    name: z.string().max(255).optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirm: z.string(),
    avatar: z.instanceof(File).optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords don't match",
    path: ["passwordConfirm"],
  });

// Database schema (excludes passwordConfirm, includes avatar as file field)
// This will be an auth collection since it has email and password
// Matches migration: pocketbase/pb_migrations/1766188795_collections_snapshot.js
export const UserSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    avatar: z.instanceof(File).optional(),
  })
  .extend(baseSchema)
  .extend(baseSchemaWithTimestamps);

// Define the collection with permissions
// Note: Indexes for auth collections (tokenKey, email) are automatically managed by PocketBase
const userCollection = defineCollection({
  schema: UserSchema,
  collectionName: "Users",
  type: "auth",
  permissions: {
    // Users can list their own profile
    listRule: "id = @request.auth.id",
    // Users can view their own profile
    viewRule: "id = @request.auth.id",
    // Anyone can create an account (sign up)
    createRule: "",
    // Users can only update their own profile
    updateRule: "id = @request.auth.id",
    // Users can only delete their own account
    deleteRule: "id = @request.auth.id",
    // manageRule is null in PocketBase default (not set)
  },
  indexes: [
    // PocketBase's default indexes for auth collections
    "CREATE UNIQUE INDEX `idx_tokenKey__pb_users_auth_` ON `users` (`tokenKey`)",
    "CREATE UNIQUE INDEX `idx_email__pb_users_auth_` ON `users` (`email`) WHERE `email` != ''",
  ],
});

export default userCollection;

// Export types
export type UserInput = z.infer<typeof UserInputSchema>;
export type User = z.infer<typeof UserSchema>;

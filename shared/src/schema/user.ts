import { z } from "zod";
import { baseSchema, withIndexes, withPermissions } from "./base";

/** -- User Collections -- */
// Input schema for forms (includes passwordConfirm for validation)
export const UserInputSchema = z.object({
  name: z.string().min(2, "Name must be longer").optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirm: z.string(),
  avatar: z.instanceof(File).optional(),
});

// Database schema (excludes passwordConfirm, includes avatar as file field)
const UserDatabaseSchema = z.object({
  name: z.string().min(2, "Name must be longer").optional(),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  avatar: z.instanceof(File).optional(),
});

// Apply permissions and indexes for auth collection
// Users can view all profiles, but only manage their own
export const UserSchema = withIndexes(
  withPermissions(UserDatabaseSchema.extend(baseSchema), {
    // Users can list other users (for mentions, user search, etc.)
    listRule: "id = @request.auth.id",
    // Users can view their own profile
    viewRule: "id = @request.auth.id",
    // Anyone can create an account (sign up)
    createRule: "",
    // Users can only update their own profile
    updateRule: "id = @request.auth.id",
    // Users can only delete their own account
    deleteRule: "id = @request.auth.id",
    // Users can only manage their own account (change email, password, etc.)
    manageRule: "id = @request.auth.id",
  }),
  [
    // Email should be unique for authentication
    "CREATE UNIQUE INDEX idx_users_email ON users (email)",
    // Index on name for user search and sorting
    "CREATE INDEX idx_users_name ON users (name)",
  ]
);

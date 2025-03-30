import { z } from "zod";
import { baseSchema } from "./base";

/** -- User Collections -- */
export const UserInputSchema = z.object({
  name: z.string().min(2, "Name must be longer"),
  email: z.string().email(),
  username: z.string().min(6, "Username must be longer"),
  password: z.string().min(6, "Password must be at least 8 characters"),
  passwordConfirm: z.string(),
});
export const UserSchema = UserInputSchema.extend(baseSchema);

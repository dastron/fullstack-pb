import { z } from "zod";
import PocketBase from "pocketbase";
import type { RecordService } from "pocketbase";
import {
  ProjectInputSchema,
  ProjectSchema,
  UserInputSchema,
  UserSchema,
} from "./schema";
// Projects
export type ProjectInputType = z.infer<typeof ProjectInputSchema>;
export type ProjectType = z.infer<typeof ProjectSchema>;
export type UserInputType = z.infer<typeof UserInputSchema>;
export type UserType = z.infer<typeof UserSchema>;

// PocketBase
export interface TypedPocketBase extends PocketBase {
  collection(idOrName: "Users"): RecordService<UserType>;
  collection(idOrName: "Projects"): RecordService<ProjectType>;
}

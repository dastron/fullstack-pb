import { z } from "zod";
import { StatusEnum } from "./enums";

export const baseSchema = {
  id: z.string().describe("unique id"),
  collectionId: z.string().describe("collection id"),
  collectionName: z.string().describe("collection name"),
  created: z.string().describe("created timestamp"),
  updated: z.string().describe("updated timestamp"),
  expand: z.record(z.any()).describe("expandable fields"),
};

export const baseImageFileSchema = {
  ...baseSchema,
  thumbnailURL: z.string().optional(),
  imageFiles: z.array(z.string()),
};

export const inputImageFileSchema = {
  imageFiles: z.array(z.instanceof(File)),
};

export const omitImageFilesSchema = {
  imageFiles: true,
} as const;

/** -- Project Collections -- */
export const ProjectInputSchema = z
  .object({
    // Required fields
    title: z.string().min(3, "Missing text from title"),
    content: z.string().min(3, "Missing text from content"),
    status: StatusEnum,
    summary: z.string().optional(),
    //
    User: z.string().nonempty("User ID is missing"),
    SubscriberUsers: z.array(z.string()),
  })
  .extend(inputImageFileSchema);
export const ProjectSchema = ProjectInputSchema.omit(omitImageFilesSchema).extend(baseImageFileSchema);

/** -- User Collections -- */
export const UserInputSchema = z.object({
  name: z.string().min(2, "Name must be longer"),
  email: z.string().email(),
  username: z.string().min(6, "Username must be longer"),
  password: z.string().min(6, "Password must be at least 8 characters"),
  passwordConfirm: z.string(),
});
export const UserSchema = UserInputSchema.extend(baseSchema);
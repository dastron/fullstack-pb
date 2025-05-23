import { z } from "zod";
import { StatusEnum } from "../enums";
import { baseImageFileSchema, inputImageFileSchema, omitImageFilesSchema } from "./base";

export const ProjectInputSchema = z
  .object({
    // Required fields
    title: z.string(),
    content: z.string(),
    status: StatusEnum,
    summary: z.string().optional(),

    User: z.string().nonempty("User ID is missing"),
    SubscriberUsers: z.array(z.string()),
  })
  .extend(inputImageFileSchema);
export const ProjectSchema = ProjectInputSchema.omit(omitImageFilesSchema).extend(baseImageFileSchema);

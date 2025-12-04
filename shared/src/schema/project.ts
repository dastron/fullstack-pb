import { z } from "zod";
import { StatusEnum } from "../enums";
import { baseImageFileSchema, inputImageFileSchema, omitImageFilesSchema, withPermissions } from "./base";

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

// Apply permissions using template with custom overrides
// Uses 'owner-only' template but allows all authenticated users to list projects
// This allows users to see all projects but only manage their own
export const ProjectSchema = withPermissions(
  ProjectInputSchema.omit(omitImageFilesSchema).extend(baseImageFileSchema),
  {
    template: "owner-only",
    ownerField: "User",
    customRules: {
      // Override list rule to allow authenticated users to see all projects
      listRule: '@request.auth.id != ""',
      // Allow viewing if user is owner OR a subscriber
      viewRule: '@request.auth.id != "" && (User = @request.auth.id || SubscriberUsers ?= @request.auth.id)',
    },
  }
);

import { z } from "zod";

export const StatusEnum = z.enum([
  "draft", // Initial proposal stage (RequestDraft, ProjectDraft)
  "active", // Work in progress
  "complete", // Fully completed project
  "fail", // Failed project at any stage
]);
export type StatusEnumType = z.infer<typeof StatusEnum>;

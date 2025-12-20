import { z } from "zod";

export const StatusEnum = z.enum([
  "draft", // Initial draft stage
  "active", // Work in progress
  "complete", // Fully completed
  "fail", // Failed at any stage
]);
export type StatusEnumType = z.infer<typeof StatusEnum>;

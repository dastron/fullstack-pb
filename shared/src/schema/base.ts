import { z } from "zod";

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

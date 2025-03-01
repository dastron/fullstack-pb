import pb from "@/pb";
import { ProjectInputType, ProjectType } from "@/types";
import { moderateObject } from "@/utils/moderation";

async function getProject(projectId: string) {
  const project = await pb.collection("Projects").getOne(projectId);
  if (!project) {
    throw new Error("Project not found");
  }
  return project;
}

export async function createProject(userId: string | undefined, data: ProjectInputType) {
  // Validate that data is an object
  if (!data || typeof data !== "object") {
    throw new Error("Invalid project data provided");
  }

  // Validate that user ID is provided
  if (!userId) {
    throw new Error("User ID not found");
  }

  // Extract only the text-based content by excluding fields such as imageFiles
  const { imageFiles, ...textOnlyData } = data;

  // Check the content of the object using moderation
  const results = await moderateObject(userId, "Projects", textOnlyData);
  if (results.flagged) {
    throw new Error("Content is flagged for moderation");
  }

  const createdProject = await pb.collection("Projects").create(data);

  const files = createdProject.imageFiles;
  if (files?.length) {
    await pb.collection("Projects").update(createdProject.id, {
      thumbnailURL: files[0],
    });
  }

  return createdProject;
}

export async function updateProject(projectId: string, project: Partial<ProjectType>) {
  await getProject(projectId);
  await pb.collection("Projects").update(projectId, project);
}
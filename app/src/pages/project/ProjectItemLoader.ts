import type { ItemLoaderData } from "@/hooks/useItemData";
import type { ProjectType } from "@project/shared/types";

import { ProjectMutator } from "@project/shared/mutator";

import pb from "@/pb";

type URLParams = {
  params: {
    projectId?: string;
  };
};

const projectMutator = new ProjectMutator(pb);

export type ProjectItemLoaderData = ItemLoaderData<ProjectType>;

export const ProjectItemQuery = async ({ params }: URLParams): Promise<ProjectItemLoaderData> => {
  const projectId = params?.projectId ?? "";
  const project = await projectMutator.getById(projectId);

  return {
    item: project,
    mutator: projectMutator,
    itemId: projectId,
    defaultExpand: undefined, // Add expand options here if needed
  };
};

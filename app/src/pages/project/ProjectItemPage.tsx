import type { ProjectType } from "@project/shared/types";

import { Heading, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { useLoaderData } from "react-router-dom";

import ProjectCard from "@/features/project/ProjectCard";
import { useProjectItemSubscription } from "@/pages/project/useProjectItemSubscription";
import pb from "@/pb";

type URLParams = {
  params: {
    projectId?: string;
  };
};

export const ProjectItemQuery = async ({ params }: URLParams) => {
  const project = await pb.collection("Projects").getOne(params?.projectId ?? "", {});
  return project;
};

const ProjectDetailPage = () => {
  const loader = useLoaderData() as ProjectType | undefined;
  const projectId = loader?.id;
  const [project, setProject] = useState<ProjectType | undefined>(loader);

  useProjectItemSubscription(projectId, (event) => {
    console.log(`Project ${event.action}:`, event.record);
    if (event.action !== "delete") setProject(event.record);
  });

  return (
    <Stack>
      <Heading>{project?.title}</Heading>
      {project && <ProjectCard project={project} />}
    </Stack>
  );
};

export default ProjectDetailPage;

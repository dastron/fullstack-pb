import type { ProjectType } from "@project/shared/types";

import { Heading, Stack } from "@chakra-ui/react";
import { useLoaderData } from "react-router-dom";

import ProjectCard from "@/features/project/ProjectCard";
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
  return (
    <Stack>
      <Heading>{loader?.title}</Heading>
      {loader && <ProjectCard project={loader} />}
    </Stack>
  );
};

export default ProjectDetailPage;

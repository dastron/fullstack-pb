import ProjectCard from "@/features/project/ProjectCard";
import pb from "@/pb";
import type { ProjectType } from "@project/types";
import { Heading, Stack } from "@chakra-ui/react";
import { useLoaderData } from "react-router-dom";

type URLParams = {
  params: {
    projectId?: string;
  };
};

export const ProjectItemQuery = async ({ params }: URLParams) => {
  const project = await pb.collection("Projects").getOne(params?.projectId ?? "", {
    expand: "ProjectReviews_via_Project, Observations_via_Project",
  });
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

import type { ProjectItemLoaderData } from "./ProjectItemLoader";

import { Heading, Stack } from "@chakra-ui/react";
import { useLoaderData, useNavigate } from "react-router-dom";

import { ProjectItemQuery } from "./ProjectItemLoader";

import ProjectCard from "@/features/project/ProjectCard";
import { useItemData } from "@/hooks/useItemData";

const ProjectDetailPage = () => {
  const loaderData = useLoaderData() as ProjectItemLoaderData;
  const navigate = useNavigate();

  const { item: project, debug } = useItemData(loaderData, {
    enableSubscription: true,
    onItemUpdated: (item) => {
      console.log(`Project updated:`, item);
    },
    onItemDeleted: () => {
      console.log("Project deleted, navigating to projects list");
      navigate("/projects");
    },
    onSubscriptionError: (error) => {
      console.error("Project subscription error:", error);
    },
  });

  return (
    <Stack>
      <Heading>{project?.title}</Heading>
      {project && <ProjectCard project={project} />}
      {process.env.NODE_ENV === "development" && debug.subscriptionEnabled && (
        <small style={{ color: "gray" }}>Real-time updates enabled</small>
      )}
    </Stack>
  );
};

export default ProjectDetailPage;
export { ProjectItemQuery };

import ProjectForm from "@/features/project/ProjectCreationForm";
import { Stack, Divider } from "@chakra-ui/react";

const ProjectFormPage = () => {
  return (
    <Stack>
      <Divider m={4} w="100%" />
      <ProjectForm />
    </Stack>
  );
};

export default ProjectFormPage;

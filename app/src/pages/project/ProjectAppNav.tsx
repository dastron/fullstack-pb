import { ChevronLeftIcon } from "@chakra-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, HStack, Text } from "@chakra-ui/react";
import { Outlet, Link as RouterLink, useParams } from "react-router-dom";

function ProjectAppNav() {
  const { projectId } = useParams();

  return (
    <>
      <Breadcrumb spacing={4} py={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/project">
            <HStack spacing={1}>
              <ChevronLeftIcon />
              <Text>Projects</Text>
            </HStack>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {projectId && (
          <BreadcrumbItem spacing={2}>
            <BreadcrumbLink as={RouterLink} to={`/project/${projectId}`}>
              Details
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
      <Outlet />
    </>
  );
}

export default ProjectAppNav;

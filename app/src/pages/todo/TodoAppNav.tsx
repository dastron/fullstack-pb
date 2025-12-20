import { ChevronLeftIcon } from "@chakra-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, HStack, Text } from "@chakra-ui/react";
import { Outlet, Link as RouterLink, useParams } from "react-router-dom";

function TodoAppNav() {
  const { todoId } = useParams();

  return (
    <>
      <Breadcrumb spacing={4} py={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/todo">
            <HStack spacing={1}>
              <ChevronLeftIcon />
              <Text>Todos</Text>
            </HStack>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {todoId && (
          <BreadcrumbItem spacing={2}>
            <BreadcrumbLink as={RouterLink} to={`/todo/${todoId}`}>
              Details
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
      </Breadcrumb>
      <Outlet />
    </>
  );
}

export default TodoAppNav;

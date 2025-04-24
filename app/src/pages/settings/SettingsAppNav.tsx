import { ChevronRightIcon } from "@chakra-ui/icons";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, HStack, Text } from "@chakra-ui/react";
import { Outlet, Link as RouterLink } from "react-router-dom";

export default function SettingsAppNav() {
  return (
    <>
      <Breadcrumb spacing="8px" separator={<ChevronRightIcon color="gray.500" />} py={4}>
        <BreadcrumbItem>
          <BreadcrumbLink as={RouterLink} to="/settings">
            <HStack spacing={1}>
              <Text>Settings</Text>
            </HStack>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <Outlet />
    </>
  );
}

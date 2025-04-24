import { HamburgerIcon, SettingsIcon } from "@chakra-ui/icons";
import { Box, HStack, Icon, Menu, MenuButton, MenuItem, MenuList, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

export const NAV_HEIGHT = "3.5rem";

const DesktopAppMenu = () => {
  const { user, Logout } = useAuth();

  return (
    <Box mb={{ base: 2, md: 0 }} w="100%" h="100%" display={{ base: "none", md: "block" }}>
      <HStack justify="space-between" h="100%">
        <HStack spacing={0} h="100%">
          <Link to="/">
            <HStack p={4}>
              <Box borderRadius="md" as="img" src="/logo.svg" h="40px" alt="Logo" />
              <Text>FullstackTemplate</Text>
            </HStack>
          </Link>
          <Menu>
            <Link to="/project">
              <MenuButton height="100%" borderRadius={0} borderColor="gray.200" px={4}>
                Projects
              </MenuButton>
            </Link>
          </Menu>
        </HStack>
        <HStack h="100%">
          <Menu>
            <MenuButton height="100%" borderRadius={0} px={4}>
              <Icon mr={2} as={HamburgerIcon} />
              Menu
            </MenuButton>
            <MenuList>
              <Link to="/settings">
                <MenuItem>
                  <Icon mr={2} as={SettingsIcon} />
                  Settings
                </MenuItem>
              </Link>
              {user == null || user?.email == null || user?.email === "" ? (
                <>
                  <Link to="/login">
                    <MenuItem>Login</MenuItem>
                  </Link>
                  <Link to="/signup">
                    <MenuItem>Sign up</MenuItem>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/profile">
                    <MenuItem>Profile</MenuItem>
                  </Link>
                  <Link to="/" onClick={() => Logout()}>
                    <MenuItem>Logout</MenuItem>
                  </Link>
                </>
              )}
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
    </Box>
  );
};

export default DesktopAppMenu;

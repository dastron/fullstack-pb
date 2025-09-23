import { AddIcon, HamburgerIcon, LockIcon, SettingsIcon, UnlockIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";

import useAuth from "@/hooks/useAuth";

const MobileAppMenu = () => {
  const { user, Logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Flex align="center" justify="space-between" w="100%" h="100%" display={{ base: "flex", md: "none" }} px={4}>
      <Link to="/">
        <HStack>
          <Box borderRadius="md" as="img" src="/logo.jpg" h="40px" alt="Logo" />
          <Text>Template</Text>
        </HStack>
      </Link>

      <HStack spacing={2}>
        <Menu>
          <MenuButton as={IconButton} aria-label="Menu" icon={<HamburgerIcon />} variant="ghost" />
          <MenuList maxH="calc(100vh - 100px)" overflowY="auto">
            <MenuGroup title="Projects">
              <MenuItem onClick={() => navigate("/project")}>
                <Icon as={ViewIcon} mr={2} />
                Projects
              </MenuItem>
            </MenuGroup>
            <MenuGroup title="Account">
              <MenuItem onClick={() => navigate("/settings")}>
                <Icon as={SettingsIcon} mr={2} />
                Settings
              </MenuItem>
              {user == null || user?.email == null || user?.email === "" ? (
                <>
                  <MenuItem onClick={() => navigate("/login")}>
                    <Icon as={LockIcon} mr={2} />
                    Login
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/signup")}>
                    <Icon as={AddIcon} mr={2} />
                    Sign up
                  </MenuItem>
                </>
              ) : (
                <>
                  <MenuItem onClick={() => Logout()}>
                    <Icon as={UnlockIcon} mr={2} />
                    Logout
                  </MenuItem>
                </>
              )}
            </MenuGroup>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default MobileAppMenu;

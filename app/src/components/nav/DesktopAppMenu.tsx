import useAuth from "@/hooks/useAuth";
import { Box, Menu, MenuButton, MenuList, MenuItem, HStack, Text, Icon, Button } from "@chakra-ui/react";
import { HiOutlineUser } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { MoonIcon, SettingsIcon } from "@chakra-ui/icons";
import NavMenuItem from "./NavMenuItem";
import { MdLogout, MdPerson } from "react-icons/md";
import { HiOutlineUserAdd } from "react-icons/hi";
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
              <Text>Template</Text>
            </HStack>
          </Link>
          <Menu>
            <MenuButton
              height="100%"
              borderRadius={0}
              borderRight="1px"
              borderBottom="0"
              borderColor="gray.200"
              _dark={{ borderColor: "gray.700" }}
              px={4}
            >
              Projects
            </MenuButton>
            <MenuList>
              <NavMenuItem to="/project" icon={MoonIcon} text="Explore Projects" />
            </MenuList>
          </Menu>
        </HStack>
        <HStack h="100%">
          <Menu>
            <MenuButton
              as={Button}
              leftIcon={<HiOutlineUser />}
              variant="ghost"
              height="100%"
              size="xl"
              borderRadius={0}
              px={4}
            >
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
                    <MenuItem>
                      <Icon mr={2} as={HiOutlineUser} />
                      Login
                    </MenuItem>
                  </Link>
                  <Link to="/signup">
                    <MenuItem>
                      <Icon mr={2} as={HiOutlineUserAdd} />
                      Sign up
                    </MenuItem>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/profile">
                    <MenuItem>
                      <Icon mr={2} as={MdPerson} />
                      Profile
                    </MenuItem>
                  </Link>
                  <Link to="/" onClick={() => Logout()}>
                    <MenuItem>
                      <Icon mr={2} as={MdLogout} />
                      Logout
                    </MenuItem>
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

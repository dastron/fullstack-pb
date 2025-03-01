import { Flex } from "@chakra-ui/react";
import MobileAppMenu from "./MobileAppMenu";
import DesktopAppMenu from "./DesktopAppMenu";
export const NAV_HEIGHT = "3.5rem";

const NavMenu = () => {
  return (
    <Flex
      as="nav"
      padding="0"
      height={NAV_HEIGHT}
      align="center"
      justify="space-between"
      w="100%"
      direction={{ base: "column", md: "row" }}
      position="fixed"
      top={0}
      left={0}
      right={0}
      bg="white"
      _dark={{ bg: "gray.800" }}
      borderBottom="1px"
      borderColor="gray.200"
      zIndex="sticky"
    >
      <MobileAppMenu />
      <DesktopAppMenu />
    </Flex>
  );
};

export default NavMenu;

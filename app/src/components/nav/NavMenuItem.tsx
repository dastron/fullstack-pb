import { Icon } from "@chakra-ui/icons";
import { MenuItem, HStack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";

interface NavMenuItemProps {
  to: string;
  icon: typeof Icon;
  text: string;
}

const NavMenuItem = ({ to, text }: NavMenuItemProps) => (
  <Link to={to}>
    <MenuItem>
      <HStack>
        <Text>{text}</Text>
      </HStack>
    </MenuItem>
  </Link>
);

export default NavMenuItem;

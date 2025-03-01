import { MenuItem, HStack, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { IconType } from "react-icons";
import { Icon } from "@chakra-ui/icons";

interface NavMenuItemProps {
  to: string;
  icon: IconType | typeof Icon;
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

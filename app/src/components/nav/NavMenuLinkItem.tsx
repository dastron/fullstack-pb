import { MenuItem } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

interface NavMenuLinkItemProps {
  to: string;
  text: string;
}

const NavMenuLinkItem = ({ to, text }: NavMenuLinkItemProps) => (
  <MenuItem as={NavLink} to={to} _activeLink={{ fontWeight: "bold" }}>
    {text}
  </MenuItem>
);

export default NavMenuLinkItem;

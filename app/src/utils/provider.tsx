import { IconButton, ColorModeScript, extendTheme, useColorMode, MenuItem, Box } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import { LuMoon, LuSun } from "react-icons/lu";

const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
  secondary: {
    900: "#4f5761", // Dark - for primary text
    800: "#A0AEC0", // Medium - for placeholder text
    700: "#E2E8F0", // Medium light - for disabled text
    600: "#EDF2F7", // Light - for subtle text
    500: "#F7FAFC", // Very light - for ghost text
  },
};

const semanticTokens = {
  colors: {
    primary: {
      _light: "primary.main",
      _dark: "primary.50",
    },
    secondary: {
      default: "secondary.900",
      _dark: "secondary.800",
    },
  },
};

const config = {
  initialColorMode: "dark",
  useSystemColorMode: true,
};

const theme = extendTheme({ colors, config, semanticTokens });

export function Provider(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
     {props.children}
    </ChakraProvider>
  );
}

export function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <header>
      <IconButton
        aria-label={colorMode === "light" ? "Dark" : "Light"}
        icon={colorMode === "light" ? <LuSun /> : <LuMoon />}
        onClick={toggleColorMode}
      ></IconButton>
    </header>
  );
}

export function MenuItemColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <MenuItem onClick={toggleColorMode}>
      <Box pr={2}>{colorMode === "light" ? <LuSun /> : <LuMoon />} </Box>{" "}
      {colorMode === "light" ? " Change to Dark" : " Change to Light"}
    </MenuItem>
  );
}

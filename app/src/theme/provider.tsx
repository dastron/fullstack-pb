import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import {
  Box,
  ChakraProvider,
  ColorModeScript,
  extendTheme,
  IconButton,
  MenuItem,
  useColorMode,
} from "@chakra-ui/react";

const colors = {
  primary: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
    600: "#3182ce",
    500: "#4299e1",
    400: "#63b3ed",
    300: "#90cdf4",
    200: "#bbe3f8",
    100: "#ebf8ff",
  },
  secondary: {
    900: "#4f5761", // Dark - for primary text
    800: "#A0AEC0", // Medium - for placeholder text
    700: "#E2E8F0", // Medium light - for disabled text
    600: "#EDF2F7", // Light - for subtle text
    500: "#F7FAFC", // Very light - for ghost text
    400: "#F7FAFC",
    300: "#F7FAFC",
    200: "#F7FAFC",
    100: "#F7FAFC",
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
        icon={colorMode === "light" ? <SunIcon /> : <MoonIcon />}
        onClick={toggleColorMode}
      ></IconButton>
    </header>
  );
}

export function MenuItemColorModeToggle() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <MenuItem onClick={toggleColorMode}>
      <Box pr={2}>{colorMode === "light" ? <SunIcon /> : <MoonIcon />} </Box>{" "}
      {colorMode === "light" ? " Change to Dark" : " Change to Light"}
    </MenuItem>
  );
}

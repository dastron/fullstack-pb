import { Stack, Heading, Box } from "@chakra-ui/react";

import { ColorModeToggle } from "@/theme/provider";

const SettingsPage = () => {
  return (
    <Box p={8}>
      <Stack spacing={6} maxW="container.md" mx="auto">
        <Heading size="lg">Settings</Heading>
        <Stack spacing={4} p={6} borderWidth="1px" borderRadius="lg">
          <Heading size="md">Display</Heading>
          <Stack direction="row" align="center" justify="space-between">
            <Box>Dark / Light Mode</Box>
            <ColorModeToggle />
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default SettingsPage;

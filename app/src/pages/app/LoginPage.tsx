import { Grid, GridItem, Card, Heading, Box, Text, Stack, useColorModeValue } from "@chakra-ui/react";

import LoginForm from "@/features/app/LoginForm";

const LoginFormPage = () => {
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const primaryBg = useColorModeValue("brand.50", "brand.900");
  const primaryBorder = useColorModeValue("brand.200", "brand.700");
  const benefitBg = useColorModeValue("white", "gray.600");

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8} maxW="1200px" mx="auto" px={4} py={8}>
      <GridItem>
        <Stack spacing={6}>
          <Box>
            <Heading size="2xl" color="brand.700" mb={4}>
              Welcome Back
            </Heading>
          </Box>

          <Card bg={primaryBg} borderRadius="lg" p={6} border="1px" borderColor={primaryBorder}>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="brand.700" mb={2}>
                  Continue Building
                </Text>
                <Text color={textColor}>
                  Sign in to access your Pocketbase projects and continue where you left off.
                </Text>
              </Box>

              {/* Key Benefits */}
              {[
                "Manage your application data",
                "Update user permissions",
                "Monitor real-time database activity",
                "Deploy new features to production",
              ].map((benefit, index) => (
                <Box key={index} p={3} bg={benefitBg} borderRadius="md">
                  <Text color={textColor}>✓ {benefit}</Text>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>
      </GridItem>

      <GridItem>
        <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
          <Box bg={cardBg} p={6} borderBottom="1px" borderColor="chakra-border-color">
            <Heading size="lg">Sign In</Heading>
            <Text color={textColor} mt={2}>
              Access your Pocketbase dashboard
            </Text>
          </Box>
          <Box p={6}>
            <LoginForm />
          </Box>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default LoginFormPage;

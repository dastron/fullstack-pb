import { Box, Card, Grid, GridItem, Heading, Stack, Text, useColorModeValue } from "@chakra-ui/react";

import SignUpForm from "@/features/app/SignUpForm";

export const SignUpFormPage = () => {
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
              Start Building Today
            </Heading>
          </Box>

          <Card bg={primaryBg} borderRadius="lg" p={6} border="1px" borderColor={primaryBorder}>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="brand.700" mb={2}>
                  Developer-First Experience
                </Text>
                <Text color={textColor}>
                  Everything you need to create powerful web applications with Pocketbase backend and React frontend.
                </Text>
              </Box>

              {/* Key Benefits */}
              {[
                "Authentication & user management built-in",
                "Real-time database with automatic API generation",
                "File storage and easy deployment",
                "Modern React frontend with Chakra UI components",
              ].map((benefit, index) => (
                <Box key={index} p={3} bg={benefitBg} borderRadius="md">
                  <Text color={textColor}>✓ {benefit}</Text>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>
      </GridItem>

      {/* Sign Up Form Column */}
      <GridItem>
        <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
          <Box bg={cardBg} p={6} borderBottom="1px" borderColor="chakra-border-color">
            <Heading size="lg">Create Developer Account</Heading>
            <Text color={textColor} mt={2}>
              Get started with your Pocketbase template
            </Text>
          </Box>
          <Box p={6}>
            <SignUpForm />
          </Box>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default SignUpFormPage;

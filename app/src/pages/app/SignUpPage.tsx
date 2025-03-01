import SignUpForm from "@/features/app/SignUpForm";
import { Grid, GridItem, Card, Stack, Heading, Text, Box, useColorModeValue } from "@chakra-ui/react";

export const SignUpFormPage = () => {
  const cardBg = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const primaryBg = useColorModeValue("primary.50", "primary.900");
  const primaryBorder = useColorModeValue("primary.200", "primary.700");
  const benefitBg = useColorModeValue("white", "gray.600");

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8} maxW="1200px" mx="auto" px={4} py={8}>
      <GridItem>
        <Stack spacing={6}>
          <Box>
            <Heading size="2xl" color="primary.500" mb={4}>
              Join Our Platform
            </Heading>
          </Box>

          <Card bg={primaryBg} borderRadius="lg" p={6} border="1px" borderColor={primaryBorder}>
            <Stack spacing={4}>
              <Box>
                <Text fontSize="xl" fontWeight="bold" color="primary.500" mb={2}>
                  Join Us!
                </Text>
                <Text color={textColor}>
                  Access a powerful platform designed to streamline your resource management and collaboration needs.
                </Text>
              </Box>

              {/* Key Benefits */}
              {["Secure and reliable platform"].map((benefit, index) => (
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
            <Heading size="lg">Create Your Account</Heading>
            <Text color={textColor} mt={2}>
              Get started with your free account today
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

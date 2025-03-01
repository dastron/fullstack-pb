import React from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Stack,
  VStack,
  Icon,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/react";
import { MdPersonAdd, MdLogin } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";

const UnauthorizedPage: React.FC = () => {
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const location = useLocation();

  // Get the current path to use as the redirect URL
  const redirectUrl = encodeURIComponent(location.pathname + location.search);

  return (
    <Container maxW="container.xl" py={16}>
      {/* Sign-in requirement header */}
      <Alert
        status="info"
        variant="solid"
        borderRadius="md"
        mb={8}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        py={4}
      >
        <AlertIcon boxSize="24px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Authentication Required
        </AlertTitle>
        <Text>You must sign in to access this page</Text>
      </Alert>

      <Stack direction={{ base: "column", lg: "row" }} spacing={8} align="flex-start" justify="center">
        {/* Sign Up/Login Card */}
        <Box
          w={{ base: "full", lg: "45%" }}
          bg={cardBg}
          p={8}
          borderRadius="xl"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
        >
          <VStack spacing={6} align="center">
            <Heading size="lg" textAlign="center">
              Join Our Community
            </Heading>
            <Text fontSize="lg" textAlign="center" colorScheme="secondary">
              Sign up or log in to access exclusive content and features.
            </Text>

            <Text fontSize="md" textAlign="center" color="secondary">
              Our platform connects experts, sponsors, and community members to create sustainable solutions for
              real-world problems. Be part of the change you want to see in the world.
            </Text>

            <Stack direction={{ base: "column", md: "row" }} spacing={4} w="full" pt={4}>
              <Button
                as={Link}
                to={`/signup?redirect=${redirectUrl}`}
                colorScheme="blue"
                size="lg"
                w="full"
                leftIcon={<Icon as={MdPersonAdd} />}
              >
                Sign Up
              </Button>
              <Button
                as={Link}
                to={`/login?redirect=${redirectUrl}`}
                colorScheme="green"
                size="lg"
                w="full"
                leftIcon={<Icon as={MdLogin} />}
              >
                Log In
              </Button>
            </Stack>

            <Text fontSize="sm" color="gray.500" textAlign="center" pt={2}>
              If you believe you should have access to this page, please contact support.
            </Text>
          </VStack>
        </Box>

        {/* Information Section */}
        <VStack w={{ base: "full", lg: "55%" }} spacing={6} align="start" pl={{ base: 0, lg: 8 }}>
          <Heading size="xl">Why Sign Up?</Heading>

          <Box w="full">
            <FeatureItem
              title="Track Your Contributions"
              description="Monitor your impact and see how your participation helps sustainable development goals."
            />

            <FeatureItem
              title="Earn Rewards"
              description="Receive tokens for your valuable contributions that can be used for various benefits."
            />
          </Box>
        </VStack>
      </Stack>
    </Container>
  );
};

interface FeatureItemProps {
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ title, description }) => {
  return (
    <Box
      mb={4}
      p={4}
      borderLeft="4px"
      borderColor="blue.500"
      bg={useColorModeValue("blue.50", "blue.900")}
      borderRadius="md"
    >
      <Text fontWeight="bold" fontSize="lg">
        {title}
      </Text>
      <Text colorScheme="secondary">{description}</Text>
    </Box>
  );
};

export default UnauthorizedPage;

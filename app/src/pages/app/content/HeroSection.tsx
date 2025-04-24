import { SettingsIcon, MoonIcon, SunIcon } from "@chakra-ui/icons";
import { Box, Container, Heading, Text, SimpleGrid, VStack, Button, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");
  const headingColor = useColorModeValue("brand.800", "brand.700");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Box bg={bgColor}>
      <Container maxW="container.xl" py={10}>
        {/* Hero Section */}
        <VStack spacing={6} textAlign="center" mb={12}>
          <Heading size="2xl" color={headingColor}>
            Build Powerful Web Applications Faster
          </Heading>
          <Text fontSize="xl" color={textColor} maxW="800px">
            A complete fullstack solution with Pocketbase backend, React frontend, and everything you need to launch
            your next project.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%" maxW="800px">
            <Button
              as={Link}
              to="https://github.com/dastron/fullstack-pb"
              target="_blank"
              colorScheme="primary"
              size="lg"
            >
              View Source Code
            </Button>
            <Button as={Link} to="/project" colorScheme="primary" size="lg">
              Demo Project
            </Button>
            <Button as={Link} to="https://pocketbase.io/docs/" target="_blank" colorScheme="primary" size="lg">
              Pocketbase Docs
            </Button>
          </SimpleGrid>
        </VStack>

        {/* Features Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mt={10}>
          <FeatureCard
            icon={SettingsIcon}
            title="Powerful Backend"
            description="Built on Pocketbase with authentication, real-time database, and file storage out of the box."
          />
          <FeatureCard
            icon={MoonIcon}
            title="User Management"
            description="Complete user authentication and profile management system ready to use."
          />
          <FeatureCard
            icon={SunIcon}
            title="Responsive Design"
            description="Beautiful UI components that work seamlessly across desktop and mobile devices."
          />
        </SimpleGrid>
      </Container>
    </Box>
  );
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  const cardBg = useColorModeValue("white", "gray.700");
  const titleColor = useColorModeValue("brand.800", "brand.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const cardBorder = useColorModeValue("brand.50", "transparent");

  return (
    <VStack
      bg={cardBg}
      p={6}
      borderRadius="lg"
      boxShadow="md"
      spacing={4}
      align="center"
      border="1px"
      borderColor={cardBorder}
    >
      <Box as={icon} w={10} h={10} color="brand.700" />
      <Heading size="md" color={titleColor}>
        {title}
      </Heading>
      <Text textAlign="center" color={textColor}>
        {description}
      </Text>
    </VStack>
  );
};

export default HeroSection;

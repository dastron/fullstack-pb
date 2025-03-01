import React from "react";
import { Box, Container, Heading, Text, SimpleGrid, Icon, VStack, Button, useColorModeValue } from "@chakra-ui/react";
import { FaSolarPanel, FaWifi, FaLeaf } from "react-icons/fa";
import { Link } from "react-router-dom";

const HeroSection: React.FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Box bg={bgColor}>
      <Container maxW="container.xl" py={10}>
        {/* Hero Section */}
        <VStack spacing={6} textAlign="center" mb={12}>
          <Heading size="2xl">Empowering Communities Through Sustainable Development</Heading>
          <Text fontSize="xl" color="secondary" maxW="800px">
            Connect with experts and fund meaningful projects that bring environmental, power, and internet solutions to
            remote communities worldwide.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} width="100%" maxW="800px">
            <Button as={Link} to="/enroll" colorScheme="green" size="lg">
              Get Started
            </Button>
            <Button as={Link} to="/project" colorScheme="green" size="lg">
              Explore Projects
            </Button>
            <Button as={Link} to="/task/dashboard" colorScheme="green" size="lg">
              Earn Token
            </Button>
          </SimpleGrid>
        </VStack>

        {/* Features Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} mt={10}>
          <FeatureCard
            icon={FaLeaf}
            title="Environmental Projects"
            description="Support initiatives that protect and restore local environments in remote communities."
          />
          <FeatureCard
            icon={FaSolarPanel}
            title="Power Solutions"
            description="Fund sustainable energy projects bringing electricity to underserved areas."
          />
          <FeatureCard
            icon={FaWifi}
            title="Internet Access"
            description="Help bridge the digital divide by connecting remote communities to the internet."
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

  return (
    <VStack bg={cardBg} p={6} borderRadius="lg" boxShadow="md" spacing={4} align="center">
      <Icon as={icon} w={10} h={10} color="green.500" />
      <Heading size="md">{title}</Heading>
      <Text textAlign="center" color="secondary">
        {description}
      </Text>
    </VStack>
  );
};

export default HeroSection;

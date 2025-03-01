import LoginForm from "@/features/app/LoginForm";
import { Grid, GridItem, Card, Heading, Box, useColorModeValue } from "@chakra-ui/react";

const LoginFormPage = () => {
  const cardBg = useColorModeValue("white", "gray.700");

  return (
    <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8} maxW="1200px" mx="auto" px={4} py={8}>
      <GridItem>
        <Card boxShadow="lg" borderRadius="lg" border="1px" borderColor="chakra-border-color">
          <Box bg={cardBg} p={6} borderBottom="1px" borderColor="chakra-border-color">
            <Heading size="lg">Welcome Back</Heading>
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

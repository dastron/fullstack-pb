import React from "react";
import { Spinner, Center } from "@chakra-ui/react";

const SpinnerPage: React.FC = () => {
  return (
    <Center height="100vh">
      <Spinner size="xl" />
    </Center>
  );
};

export default SpinnerPage;

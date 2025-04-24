import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  Image,
  SimpleGrid,
  Stack,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

import DateRelativeText from "./DateRelativeText";

import pb from "@/pb";

export const CardPattern = ({ data, columns, prefix }: { data: any[]; columns: string[]; prefix?: string }) => {
  const prefixPath = prefix ? `${prefix}/` : "";
  const { colorMode } = useColorMode();

  const renderFieldContent = (item: any, column: string) => {
    switch (column) {
      case "updated":
      case "created":
      case "expired":
        return <DateRelativeText date={item[column]} />;
      default:
        return (
          <Text noOfLines={1} fontSize="md" overflow="hidden" textOverflow="ellipsis">
            {item[column]}
          </Text>
        );
    }
  };

  return (
    <Box display="flex" justifyContent="center" width="100%">
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} maxWidth="1200px">
        {data.map((item) => (
          <Box key={item.id}>
            <Link to={`${prefixPath}${item.id}`}>
              <Card maxW="sm" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
                <Box position="relative">
                  <Image
                    src={buildThumbnailURL(item.id, item)}
                    alt="Placeholder"
                    width="100%"
                    height="200px"
                    objectFit="cover"
                    borderTopRadius="md"
                  />
                  <Box
                    position="absolute"
                    bottom="0"
                    left="0"
                    right="0"
                    height="50%"
                    background={
                      colorMode === "light"
                        ? "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)"
                        : "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)"
                    }
                  />
                </Box>
                <CardBody pt={2} px={3} pb={2}>
                  <Stack spacing={1}>
                    {columns
                      .filter((column) => column !== "_action")
                      .map((column) => (
                        <Box key={column}>
                          <Text
                            fontSize="2xs"
                            fontWeight="bold"
                            textTransform="uppercase"
                            color="gray.500"
                            mb={0.5}
                            letterSpacing="wider"
                          >
                            {column.replace("_", " ")}
                          </Text>
                          {renderFieldContent(item, column)}
                        </Box>
                      ))}
                  </Stack>
                </CardBody>
                {columns.includes("_action") && (
                  <CardFooter pt={0} px={3} pb={3}>
                    <Link to={`${prefixPath}${item.id}`} style={{ width: "100%" }}>
                      <Button
                        width="100%"
                        colorScheme="blue"
                        size="md"
                        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                        transition="all 0.2s"
                      >
                        View Details →
                      </Button>
                    </Link>
                  </CardFooter>
                )}
              </Card>
            </Link>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

const buildThumbnailURL = (id: string, object?: any) => {
  const imageFileName = object?.thumbnailURL || object?.imageFiles?.[0];
  const thumbnailURL = imageFileName
    ? pb.getFileUrl(object, imageFileName, { thumb: "640x640f" })
    : `https://picsum.photos/seed/${id}/640/640`;
  return thumbnailURL;
};

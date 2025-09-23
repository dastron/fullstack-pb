import { Box, Button, Card, CardBody, CardFooter, Image, Stack, Text, useColorMode } from "@chakra-ui/react";
import { Link } from "react-router-dom";

import DateRelativeText from "../DateRelativeText";

import pb from "@/pb";

interface CardPatternItemProps {
  item: any;
  columns: string[];
  prefixPath: string;
}

export const CardPatternItem = ({ item, columns, prefixPath }: CardPatternItemProps) => {
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
    <Box key={item.id} width="100%">
      <Card maxW="100%" borderWidth="1px" borderColor="gray.200" boxShadow="sm">
        <Link to={`${prefixPath}${item.id}`} style={{ display: "block" }}>
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
        </Link>
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
    </Box>
  );
};

const buildThumbnailURL = (id: string, object?: any) => {
  const imageFileName = object?.thumbnailURL || object?.imageFiles?.[0];
  const thumbnailURL = imageFileName
    ? pb.files.getURL(object, imageFileName, { thumb: "640x640f" })
    : `https://picsum.photos/seed/${id}/640/640`;
  return thumbnailURL;
};

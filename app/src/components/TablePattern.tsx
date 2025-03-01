import { Table, Text, Thead, Tr, Th, Tbody, Td, Button, Box, IconButton, Image } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import DateRelativeText from "./DateRelativeText";
import { LinkIcon } from "@chakra-ui/icons";
import pb from "@/pb";
export const TablePattern = ({
  data,
  columns,
  prefix,
  callToAction,
}: {
  data: any[];
  columns: string[];
  prefix?: string;
  callToAction?: string;
}) => {
  const navigate = useNavigate();
  const prefixPath = prefix ? `${prefix}/` : "";
  const visibleColumns = columns.slice(0, 2);
  return (
    <Table variant="simple" size="sm" sx={{ "td, th": { paddingX: "1" } }}>
      <Thead>
        <Tr>
          {columns.map((column) => (
            <Th
              key={column}
              display={{
                base: column === "_action" || visibleColumns.includes(column) ? "table-cell" : "none",
                md: "table-cell",
              }}
            >
              {column.replace("_", " ")}
            </Th>
          ))}
        </Tr>
      </Thead>
      <Tbody>
        {data.length === 0 ? (
          <Tr>
            <Td colSpan={columns.length} textAlign="center">
              <Text fontSize="sm" fontStyle="italic">
                Nothing to see here...
              </Text>
            </Td>
          </Tr>
        ) : (
          data.map((item) => (
            <Tr key={item.id} onClick={() => navigate(`${prefixPath}${item.id}`)}>
              {columns.map((column) => (
                <Td
                  key={column}
                  maxW={column === "thumbnail" ? "120px" : "300px"}
                  display={{
                    base: column === "_action" || visibleColumns.includes(column) ? "table-cell" : "none",
                    md: "table-cell",
                  }}
                >
                  {(() => {
                    switch (column) {
                      case "thumbnail":
                        return (
                          <Image
                            src={buildThumbnailURL(item.id, item)}
                            alt="Placeholder"
                            h="50px"
                            w="100%"
                            objectFit="cover"
                            maxW="150px"
                            borderRadius="sm"
                          />
                        );
                      case "_action":
                        return (
                          <Link to={`${prefixPath}${item.id}`}>
                            <Box display={{ base: "none", md: "block" }}>
                              <Button size="sm" colorScheme="blue" variant="ghost">
                                {callToAction ?? "View Details"} →
                              </Button>
                            </Box>
                            <Box display={{ base: "block", md: "none" }}>
                              <IconButton
                                aria-label="View details"
                                icon={<LinkIcon />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                              />
                            </Box>
                          </Link>
                        );
                      case "updated":
                      case "created":
                      case "expired":
                        return <DateRelativeText date={item[column]} />;
                      default:
                        return (
                          <Text noOfLines={1} overflow="hidden" textOverflow="ellipsis">
                            {item[column]}
                          </Text>
                        );
                    }
                  })()}
                </Td>
              ))}
            </Tr>
          ))
        )}
      </Tbody>
    </Table>
  );
};

const buildThumbnailURL = (id: string, entity?: any) => {
  const imageFileName = entity?.thumbnailURL || entity?.imageFiles?.[0];
  const thumbnailURL = imageFileName
    ? pb.getFileUrl(entity, imageFileName, { thumb: "640x640f" })
    : `https://picsum.photos/seed/${id}/640/640`;
  return thumbnailURL;
};

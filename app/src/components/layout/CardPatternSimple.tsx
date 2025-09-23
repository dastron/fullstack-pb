import { Box, SimpleGrid } from "@chakra-ui/react";

import { CardPatternItem } from "./CardPatternItem";

export const CardPatternSimple = ({ data, columns, prefix }: { data: any[]; columns: string[]; prefix?: string }) => {
  const prefixPath = prefix ? `${prefix}/` : "";

  return (
    <Box display="flex" justifyContent="center" width="100%">
      <SimpleGrid
        columns={{ base: 1, md: 2, lg: 3 }}
        spacing={6}
        maxWidth="1200px"
        width="100%"
        gridAutoFlow="row dense"
      >
        {data.map((item) => (
          <CardPatternItem key={item.id} item={item} columns={columns} prefixPath={prefixPath} />
        ))}
      </SimpleGrid>
    </Box>
  );
};

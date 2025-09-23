import type { ProjectListLoaderData } from "./ProjectListLoader";

import { Button, Flex, Heading, Spacer, Stack } from "@chakra-ui/react";
import { Link, useLoaderData, useParams } from "react-router-dom";

import { CardPatternInfinite } from "@/components/layout/CardPatternInfinite";
import SearchQueryHeader from "@/components/search/SearchQueryHeader";
import { useListData } from "@/hooks/useListData";

const ProjectListPage = () => {
  const loaderData = useLoaderData() as ProjectListLoaderData;
  const { requestId } = useParams();
  const title = requestId ? "Request Projects" : "Projects";

  // Use the enhanced list data hook with infinite scroll
  const {
    items: projects,
    isLoadingMore,
    infiniteScroll,
    loadMore,
    debug,
  } = useListData(loaderData, {
    enableInfiniteScroll: true, // Enable infinite scroll
    enableSubscription: false, // Enable real-time updates
    autoRefresh: false, // Don't auto-refresh on mount
    infiniteScrollOptions: {
      threshold: 100,
      onLoadMore: (page, totalLoaded) => {
        console.debug(
          `onLoadMore called: page ${page}, total items: ${totalLoaded}, hasMore: ${infiniteScroll?.hasMore}, isLoading: ${isLoadingMore}`
        );
      },
    },
    onItemAdded: (item) => {
      console.debug("Project added via subscription:", item.id);
    },
    onItemUpdated: (item) => {
      console.debug("Project updated via subscription:", item.id);
    },
    onItemRemoved: (itemId) => {
      console.debug("Project removed via subscription:", itemId);
    },
    onSubscriptionError: (error) => {
      console.error("Project subscription error:", error);
    },
  });

  return (
    <Stack spacing={4}>
      <Flex align="center">
        <Heading>{title}</Heading>
        <Spacer />
        <Button as={Link} to="./new" colorScheme="blue">
          Create New Project
        </Button>
      </Flex>
      <SearchQueryHeader />

      {/* Use CardPatternInfinite with infinite scroll support */}
      <CardPatternInfinite
        data={projects}
        columns={["title", "status", "created", "_action"]}
        prefix="/project"
        isLoading={isLoadingMore}
        hasMore={infiniteScroll?.hasMore ?? false}
        onLoadMore={infiniteScroll ? loadMore : undefined}
        enableInfiniteScroll={!!infiniteScroll}
        // onRetry={refresh}
        showDebug={process.env.NODE_ENV === "development"}
        debugInfo={debug}
      />
    </Stack>
  );
};

export default ProjectListPage;

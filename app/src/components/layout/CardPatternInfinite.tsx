import type { RecordModel } from "pocketbase";

import { Alert, AlertIcon, Box, Button, Flex, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";

import { CardPatternItem } from "./CardPatternItem";

/**
 * Props for the CardPatternInfinite component
 */
export interface CardPatternInfiniteProps<T extends RecordModel> {
  /**
   * The items to display
   */
  data: T[];

  /**
   * Column names to display for each card
   */
  columns: string[];

  /**
   * Optional prefix for navigation paths
   * Default: ""
   */
  prefix?: string;

  /**
   * Grid configuration for responsive layout
   * Default: { base: 1, md: 2, lg: 3 }
   */
  gridColumns?: { base: number; md: number; lg: number };

  /**
   * Maximum width for the grid container
   * Default: "1200px"
   */
  maxWidth?: string;

  /**
   * Spacing between grid items
   * Default: 6
   */
  spacing?: number;

  /**
   * Whether there are more items to load
   */
  hasMore?: boolean;

  /**
   * Whether currently loading more items
   */
  isLoading?: boolean;

  /**
   * Function to load more items
   */
  onLoadMore?: () => void;

  /**
   * Text to show when more items can be loaded
   * Default: "Scroll down to load more"
   */
  loadMoreText?: string;

  /**
   * Text to show when loading
   * Default: "Loading more items..."
   */
  loadingText?: string;

  /**
   * Whether infinite scroll is enabled
   * Default: true
   */
  enableInfiniteScroll?: boolean;

  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;

  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode;

  /**
   * Custom error component
   */
  errorComponent?: React.ReactNode;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Function to retry after error
   */
  onRetry?: () => void;

  /**
   * Whether to show debug information in development
   * Default: false
   */
  showDebug?: boolean;

  /**
   * Debug information to display
   */
  debugInfo?: Record<string, any>;
}

/**
 * An advanced card pattern component with infinite scroll support
 *
 * This component provides:
 * - Responsive grid layout
 * - Loading states and error handling
 * - Empty state display
 * - Infinite scroll trigger element
 *
 * @example
 * ```tsx
 * function ProjectListPage() {
 *   const loaderData = useLoaderData() as ProjectListLoaderData;
 *   const { items, isLoading, hasMore, loadMore } = useListInfiniteScroll(
 *     projectMutator,
 *     { perPage: 20, sort: '-created' }
 *   );
 *
 *   return (
 *     <CardPatternInfinite
 *       data={items}
 *       columns={["title", "status", "created", "_action"]}
 *       prefix="/project"
 *       isLoading={isLoading}
 *       hasMore={hasMore}
 *       onLoadMore={loadMore}
 *     />
 *   );
 * }
 * ```
 */
export function CardPatternInfinite<T extends RecordModel>({
  data,
  columns,
  prefix = "",
  gridColumns = { base: 1, md: 2, lg: 3 },
  maxWidth = "1200px",
  spacing = 6,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  loadMoreText = "Scroll down to load more",
  loadingText = "Loading more items...",
  enableInfiniteScroll = true,
  loadingComponent,
  emptyComponent,
  errorComponent,
  error = null,
  onRetry,
  showDebug = false,
  debugInfo,
}: CardPatternInfiniteProps<T>) {
  const prefixPath = prefix ? `${prefix}/` : "";
  
  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection observer for automatic infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll || !hasMore || isLoading || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "100px", // Start loading 100px before the element comes into view
        threshold: 0.1,
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [enableInfiniteScroll, hasMore, isLoading, onLoadMore]);

  // Error state
  if (error && errorComponent) {
    return <Box>{errorComponent}</Box>;
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Box>
          <Text fontWeight="bold">Failed to load data</Text>
          <Text fontSize="sm" color="gray.600">
            {error.message}
          </Text>
          <Button size="sm" mt={2} onClick={onRetry}>
            Try Again
          </Button>
        </Box>
      </Alert>
    );
  }

  // Empty state
  if (data.length === 0 && !isLoading) {
    if (emptyComponent) {
      return <Box>{emptyComponent}</Box>;
    }

    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={12} textAlign="center">
        <Text fontSize="lg" fontWeight="medium" color="gray.500" mb={2}>
          No items found
        </Text>
        <Text fontSize="sm" color="gray.400" mb={4}>
          There are no items to display at the moment.
        </Text>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Refresh
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Main grid */}
      <Box display="flex" justifyContent="center" width="100%">
        <SimpleGrid columns={gridColumns} spacing={spacing} maxWidth={maxWidth} width="100%" gridAutoFlow="row dense">
          {data.map((item) => (
            <CardPatternItem key={item.id} item={item} columns={columns} prefixPath={prefixPath} />
          ))}
        </SimpleGrid>
      </Box>

      {/* Loading trigger and indicator - only show if we actually have more items */}
      {hasMore && data.length > 0 && (
        <Box
          ref={loadMoreRef}
          display="flex"
          justifyContent="center"
          alignItems="center"
          py={8}
          minHeight="80px"
        >
          {isLoading ? (
            loadingComponent || (
              <Flex align="center" gap={3}>
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm" color="gray.600">
                  {loadingText}
                </Text>
              </Flex>
            )
          ) : (
            <Text fontSize="sm" color="gray.400">
              {loadMoreText}
            </Text>
          )}
        </Box>
      )}

      {/* End of list indicator */}
      {!hasMore && data.length > 0 && (
        <Box display="flex" justifyContent="center" py={6} borderTop="1px solid" borderColor="gray.200" mt={8}>
          <Text fontSize="sm" color="gray.500">
            You've reached the end of the list
          </Text>
        </Box>
      )}

      {/* Debug information */}
      {showDebug && process.env.NODE_ENV === "development" && debugInfo && (
        <Box mt={6} p={4} bg="gray.50" borderRadius="md" fontSize="xs">
          <Text fontWeight="bold" mb={2}>
            Debug Information:
          </Text>
          <pre style={{ whiteSpace: "pre-wrap", color: "#666" }}>
            {JSON.stringify(
              {
                ...debugInfo,
                itemsLoaded: data.length,
                hasMore,
                isLoading,
                hasError: !!error,
              },
              null,
              2
            )}
          </pre>
        </Box>
      )}
    </Box>
  );
}

/**
 * Simplified version for basic infinite scroll use cases
 */
export interface SimpleCardPatternInfiniteProps<T extends RecordModel> {
  data: T[];
  columns: string[];
  prefix?: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  enableInfiniteScroll?: boolean;
}

export function SimpleCardPatternInfinite<T extends RecordModel>({
  data,
  columns,
  prefix,
  isLoading,
  hasMore,
  onLoadMore,
  enableInfiniteScroll = true,
}: SimpleCardPatternInfiniteProps<T>) {
  return (
    <CardPatternInfinite
      data={data}
      columns={columns}
      prefix={prefix}
      isLoading={isLoading}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      enableInfiniteScroll={enableInfiniteScroll}
    />
  );
}

export default CardPatternInfinite;

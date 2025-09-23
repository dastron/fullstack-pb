import type { BaseMutator } from "@project/shared/mutator";
import type { RecordModel } from "pocketbase";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Options for configuring infinite scroll behavior
 */
export interface InfiniteScrollOptions {
  /**
   * Distance from bottom of container to trigger loading (in pixels)
   * Default: 100
   */
  threshold?: number;

  /**
   * Whether infinite scroll is enabled
   * Default: true
   */
  enabled?: boolean;

  /**
   * Custom root element for intersection observer
   * If not provided, uses the viewport
   */
  root?: Element | null;

  /**
   * Root margin for intersection observer
   * Default: "0px"
   */
  rootMargin?: string;

  /**
   * Callback when more items are loaded
   */
  onLoadMore?: (page: number, totalLoaded: number) => void;

  /**
   * Callback when scroll reaches the end (no more items)
   */
  onReachEnd?: () => void;

  /**
   * Custom loading state callback
   */
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Parameters for infinite scroll list operations
 */
export interface InfiniteScrollParams {
  perPage?: number;
  filter?: string;
  sort?: string;
  expand?: string | string[];
}

/**
 * Return type for the useListInfiniteScroll hook
 */
export interface UseListInfiniteScrollReturn<T extends RecordModel> {
  /**
   * Combined items from all loaded pages
   */
  items: T[];

  /**
   * Whether currently loading more items
   */
  isLoading: boolean;

  /**
   * Whether there are more items to load
   */
  hasMore: boolean;

  /**
   * Current page being displayed
   */
  currentPage: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Total number of pages available
   */
  totalPages: number;

  /**
   * Manually load the next page
   */
  loadMore: () => Promise<void>;

  /**
   * Reset the infinite scroll state and reload from page 1
   */
  reset: () => Promise<void>;

  /**
   * Refresh the current data (reload all pages)
   */
  refresh: () => Promise<void>;

  // Note: loadMoreRef is now handled by CardPatternInfinite component

  /**
   * Add an item to the beginning of the list (optimistic update)
   */
  addItem: (item: T) => void;

  /**
   * Update an item in the list (optimistic update)
   */
  updateItem: (itemId: string, updates: Partial<T>) => void;

  /**
   * Remove an item from the list (optimistic update)
   */
  removeItem: (itemId: string) => void;

  /**
   * The mutator instance for additional operations
   */
  mutator: BaseMutator<T, any> | null;

  /**
   * Debug information
   */
  debug: {
    pagesLoaded: number;
    itemsPerPage: number;
    lastLoadTime: number | null;
    isInitialized: boolean;
  };
}

/**
 * A comprehensive hook for infinite scrolling with PocketBase collections
 *
 * This hook provides:
 * - Automatic infinite scrolling with intersection observer
 * - Manual load more functionality
 * - Optimistic updates
 * - Integration with BaseMutator
 * - Proper cleanup and error handling
 *
 * @example
 * ```tsx
 * function InfiniteProjectList() {
 *   const projectMutator = new ProjectMutator(pb);
 *
 *   const {
 *     items: projects,
 *     isLoading,
 *     hasMore,
 *     loadMoreRef,
 *     addItem,
 *     updateItem,
 *     removeItem
 *   } = useListInfiniteScroll(projectMutator, {
 *     perPage: 20,
 *     sort: '-created',
 *     filter: 'status="active"'
 *   }, {
 *     threshold: 200,
 *     onLoadMore: (page, total) => console.log(`Loaded page ${page}, total: ${total}`)
 *   });
 *
 *   return (
 *     <div>
 *       {projects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       {hasMore && (
 *         <div ref={loadMoreRef} className="loading-trigger">
 *           {isLoading ? 'Loading...' : 'Load more'}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useListInfiniteScroll<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null,
  params: InfiniteScrollParams = {},
  options: InfiniteScrollOptions = {}
): UseListInfiniteScrollReturn<T> {
  const { onLoadMore, onReachEnd, onLoadingChange } = options;

  const { perPage = 20, filter, sort, expand } = params;

  // State management
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);

  // Refs
  const isLoadingRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Update loading state and notify callback
  const updateLoadingState = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
      isLoadingRef.current = loading;
      onLoadingChange?.(loading);
    },
    [onLoadingChange]
  );

  // Check if an error is an auto-cancellation error
  const isAutoCancellationError = useCallback((error: any): boolean => {
    return (
      error instanceof Error &&
      (error.message.includes("autocancelled") ||
        error.message.includes("The request was autocancelled") ||
        (error.name === "AbortError" && error.message.includes("signal is aborted")))
    );
  }, []);

  // Load a specific page and append to items
  const loadPage = useCallback(
    async (page: number, append: boolean = true) => {
      if (isLoadingRef.current || !mutator || !mutator.getList) return null;

      updateLoadingState(true);

      try {
        const result = await mutator.getList(page, perPage, filter, sort, expand);

        setLastLoadTime(Date.now());

        if (append) {
          setItems((prevItems) => {
            return [...prevItems, ...result.items];
          });
        } else {
          setItems(result.items);
        }

        setCurrentPage(result.page);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setHasMore(result.page < result.totalPages);

        console.debug(
          `loadPage result: page=${result.page}, totalPages=${result.totalPages}, hasMore=${result.page < result.totalPages}, totalItems=${result.totalItems}`
        );

        // Call onReachEnd if we've reached the end
        if (result.page >= result.totalPages) {
          onReachEnd?.();
        }

        return result;
      } catch (error) {
        if (isAutoCancellationError(error)) {
          console.debug("Page load request was auto-cancelled, ignoring error:", error);
          return null;
        }
        console.error("Error loading page:", error);
        return null;
      } finally {
        updateLoadingState(false);
      }
    },
    [mutator, perPage, filter, sort, expand, onReachEnd, updateLoadingState, isAutoCancellationError]
  );

  // Load the next page with resilience to cancellations
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current || !mutator || !mutator.getList) {
      console.debug(`loadMore blocked: hasMore=${hasMore}, isLoading=${isLoadingRef.current}, mutator=${!!mutator}`);
      return;
    }

    console.debug(`loadMore executing: currentPage=${currentPage}, hasMore=${hasMore}`);

    try {
      const result = await loadPage(currentPage + 1, true);

      // Only call onLoadMore callback when user explicitly loads more
      if (result) {
        const totalLoaded = items.length + result.items.length;
        onLoadMore?.(result.page, totalLoaded);
        console.debug(`User-initiated loadMore completed: page=${result.page}, totalLoaded=${totalLoaded}`);
      } else {
        console.debug("Load more returned null - likely due to cancellation or error");
      }
    } catch (error) {
      if (!isAutoCancellationError(error)) {
        console.error("Error in loadMore:", error);
      }
    }
  }, [hasMore, currentPage, loadPage, mutator, isAutoCancellationError, onLoadMore, items.length]);

  // loadMore function is used directly by CardPatternInfinite component

  // Reset to page 1
  const reset = useCallback(async () => {
    setItems([]);
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(0);
    setHasMore(true);
    await loadPage(1, false);
  }, [loadPage]);

  // Refresh all data with resilience to cancellations
  const refresh = useCallback(async () => {
    const pagesToLoad = currentPage;
    setItems([]);

    // Load all pages sequentially to maintain order
    for (let page = 1; page <= pagesToLoad; page++) {
      try {
        const result = await loadPage(page, page > 1);

        // If a page fails to load due to cancellation, we can continue
        if (!result) {
          console.debug(`Page ${page} refresh was cancelled or failed, continuing...`);
          // Don't break the loop, just continue to next page
          continue;
        }
      } catch (error) {
        if (isAutoCancellationError(error)) {
          console.debug(`Page ${page} refresh was cancelled, continuing...`);
          continue;
        } else {
          // Real error, stop refreshing
          console.error(`Error refreshing page ${page}:`, error);
          break;
        }
      }
    }
  }, [currentPage, loadPage, isAutoCancellationError]);

  // Optimistic update helpers
  const addItem = useCallback((item: T) => {
    setItems((prev) => [item, ...prev]);
    setTotalItems((prev) => prev + 1);
  }, []);

  const updateItem = useCallback((itemId: string, updates: Partial<T>) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setTotalItems((prev) => Math.max(0, prev - 1));
  }, []);

  // NOTE: Intersection observer logic has been moved to CardPatternInfinite component
  // This hook now only provides data and loadMore function

  // Initial load and parameter change handling
  useEffect(() => {
    if (mutator && typeof mutator.getList === "function") {
      // Reset state directly without calling reset function to avoid loops
      setItems([]);
      setCurrentPage(1);
      setTotalItems(0);
      setTotalPages(0);
      setHasMore(true);
      isInitializedRef.current = false;

      // Load first page directly to avoid dependency issues
      const loadInitialPage = async () => {
        if (isLoadingRef.current) return;

        updateLoadingState(true);
        try {
          const result = await mutator.getList(1, perPage, filter, sort, expand);

          setLastLoadTime(Date.now());
          setItems(result.items);
          setCurrentPage(result.page);
          setTotalItems(result.totalItems);
          setTotalPages(result.totalPages);
          setHasMore(result.page < result.totalPages);
          isInitializedRef.current = true;

          console.debug(
            `Initial load result: page=${result.page}, totalPages=${result.totalPages}, hasMore=${result.page < result.totalPages}, totalItems=${result.totalItems}, itemsLength=${result.items.length}`
          );

          if (result.page >= result.totalPages) {
            onReachEnd?.();
          }
        } catch (error) {
          if (isAutoCancellationError(error)) {
            console.debug("Initial page load was auto-cancelled, will be retried:", error);
          } else {
            console.error("Error loading initial page:", error);
          }
        } finally {
          updateLoadingState(false);
        }
      };

      loadInitialPage();
    }
  }, [mutator, perPage, filter, sort, expand, onReachEnd, updateLoadingState, isAutoCancellationError]); // Re-run when mutator or parameters change

  // Observer cleanup is handled by CardPatternInfinite component

  return {
    items,
    isLoading,
    hasMore,
    currentPage,
    totalItems,
    totalPages,
    loadMore,
    reset,
    refresh,
    addItem,
    updateItem,
    removeItem,
    mutator,
    debug: {
      pagesLoaded: currentPage,
      itemsPerPage: perPage,
      lastLoadTime,
      isInitialized: isInitializedRef.current,
    },
  };
}

/**
 * Simplified version of useListInfiniteScroll for basic use cases
 *
 * @example
 * ```tsx
 * const { items, isLoading, hasMore, loadMoreRef } = useSimpleInfiniteScroll(
 *   projectMutator,
 *   { perPage: 10, sort: '-created' }
 * );
 * ```
 */
export function useSimpleInfiniteScroll<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null,
  params: InfiniteScrollParams = {},
  _threshold: number = 100
): Pick<
  UseListInfiniteScrollReturn<T>,
  "items" | "isLoading" | "hasMore" | "refresh" | "addItem" | "updateItem" | "removeItem"
> {
  const { items, isLoading, hasMore, refresh, addItem, updateItem, removeItem } = useListInfiniteScroll(
    mutator,
    params,
    { threshold: _threshold }
  );

  return { items, isLoading, hasMore, refresh, addItem, updateItem, removeItem };
}

export default useListInfiniteScroll;

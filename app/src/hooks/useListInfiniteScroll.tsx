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

  /**
   * Ref to attach to the loading trigger element
   */
  loadMoreRef: React.RefObject<HTMLElement>;

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
  const {
    threshold: _threshold = 100,
    enabled = true,
    root = null,
    rootMargin = "0px",
    onLoadMore,
    onReachEnd,
    onLoadingChange,
  } = options;

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
  const loadMoreRef = useRef<HTMLElement>(null);
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isObserverActiveRef = useRef(false);
  const loadMoreFnRef = useRef<(() => Promise<void>) | null>(null);

  // Update loading state and notify callback
  const updateLoadingState = useCallback(
    (loading: boolean) => {
      setIsLoading(loading);
      isLoadingRef.current = loading;
      onLoadingChange?.(loading);
    },
    [onLoadingChange]
  );

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
            const totalLoaded = prevItems.length + result.items.length;
            // Call onLoadMore callback with correct total
            onLoadMore?.(result.page, totalLoaded);
            return [...prevItems, ...result.items];
          });
        } else {
          setItems(result.items);
          // Call onLoadMore callback
          onLoadMore?.(result.page, result.items.length);
        }

        setCurrentPage(result.page);
        setTotalItems(result.totalItems);
        setTotalPages(result.totalPages);
        setHasMore(result.page < result.totalPages);

        // Call onReachEnd if we've reached the end
        if (result.page >= result.totalPages) {
          onReachEnd?.();
        }

        return result;
      } catch (error) {
        console.error("Error loading page:", error);
        return null;
      } finally {
        updateLoadingState(false);
      }
    },
    [mutator, perPage, filter, sort, expand, onLoadMore, onReachEnd, updateLoadingState]
  );

  // Load the next page
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingRef.current || !mutator || !mutator.getList) {
      console.debug(`loadMore blocked: hasMore=${hasMore}, isLoading=${isLoadingRef.current}, mutator=${!!mutator}`);
      return;
    }
    
    console.debug(`loadMore executing: currentPage=${currentPage}, hasMore=${hasMore}`);
    await loadPage(currentPage + 1, true);
  }, [hasMore, currentPage, loadPage, mutator]);

  // Update the ref whenever loadMore changes
  useEffect(() => {
    loadMoreFnRef.current = loadMore;
  }, [loadMore]);

  // Reset to page 1
  const reset = useCallback(async () => {
    setItems([]);
    setCurrentPage(1);
    setTotalItems(0);
    setTotalPages(0);
    setHasMore(true);
    await loadPage(1, false);
  }, [loadPage]);

  // Refresh all data
  const refresh = useCallback(async () => {
    const pagesToLoad = currentPage;
    setItems([]);

    // Load all pages sequentially to maintain order
    for (let page = 1; page <= pagesToLoad; page++) {
      await loadPage(page, page > 1);
    }
  }, [currentPage, loadPage]);

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

  // Set up intersection observer for automatic loading
  useEffect(() => {
    if (!enabled || !loadMoreRef.current || !hasMore || isObserverActiveRef.current) {
      console.debug(`Observer setup blocked: enabled=${enabled}, hasRef=${!!loadMoreRef.current}, hasMore=${hasMore}, isActive=${isObserverActiveRef.current}`);
      return;
    }

    const element = loadMoreRef.current;
    console.debug(`Setting up intersection observer: hasMore=${hasMore}, currentPage=${currentPage}, totalPages=${totalPages}`);

    // Clean up any existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        // More defensive check: only load if we really have more pages
        const shouldLoadMore = entry.isIntersecting && 
                              hasMore && 
                              !isLoadingRef.current && 
                              currentPage < totalPages && 
                              totalPages > 0; // Ensure we have valid pagination data
        
        if (shouldLoadMore && loadMoreFnRef.current) {
          console.debug(`Intersection observer triggered: hasMore=${hasMore}, isLoading=${isLoadingRef.current}, currentPage=${currentPage}, totalPages=${totalPages}`);
          loadMoreFnRef.current();
        }
      },
      {
        root,
        rootMargin,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(element);
    isObserverActiveRef.current = true;

    return () => {
      if (observerRef.current && element) {
        observerRef.current.unobserve(element);
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      isObserverActiveRef.current = false;
      console.debug(`Observer cleaned up`);
    };
  }, [enabled, hasMore, currentPage, totalPages, root, rootMargin]); // Removed loadMore to break dependency cycle

  // Initial load and parameter change handling
  useEffect(() => {
    if (mutator && typeof mutator.getList === "function") {
      // Reset state directly without calling reset function to avoid loops
      setItems([]);
      setCurrentPage(1);
      setTotalItems(0);
      setTotalPages(0);
      setHasMore(true);

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

          onLoadMore?.(result.page, result.items.length);

          if (result.page >= result.totalPages) {
            onReachEnd?.();
          }
        } catch (error) {
          console.error("Error loading initial page:", error);
        } finally {
          updateLoadingState(false);
        }
      };

      loadInitialPage();
    }
  }, [mutator, perPage, filter, sort, expand, onLoadMore, onReachEnd, updateLoadingState]); // Re-run when mutator or parameters change

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

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
    loadMoreRef,
    addItem,
    updateItem,
    removeItem,
    mutator,
    debug: {
      pagesLoaded: currentPage,
      itemsPerPage: perPage,
      lastLoadTime,
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
  "items" | "isLoading" | "hasMore" | "loadMoreRef" | "refresh" | "addItem" | "updateItem" | "removeItem"
> {
  const { items, isLoading, hasMore, loadMoreRef, refresh, addItem, updateItem, removeItem } = useListInfiniteScroll(
    mutator,
    params,
    { threshold: _threshold }
  );

  return { items, isLoading, hasMore, loadMoreRef, refresh, addItem, updateItem, removeItem };
}

export default useListInfiniteScroll;

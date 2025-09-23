import type { BaseMutator } from "@project/shared/mutator";
import type { ListResult, RecordModel } from "pocketbase";

import React from "react";

import { useListInfiniteScroll, type InfiniteScrollOptions, type InfiniteScrollParams } from "./useListInfiniteScroll";
import { useListSubscription } from "./useListSubscription";

/**
 * Data structure provided by route loaders for list operations
 */
export interface ListLoaderData<T extends RecordModel> {
  /**
   * The loaded list result with items and pagination info
   */
  listResult: ListResult<T>;

  /**
   * The mutator instance for the item type
   */
  mutator: BaseMutator<T, any>;

  /**
   * Default options for list operations
   */
  defaultOptions?: {
    expand?: string | string[];
    sort?: string;
    filter?: string;
    perPage?: number;
  };
}

/**
 * Options for configuring the useListData hook
 */
export interface UseListDataOptions<T extends RecordModel> {
  /**
   * Whether to auto-refresh data on mount (default: false)
   */
  autoRefresh?: boolean;

  /**
   * Whether to enable real-time subscription for list updates (default: true)
   */
  enableSubscription?: boolean;

  /**
   * Expand parameters for real-time subscription
   */
  subscriptionExpand?: string | string[];

  /**
   * Whether to enable infinite scroll mode (default: false)
   * When enabled, the hook will use infinite scroll instead of pagination
   */
  enableInfiniteScroll?: boolean;

  /**
   * Infinite scroll configuration options
   */
  infiniteScrollOptions?: InfiniteScrollOptions;

  /**
   * Custom callback when list is updated externally
   */
  onListUpdated?: (listResult: ListResult<T>) => void;

  /**
   * Custom callback when an item is added to the list
   */
  onItemAdded?: (item: T) => void;

  /**
   * Custom callback when an item is updated in the list
   */
  onItemUpdated?: (item: T) => void;

  /**
   * Custom callback when an item is removed from the list
   */
  onItemRemoved?: (itemId: string) => void;

  /**
   * Custom callback when subscription error occurs
   */
  onSubscriptionError?: (error: Error) => void;
}

/**
 * Parameters for list operations
 */
export interface ListQueryParams {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  expand?: string | string[];
}

/**
 * Return type for the useListData hook
 */
export interface UseListDataReturn<T extends RecordModel> {
  /**
   * Current list result with items and pagination (only in pagination mode)
   */
  listResult: ListResult<T>;

  /**
   * Convenience getter for just the items
   */
  items: T[];

  /**
   * Update the entire list result (only in pagination mode)
   */
  setListResult: React.Dispatch<React.SetStateAction<ListResult<T>>>;

  /**
   * Update just the items while preserving pagination info
   */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;

  /**
   * Whether the hook is currently refreshing data
   */
  isRefreshing: boolean;

  /**
   * Whether the hook is currently loading more data (pagination or infinite scroll)
   */
  isLoadingMore: boolean;

  /**
   * Manually refresh the list from server with current parameters
   */
  refresh: () => Promise<void>;

  /**
   * Load data with new parameters (pagination mode only)
   */
  loadData: (params: ListQueryParams) => Promise<void>;

  /**
   * Load the next page (pagination mode only)
   */
  loadNextPage: () => Promise<void>;

  /**
   * Load the previous page (pagination mode only)
   */
  loadPreviousPage: () => Promise<void>;

  /**
   * Load more items (infinite scroll mode only)
   */
  loadMore: () => Promise<void>;

  /**
   * Add an item to the local list (optimistic update)
   */
  addItem: (item: T) => void;

  /**
   * Update an item in the local list (optimistic update)
   */
  updateItem: (itemId: string, updates: Partial<T>) => void;

  /**
   * Remove an item from the local list (optimistic update)
   */
  removeItem: (itemId: string) => void;

  /**
   * The mutator instance for additional operations
   */
  mutator: BaseMutator<T, any>;

  /**
   * Infinite scroll specific properties (only when enableInfiniteScroll is true)
   */
  infiniteScroll?: {
    /**
     * Whether there are more items to load
     */
    hasMore: boolean;

    /**
     * Reset infinite scroll to the beginning
     */
    reset: () => Promise<void>;
  };

  /**
   * Debug information
   */
  debug: {
    hasInitialData: boolean;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    mode: "pagination" | "infinite-scroll";
  };
}

/**
 * A comprehensive hook for managing list data with pagination, infinite scroll, filtering, and real-time updates
 *
 * This hook provides a simplified interface for:
 * - Managing list state with pagination OR infinite scroll
 * - Data refresh capabilities
 * - Optimistic updates
 * - Integration with loader data
 * - Real-time subscription support (automatically syncs create/update/delete operations)
 *
 * @example
 * ```tsx
 * // Pagination mode (default)
 * function ProjectListPage() {
 *   const loaderData = useLoaderData() as ListLoaderData<ProjectType>;
 *
 *   const {
 *     items: projects,
 *     refresh,
 *     loadData,
 *     loadNextPage,
 *     addItem,
 *     updateItem,
 *     removeItem
 *   } = useListData(loaderData, {
 *     autoRefresh: false,
 *     enableSubscription: true, // Real-time updates (default: true)
 *     subscriptionExpand: 'user,category', // Expand for subscription
 *     onItemAdded: (item) => console.log("Project added!", item),
 *     onItemUpdated: (item) => console.log("Project updated!", item),
 *     onItemRemoved: (id) => console.log("Project removed!", id),
 *   });
 *
 *   // Use projects list... (automatically stays in sync with server changes)
 * }
 *
 * // Infinite scroll mode
 * function InfiniteProjectList() {
 *   const loaderData = useLoaderData() as ListLoaderData<ProjectType>;
 *
 *   const {
 *     items: projects,
 *     infiniteScroll,
 *     addItem,
 *     updateItem,
 *     removeItem
 *   } = useListData(loaderData, {
 *     enableInfiniteScroll: true,
 *     enableSubscription: true,
 *     infiniteScrollOptions: {
 *       threshold: 200,
 *       onLoadMore: (page, total) => console.log(`Loaded page ${page}, total: ${total}`)
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       {projects.map(project => (
 *         <ProjectCard key={project.id} project={project} />
 *       ))}
 *       {infiniteScroll?.hasMore && (
 *         <div ref={infiniteScroll.loadMoreRef}>Loading more...</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useListData<T extends RecordModel>(
  loaderData: ListLoaderData<T>,
  options: UseListDataOptions<T> = {}
): UseListDataReturn<T> {
  const {
    autoRefresh = false,
    enableSubscription = true,
    enableInfiniteScroll = false,
    subscriptionExpand,
    infiniteScrollOptions = {},
    onListUpdated,
    onItemAdded,
    onItemUpdated,
    onItemRemoved,
    onSubscriptionError,
  } = options;

  const { listResult: initialListResult, mutator, defaultOptions } = loaderData;

  // Infinite scroll hook - only initialize if infinite scroll is enabled
  const infiniteScrollParams: InfiniteScrollParams = enableInfiniteScroll
    ? {
        perPage: defaultOptions?.perPage || 30,
        filter: defaultOptions?.filter,
        sort: defaultOptions?.sort,
        expand: defaultOptions?.expand,
      }
    : {};

  const infiniteScrollResult = useListInfiniteScroll(
    enableInfiniteScroll ? mutator : (null as any), // Pass null when disabled
    enableInfiniteScroll ? infiniteScrollParams : {},
    enableInfiniteScroll
      ? {
          ...infiniteScrollOptions,
          onLoadMore: (page, totalLoaded) => {
            infiniteScrollOptions?.onLoadMore?.(page, totalLoaded);
          },
        }
      : {} // Don't pass any options when disabled
  );

  // State management (for pagination mode)
  const [listResult, setListResult] = React.useState<ListResult<T>>(initialListResult);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [currentParams, setCurrentParams] = React.useState<ListQueryParams>({
    page: initialListResult.page,
    perPage: initialListResult.perPage,
    ...defaultOptions,
  });

  // Update list result when initialListResult changes (e.g., from route loader)
  React.useEffect(() => {
    setListResult(initialListResult);
    setCurrentParams({
      page: initialListResult.page,
      perPage: initialListResult.perPage,
      ...defaultOptions,
    });
  }, [initialListResult, defaultOptions]);

  // Convenience setter for just items
  const setItems = React.useCallback((newItems: React.SetStateAction<T[]>) => {
    setListResult((prev) => ({
      ...prev,
      items: typeof newItems === "function" ? newItems(prev.items) : newItems,
    }));
  }, []);

  // Load data with specific parameters
  const loadData = React.useCallback(
    async (params: ListQueryParams) => {
      if (!mutator) return;

      const isNewPage = params.page !== currentParams.page;
      const loadingState = isNewPage ? setIsLoadingMore : setIsRefreshing;

      loadingState(true);
      try {
        const result = await mutator.getList(
          params.page || 1,
          params.perPage || defaultOptions?.perPage || 30,
          params.filter || defaultOptions?.filter,
          params.sort || defaultOptions?.sort,
          params.expand || defaultOptions?.expand
        );

        setListResult(result);
        setCurrentParams(params);

        if (onListUpdated) {
          onListUpdated(result);
        }
      } catch (error) {
        console.error("Error loading list data:", error);
        // Optionally handle specific error cases here
      } finally {
        loadingState(false);
      }
    },
    [mutator, defaultOptions, currentParams.page, onListUpdated]
  );

  // Refresh function to reload data with current parameters
  const refresh = React.useCallback(async () => {
    await loadData(currentParams);
  }, [loadData, currentParams]);

  // Pagination helpers
  const loadNextPage = React.useCallback(async () => {
    if (listResult.page < listResult.totalPages) {
      await loadData({
        ...currentParams,
        page: listResult.page + 1,
      });
    }
  }, [loadData, currentParams, listResult.page, listResult.totalPages]);

  const loadPreviousPage = React.useCallback(async () => {
    if (listResult.page > 1) {
      await loadData({
        ...currentParams,
        page: listResult.page - 1,
      });
    }
  }, [loadData, currentParams, listResult.page]);

  // Optimistic update helpers
  const addItem = React.useCallback(
    (item: T) => {
      setItems((prev) => [item, ...prev]);
      setListResult((prev) => ({
        ...prev,
        totalItems: prev.totalItems + 1,
      }));

      if (onItemAdded) {
        onItemAdded(item);
      }
    },
    [setItems, onItemAdded]
  );

  const updateItem = React.useCallback(
    (itemId: string, updates: Partial<T>) => {
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));

      const updatedItem = listResult.items.find((item) => item.id === itemId);
      if (updatedItem && onItemUpdated) {
        onItemUpdated({ ...updatedItem, ...updates });
      }
    },
    [setItems, listResult.items, onItemUpdated]
  );

  const removeItem = React.useCallback(
    (itemId: string) => {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setListResult((prev) => ({
        ...prev,
        totalItems: Math.max(0, prev.totalItems - 1),
      }));

      if (onItemRemoved) {
        onItemRemoved(itemId);
      }
    },
    [setItems, onItemRemoved]
  );

  // Auto-refresh effect
  React.useEffect(() => {
    if (autoRefresh) {
      refresh();
    }
  }, [autoRefresh, refresh]);

  // Choose the appropriate functions based on mode
  const currentItems = enableInfiniteScroll ? (infiniteScrollResult.items as T[]) : listResult.items;
  const currentAddItem = enableInfiniteScroll ? infiniteScrollResult.addItem : addItem;
  const currentUpdateItem = enableInfiniteScroll ? infiniteScrollResult.updateItem : updateItem;
  const currentRemoveItem = enableInfiniteScroll ? infiniteScrollResult.removeItem : removeItem;
  const currentRefresh = enableInfiniteScroll ? infiniteScrollResult.refresh : refresh;

  // Real-time subscription for list updates
  useListSubscription(
    mutator,
    (event) => {
      switch (event.action) {
        case "create":
          // Add new item to the beginning of the list
          currentAddItem(event.record);
          onItemAdded?.(event.record);
          console.debug(`Item created via subscription: ${event.record.id}`);
          break;

        case "update":
          // Update existing item in the list
          currentUpdateItem(event.record.id, event.record);
          onItemUpdated?.(event.record);
          console.debug(`Item updated via subscription: ${event.record.id}`);
          break;

        case "delete":
          // Remove item from the list
          currentRemoveItem(event.record.id);
          onItemRemoved?.(event.record.id);
          console.debug(`Item deleted via subscription: ${event.record.id}`);
          break;
      }
    },
    onSubscriptionError,
    subscriptionExpand || defaultOptions?.expand,
    enableSubscription
  );

  return {
    listResult: enableInfiniteScroll
      ? ({
          page: infiniteScrollResult.currentPage,
          perPage: infiniteScrollParams.perPage || 30,
          totalItems: infiniteScrollResult.totalItems,
          totalPages: infiniteScrollResult.totalPages,
          items: infiniteScrollResult.items as T[],
        } as ListResult<T>)
      : listResult,
    items: currentItems,
    setListResult,
    setItems: enableInfiniteScroll ? ((() => {}) as React.Dispatch<React.SetStateAction<T[]>>) : setItems, // setItems not applicable in infinite scroll mode
    isRefreshing: enableInfiniteScroll ? false : isRefreshing, // Infinite scroll doesn't have separate refresh state
    isLoadingMore: enableInfiniteScroll ? infiniteScrollResult.isLoading : isLoadingMore,
    refresh: currentRefresh,
    loadData: enableInfiniteScroll ? () => Promise.resolve() : loadData, // loadData not applicable in infinite scroll mode
    loadNextPage: enableInfiniteScroll ? () => Promise.resolve() : loadNextPage, // Traditional pagination not applicable in infinite scroll mode
    loadPreviousPage: enableInfiniteScroll ? () => Promise.resolve() : loadPreviousPage, // Traditional pagination not applicable in infinite scroll mode
    loadMore: enableInfiniteScroll ? infiniteScrollResult.loadMore : () => Promise.resolve(), // loadMore only applicable in infinite scroll mode
    addItem: currentAddItem,
    updateItem: currentUpdateItem,
    removeItem: currentRemoveItem,
    mutator,
    infiniteScroll: enableInfiniteScroll
      ? {
          hasMore: infiniteScrollResult.hasMore,
          reset: infiniteScrollResult.reset,
        }
      : undefined,
    debug: {
      hasInitialData: enableInfiniteScroll ? infiniteScrollResult.items.length > 0 : initialListResult.items.length > 0,
      currentPage: enableInfiniteScroll ? infiniteScrollResult.currentPage : listResult.page,
      totalPages: enableInfiniteScroll ? infiniteScrollResult.totalPages : listResult.totalPages,
      totalItems: enableInfiniteScroll ? infiniteScrollResult.totalItems : listResult.totalItems,
      perPage: enableInfiniteScroll ? infiniteScrollParams.perPage || 30 : listResult.perPage,
      mode: enableInfiniteScroll ? "infinite-scroll" : "pagination",
    },
  };
}

/**
 * Simplified version of useListData for basic use cases
 *
 * @example
 * ```tsx
 * // Pagination mode
 * const { items, refresh, mutator } = useSimpleListData(loaderData);
 *
 * // Infinite scroll mode
 * const { items, infiniteScroll, mutator } = useSimpleListData(loaderData, { enableInfiniteScroll: true });
 * ```
 */
export function useSimpleListData<T extends RecordModel>(
  loaderData: ListLoaderData<T>,
  options: Pick<UseListDataOptions<T>, "enableInfiniteScroll" | "infiniteScrollOptions"> = {}
): Pick<
  UseListDataReturn<T>,
  "items" | "refresh" | "mutator" | "addItem" | "updateItem" | "removeItem" | "infiniteScroll"
> {
  const { items, refresh, mutator, addItem, updateItem, removeItem, infiniteScroll } = useListData(loaderData, options);

  return { items, refresh, mutator, addItem, updateItem, removeItem, infiniteScroll };
}

export default useListData;

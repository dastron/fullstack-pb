import type { BaseMutator } from "@project/shared/mutator";
import type { RecordModel, RecordSubscription } from "pocketbase";

import React from "react";

import { useItemSubscription } from "./useItemSubscription";

/**
 * Data structure provided by route loaders for item operations
 */
export interface ItemLoaderData<T extends RecordModel> {
  /**
   * The loaded item data (null if creating new item)
   */
  item: T | null;

  /**
   * The mutator instance for the item type
   */
  mutator: BaseMutator<T, any>;

  /**
   * The item ID being loaded/edited
   */
  itemId?: string;

  /**
   * Default expand options for future subscription functionality
   */
  defaultExpand?: string | string[];
}

/**
 * Options for configuring the useItemData hook
 */
export interface UseItemDataOptions<T extends RecordModel> {
  /**
   * Whether to auto-refresh data on mount (default: false)
   */
  autoRefresh?: boolean;

  /**
   * Whether to enable real-time subscriptions (default: true)
   */
  enableSubscription?: boolean;

  /**
   * Custom callback when item is updated externally
   */
  onItemUpdated?: (item: T) => void;

  /**
   * Custom callback when item is deleted externally
   */
  onItemDeleted?: () => void;

  /**
   * Custom callback when subscription errors occur
   */
  onSubscriptionError?: (error: Error) => void;
}

/**
 * Return type for the useItemData hook
 */
export interface UseItemDataReturn<T extends RecordModel> {
  /**
   * Current item data
   */
  item: T | null;

  /**
   * Update the item data
   */
  setItem: React.Dispatch<React.SetStateAction<T | null>>;

  /**
   * Whether the hook is currently refreshing data
   */
  isRefreshing: boolean;

  /**
   * Manually refresh the item from server
   */
  refresh: () => Promise<void>;

  /**
   * The mutator instance for additional operations
   */
  mutator: BaseMutator<T, any>;

  /**
   * Debug information
   */
  debug: {
    itemId?: string;
    hasInitialData: boolean;
    isControlled: boolean;
    subscriptionEnabled: boolean;
  };
}

/**
 * A comprehensive hook for managing single item data with real-time updates
 *
 * This hook provides a simplified interface for:
 * - Managing single item state
 * - Data refresh capabilities
 * - Integration with loader data
 * - Real-time subscription support for live updates
 *
 * @example
 * ```tsx
 * function ProjectEditorPage() {
 *   const loaderData = useLoaderData() as ItemLoaderData<ProjectType>;
 *
 *   const { item: project, setItem: setProject, refresh } = useItemData(loaderData, {
 *     autoRefresh: true,
 *     enableSubscription: true, // Enable real-time updates
 *     onItemUpdated: (item) => console.log("Project updated!", item),
 *     onItemDeleted: () => navigate("/projects"),
 *     onSubscriptionError: (error) => console.error("Subscription error:", error)
 *   });
 *
 *   // Use project data... (will automatically update when data changes in real-time)
 * }
 * ```
 */
export function useItemData<T extends RecordModel>(
  loaderData: ItemLoaderData<T>,
  options: UseItemDataOptions<T> = {}
): UseItemDataReturn<T> {
  const { autoRefresh = false, enableSubscription = true, onItemUpdated, onItemDeleted, onSubscriptionError } = options;

  const { item: initialItem, mutator, itemId, defaultExpand } = loaderData;

  // State management
  const [item, setItem] = React.useState<T | null>(initialItem);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Update item state when initialItem changes (e.g., from route loader)
  React.useEffect(() => {
    setItem(initialItem);
  }, [initialItem]);

  // Refresh function to reload data from server
  const refresh = React.useCallback(async () => {
    if (!itemId || !mutator) return;

    setIsRefreshing(true);
    try {
      const refreshedItem = await mutator.getById(itemId, defaultExpand);
      setItem(refreshedItem);

      if (refreshedItem && onItemUpdated) {
        onItemUpdated(refreshedItem);
      }

      // Handle case where item was deleted
      if (!refreshedItem && onItemDeleted) {
        onItemDeleted();
      }
    } catch (error) {
      console.error("Error refreshing item:", error);
      // Optionally handle specific error cases here
    } finally {
      setIsRefreshing(false);
    }
  }, [itemId, mutator, defaultExpand, onItemUpdated, onItemDeleted]);

  // Auto-refresh effect
  React.useEffect(() => {
    if (autoRefresh && itemId) {
      refresh();
    }
  }, [autoRefresh, itemId, refresh]);

  // Real-time subscription effect
  const handleSubscriptionUpdate = React.useCallback(
    (event: RecordSubscription<T>) => {
      switch (event.action) {
        case "update":
          setItem(event.record);
          if (onItemUpdated) {
            onItemUpdated(event.record);
          }
          break;
        case "delete":
          setItem(null);
          if (onItemDeleted) {
            onItemDeleted();
          }
          break;
        default:
          // Handle other actions if needed
          break;
      }
    },
    [onItemUpdated, onItemDeleted]
  );

  useItemSubscription(
    enableSubscription ? mutator : null,
    enableSubscription ? itemId : null,
    handleSubscriptionUpdate,
    onSubscriptionError,
    defaultExpand
  );

  return {
    item,
    setItem,
    isRefreshing,
    refresh,
    mutator,
    debug: {
      itemId,
      hasInitialData: !!initialItem,
      isControlled: true, // This hook always controls its state
      subscriptionEnabled: enableSubscription && !!itemId,
    },
  };
}

/**
 * Simplified version of useItemData for basic use cases
 *
 * @example
 * ```tsx
 * const { item, setItem, mutator } = useSimpleItemData(loaderData);
 * ```
 */
export function useSimpleItemData<T extends RecordModel>(
  loaderData: ItemLoaderData<T>
): Pick<UseItemDataReturn<T>, "item" | "setItem" | "mutator"> {
  const { item, setItem, mutator } = useItemData(loaderData);

  return { item, setItem, mutator };
}

export default useItemData;

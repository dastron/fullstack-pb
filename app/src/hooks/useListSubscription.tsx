import type { BaseMutator } from "@project/shared/mutator";
import type { RecordModel, RecordSubscription, UnsubscribeFunc } from "pocketbase";

import { useEffect, useRef } from "react";

/**
 * Generic hook for subscribing to real-time updates on all records in a collection
 *
 * This hook provides a reusable pattern for subscribing to PocketBase collection changes
 * using the subscription methods available in BaseMutator with a wildcard "*" to get all events.
 *
 * @param mutator - The mutator instance for the record type
 * @param onUpdate - Callback function called when any record in the collection is updated
 * @param onError - Optional callback function called when subscription errors occur
 * @param expand - Optional expand parameters for the subscription
 * @param enabled - Whether the subscription is enabled (default: true)
 *
 * @example
 * ```tsx
 * const projectMutator = new ProjectMutator(pb);
 *
 * useListSubscription(
 *   projectMutator,
 *   (event) => {
 *     if (event.action === 'create') {
 *       addItem(event.record);
 *     } else if (event.action === 'update') {
 *       updateItem(event.record.id, event.record);
 *     } else if (event.action === 'delete') {
 *       removeItem(event.record.id);
 *     }
 *   },
 *   (error) => console.error('List subscription error:', error),
 *   'user,category'
 * );
 * ```
 */
export function useListSubscription<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null | undefined,
  onUpdate: (event: RecordSubscription<T>) => void,
  onError?: (error: Error) => void,
  expand?: string | string[],
  enabled: boolean = true
): void {
  const unsubscribeRef = useRef<UnsubscribeFunc | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  // Keep callback refs up-to-date
  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    isMountedRef.current = true;
    const currentMutator = mutator;

    // If not enabled, no valid mutator, ensure we are unsubscribed and do nothing else
    if (!enabled || !currentMutator) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    // Subscribe to all records in the collection using wildcard "*"
    currentMutator
      .subscribeToRecord(
        "*", // Wildcard to subscribe to all records in the collection
        (event) => {
          if (isMountedRef.current) {
            onUpdateRef.current(event);
          }
        },
        expand
      )
      .then((unsubscribeFunc) => {
        if (isMountedRef.current) {
          unsubscribeRef.current = unsubscribeFunc;
          console.debug(`List subscription established: ${currentMutator.constructor.name}/*`);
        } else {
          unsubscribeFunc();
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.error(`List subscription failed (${currentMutator.constructor.name}/*):`, err);
          onErrorRef.current?.(err instanceof Error ? err : new Error("List subscription failed"));
        } else {
          console.error(`List subscription failed (unmounted): ${currentMutator.constructor.name}/*`, err);
        }
      });

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      if (currentMutator) {
        try {
          currentMutator.unsubscribeFromRecord("*");
        } catch (cleanupErr: any) {
          if (!(typeof cleanupErr?.message === "string" && cleanupErr.message.includes("No subscription"))) {
            console.error(`Error during direct unsubscribe call for ${currentMutator.constructor.name}/*:`, cleanupErr);
          }
        }
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current = null;
      }
    };
    // Re-run effect if mutator, expand, or enabled changes
  }, [mutator, expand, enabled]);
}

/**
 * Simplified version of useListSubscription with predefined handlers for common CRUD operations
 *
 * @param mutator - The mutator instance for the record type
 * @param handlers - Object with handlers for create, update, and delete operations
 * @param expand - Optional expand parameters for the subscription
 * @param enabled - Whether the subscription is enabled (default: true)
 */
export function useSimpleListSubscription<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null | undefined,
  handlers: {
    onCreate?: (record: T) => void;
    onUpdate?: (record: T) => void;
    onDelete?: (recordId: string) => void;
  },
  expand?: string | string[],
  enabled: boolean = true
): void {
  const { onCreate, onUpdate, onDelete } = handlers;

  useListSubscription(
    mutator,
    (event) => {
      switch (event.action) {
        case "create":
          onCreate?.(event.record);
          break;
        case "update":
          onUpdate?.(event.record);
          break;
        case "delete":
          onDelete?.(event.record.id);
          break;
      }
    },
    undefined,
    expand,
    enabled
  );
}

export default useListSubscription;

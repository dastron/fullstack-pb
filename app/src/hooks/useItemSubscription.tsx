import type { BaseMutator } from "@project/shared/mutator";
import type { RecordModel, RecordSubscription, UnsubscribeFunc } from "pocketbase";

import { useEffect, useRef } from "react";

/**
 * Generic hook for subscribing to real-time updates on a specific record
 *
 * This hook provides a reusable pattern for subscribing to PocketBase record changes
 * using the subscription methods available in BaseMutator.
 *
 * @param mutator - The mutator instance for the record type
 * @param recordId - The ID of the record to subscribe to (null/undefined to disable subscription)
 * @param onUpdate - Callback function called when the record is updated
 * @param onError - Optional callback function called when subscription errors occur
 * @param expand - Optional expand parameters for the subscription
 *
 * @example
 * ```tsx
 * const projectMutator = new ProjectMutator(pb);
 *
 * useItemSubscription(
 *   projectMutator,
 *   projectId,
 *   (event) => {
 *     if (event.action === 'update') {
 *       setProject(event.record);
 *     } else if (event.action === 'delete') {
 *       navigate('/projects');
 *     }
 *   },
 *   (error) => console.error('Subscription error:', error),
 *   'user,category'
 * );
 * ```
 */
export function useItemSubscription<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null | undefined,
  recordId: string | null | undefined,
  onUpdate: (event: RecordSubscription<T>) => void,
  onError?: (error: Error) => void,
  expand?: string | string[]
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
    const currentRecordId = recordId;
    const currentMutator = mutator;

    // If no valid recordId or mutator, ensure we are unsubscribed and do nothing else
    if (!currentRecordId || !currentMutator) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    // Subscribe to the specific record using the mutator's subscription method
    currentMutator
      .subscribeToRecord(
        currentRecordId,
        (event) => {
          if (isMountedRef.current && event.record.id === currentRecordId) {
            onUpdateRef.current(event);
          }
        },
        expand
      )
      .then((unsubscribeFunc) => {
        if (isMountedRef.current) {
          unsubscribeRef.current = unsubscribeFunc;
          console.debug(`Subscription established: ${currentMutator.constructor.name}/${currentRecordId}`);
        } else {
          unsubscribeFunc();
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.error(`Subscription failed (${currentMutator.constructor.name}/${currentRecordId}):`, err);
          onErrorRef.current?.(err instanceof Error ? err : new Error("Subscription failed"));
        } else {
          console.error(`Subscription failed (unmounted): ${currentMutator.constructor.name}/${currentRecordId}`, err);
        }
      });

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      if (currentRecordId && currentMutator) {
        try {
          currentMutator.unsubscribeFromRecord(currentRecordId);
        } catch (cleanupErr: any) {
          if (!(typeof cleanupErr?.message === "string" && cleanupErr.message.includes("No subscription"))) {
            console.error(
              `Error during direct unsubscribe call for ${currentMutator.constructor.name}/${currentRecordId}:`,
              cleanupErr
            );
          }
        }
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current = null;
      }
    };
    // Re-run effect if recordId, mutator, or expand changes
  }, [recordId, mutator, expand]);
}

/**
 * Simplified version of useItemSubscription that only handles updates (not deletes)
 *
 * @param mutator - The mutator instance for the record type
 * @param recordId - The ID of the record to subscribe to
 * @param onUpdate - Callback function called when the record is updated
 * @param expand - Optional expand parameters for the subscription
 */
export function useSimpleItemSubscription<T extends RecordModel>(
  mutator: BaseMutator<T, any> | null | undefined,
  recordId: string | null | undefined,
  onUpdate: (record: T) => void,
  expand?: string | string[]
): void {
  useItemSubscription(
    mutator,
    recordId,
    (event) => {
      if (event.action === "update") {
        onUpdate(event.record);
      }
    },
    undefined,
    expand
  );
}

export default useItemSubscription;

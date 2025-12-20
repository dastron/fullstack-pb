import type { TodoType } from "@project/shared/types";
import type { RecordSubscription, UnsubscribeFunc } from "pocketbase";

import { useEffect, useRef } from "react";

import pb from "@/pb";

export function useTodoItemSubscription(
  todoId: string | undefined | null,
  onUpdate: (event: RecordSubscription<TodoType>) => void,
  onError?: (error: Error) => void
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
    const currentTodoId = todoId;

    // If no valid todoId, ensure we are unsubscribed and do nothing else
    if (!currentTodoId) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    // Subscribe to the specific todo record
    pb.collection("Todos")
      .subscribe<TodoType>(currentTodoId, (e) => {
        if (isMountedRef.current && e.record.id === currentTodoId) {
          onUpdateRef.current(e);
        }
      })
      .then((unsubscribeFunc) => {
        if (isMountedRef.current) {
          unsubscribeRef.current = unsubscribeFunc;
          console.debug(`Subscription established: Todos/${currentTodoId}`);
        } else {
          unsubscribeFunc();
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.error(`Subscription failed (Todos/${currentTodoId}):`, err);
          onErrorRef.current?.(err instanceof Error ? err : new Error("Subscription failed"));
        } else {
          console.error(`Subscription failed (unmounted): Todos/${currentTodoId}`, err);
        }
      });

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (currentTodoId) {
        try {
          pb.collection("Todos").unsubscribe(currentTodoId);
        } catch (cleanupErr: any) {
          if (!(typeof cleanupErr?.message === "string" && cleanupErr.message.includes("No subscription"))) {
            console.error(`Error during direct unsubscribe call for Todos/${currentTodoId}:`, cleanupErr);
          }
        }
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current = null;
      }
    };
    // Re-run effect if todoId changes
  }, [todoId]);
}

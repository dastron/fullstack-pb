import type { ProjectType } from "@project/shared/types"; // Assuming ProjectType is defined here
import type { UnsubscribeFunc, RecordSubscription } from "pocketbase";

import { useEffect, useRef } from "react";

import pb from "@/pb";

export function useProjectItemSubscription(
  projectId: string | undefined | null,
  onUpdate: (event: RecordSubscription<ProjectType>) => void,
  onError?: (error: Error) => void,
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
    const currentProjectId = projectId;

    // If no valid projectId, ensure we are unsubscribed and do nothing else
    if (!currentProjectId) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      return;
    }

    // Subscribe to the specific project record
    pb.collection("Projects")
      .subscribe<ProjectType>(currentProjectId, (e) => {
        if (isMountedRef.current && e.record.id === currentProjectId) {
          onUpdateRef.current(e);
        }
      })
      .then((unsubscribeFunc) => {
        if (isMountedRef.current) {
          unsubscribeRef.current = unsubscribeFunc;
          console.debug(`Subscription established: Projects/${currentProjectId}`);
        } else {
          unsubscribeFunc();
        }
      })
      .catch((err) => {
        if (isMountedRef.current) {
          console.error(`Subscription failed (Projects/${currentProjectId}):`, err);
          onErrorRef.current?.(err instanceof Error ? err : new Error("Subscription failed"));
        } else {
           console.error(`Subscription failed (unmounted): Projects/${currentProjectId}`, err);
        }
      });

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (currentProjectId) {
        try {
          pb.collection("Projects").unsubscribe(currentProjectId);
        } catch (cleanupErr: any) {
           if (!(typeof cleanupErr?.message === 'string' && cleanupErr.message.includes("No subscription"))) {
                console.error(`Error during direct unsubscribe call for Projects/${currentProjectId}:`, cleanupErr);
           }
        }
      }

      if (unsubscribeRef.current) {
        unsubscribeRef.current = null;
      }
    };
    // Re-run effect if projectId changes
  }, [projectId]);
}

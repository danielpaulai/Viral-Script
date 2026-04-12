/**
 * React hook for handling Server-Sent Events (SSE) streaming
 * Connects to backend streaming endpoint and handles progress updates
 */

import { useCallback, useRef, useState, useEffect } from "react";

export interface ProgressUpdate {
  event: string;
  message: string;
  progress?: number;
  duration?: number;
  details?: Record<string, unknown>;
}

interface UseStreamOptions {
  onProgress?: (update: ProgressUpdate) => void;
  onError?: (error: { code: string; message: string; details?: Record<string, unknown> }) => void;
  onComplete?: (data: Record<string, unknown>) => void;
  onCancel?: () => void;
}

/**
 * Hook for handling SSE streams
 * Usage:
 *   const { stream, isStreaming, cancel } = useStream();
 *   
 *   const handleGenerate = async () => {
 *     stream("/api/scripts/generate-stream", params, {
 *       onProgress: (update) => console.log(update.message),
 *       onComplete: (data) => setScript(data),
 *     });
 *   };
 */
export function useStream() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const stream = useCallback(
    async (
      endpoint: string,
      params: Record<string, unknown>,
      options: UseStreamOptions = {}
    ) => {
      try {
        setIsStreaming(true);
        abortControllerRef.current = new AbortController();

        // Send POST request to initiate stream
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          const error = errorData.error || { message: "Stream failed" };
          options.onError?.(error);
          setIsStreaming(false);
          return;
        }

        // Connect to event stream
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const update = JSON.parse(line.slice(6)) as ProgressUpdate;

                  if (update.event === "complete") {
                    options.onComplete?.(update.details || {});
                    setIsStreaming(false);
                  } else if (update.event === "error") {
                    options.onError?.(
                      update.details as {
                        code: string;
                        message: string;
                        details?: Record<string, unknown>;
                      }
                    );
                    setIsStreaming(false);
                  } else if (update.event === "cancelled") {
                    options.onCancel?.();
                    setIsStreaming(false);
                  } else {
                    options.onProgress?.(update);
                  }
                } catch (e) {
                  console.error("Failed to parse stream message:", line, e);
                }
              }
            }
          }
        }
      } catch (error) {
        if ((error as any).name === "AbortError") {
          options.onCancel?.();
        } else {
          options.onError?.({
            code: "STREAM_ERROR",
            message: (error as Error).message,
          });
        }
        setIsStreaming(false);
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { stream, isStreaming, cancel };
}

/**
 * Hook for draft auto-save
 * Saves form state to localStorage every interval
 */
export function useDraftAutoSave(
  draftKey: string,
  data: Record<string, unknown> | null,
  interval: number = 5000
) {
  useEffect(() => {
    if (!data) return;

    const timer = setInterval(() => {
      try {
        localStorage.setItem(`draft_${draftKey}`, JSON.stringify(data));
        console.log(`[Draft] Auto-saved: ${draftKey}`);
      } catch (error) {
        console.error("[Draft] Save failed:", error);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [data, draftKey, interval]);
}

/**
 * Get saved draft from localStorage
 */
export function getSavedDraft(draftKey: string): Record<string, unknown> | null {
  try {
    const draft = localStorage.getItem(`draft_${draftKey}`);
    return draft ? JSON.parse(draft) : null;
  } catch {
    return null;
  }
}

/**
 * Clear saved draft from localStorage
 */
export function clearSavedDraft(draftKey: string): void {
  localStorage.removeItem(`draft_${draftKey}`);
}

/**
 * List all saved drafts
 */
export function listSavedDrafts(): string[] {
  const drafts: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("draft_")) {
      drafts.push(key.replace("draft_", ""));
    }
  }
  return drafts;
}

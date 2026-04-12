/**
 * Server-Sent Events (SSE) streaming utilities
 * Allows real-time progress updates to connected clients
 */

import { Response } from "express";

export type ProgressEvent = 
  | "start"
  | "research_start"
  | "research_complete"
  | "generation_start"
  | "generation_progress"
  | "generation_complete"
  | "validation_start"
  | "validation_complete"
  | "saving_start"
  | "saving_complete"
  | "complete"
  | "error"
  | "cancelled";

export interface ProgressUpdate {
  event: ProgressEvent;
  message: string;
  progress?: number; // 0-100
  duration?: number; // elapsed ms
  details?: Record<string, unknown>;
}

/**
 * Set up response for SSE streaming
 * Client will listen with EventSource('/api/scripts/generate-stream')
 */
export function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  
  // Send initial connection message
  res.write(`:SSE connection established\n\n`);
}

/**
 * Send a progress update to the client
 * Formats as Server-Sent Event
 */
export function sendProgress(res: Response, update: ProgressUpdate): void {
  const data = JSON.stringify(update);
  res.write(`data: ${data}\n\n`);
}

/**
 * Send error event and close connection
 */
export function sendError(res: Response, errorCode: string, errorMessage: string, details?: Record<string, unknown>): void {
  const errorEvent: ProgressUpdate = {
    event: "error",
    message: errorMessage,
    details: { code: errorCode, ...details },
  };
  sendProgress(res, errorEvent);
  res.end();
}

/**
 * Send completion event and close connection
 */
export function sendComplete(res: Response, data: Record<string, unknown>): void {
  const completeEvent: ProgressUpdate = {
    event: "complete",
    message: "Script generation complete",
    details: data,
  };
  sendProgress(res, completeEvent);
  res.end();
}

/**
 * Create a progress tracker that sends updates
 * Usage:
 *   const tracker = createProgressTracker(res);
 *   tracker.update("generation_start", "Starting script generation...");
 *   tracker.update("generation_progress", "50% complete", { progress: 50 });
 */
export function createProgressTracker(res: Response) {
  const startTime = Date.now();
  
  return {
    update(event: ProgressEvent, message: string, details?: Record<string, unknown>, progress?: number): void {
      const duration = Date.now() - startTime;
      sendProgress(res, {
        event,
        message,
        progress: progress ?? (details?.progress as number | undefined),
        duration,
        details,
      });
    },
    
    error(code: string, message: string, details?: Record<string, unknown>): void {
      sendError(res, code, message, details);
    },
    
    complete(data: Record<string, unknown>): void {
      sendComplete(res, data);
    },
  };
}

/**
 * Cancellation tracking for long-running operations
 * Use with AbortController on frontend
 */
export class CancellationToken {
  private cancelled = false;
  private listeners: (() => void)[] = [];
  
  constructor(private signal?: AbortSignal) {
    if (signal) {
      signal.addEventListener("abort", () => {
        this.cancelled = true;
        this.listeners.forEach(listener => listener());
      });
    }
  }
  
  get isCancelled(): boolean {
    return this.cancelled;
  }
  
  onCancel(callback: () => void): void {
    if (this.cancelled) {
      callback();
    } else {
      this.listeners.push(callback);
    }
  }
  
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error("Operation cancelled");
    }
  }
  
  checkCancellation(): boolean {
    return this.cancelled;
  }
}

import type { Context } from "hono";
import type { RunEvent } from "@skillrunner/shared";

/**
 * Send a single SSE event on the given Response writer.
 * Each event is serialised as JSON in the `data:` field.
 */
export function formatSseEvent(event: RunEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Build the initial SSE headers for a Hono response.
 */
export function sseHeaders(): Record<string, string> {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

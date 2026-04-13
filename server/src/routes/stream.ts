import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { getRunState } from "../store/runs.js";
import type { RunEvent } from "@skillrunner/shared";

export const streamRouter = new Hono();

streamRouter.get("/:id/stream", (c) => {
  const runId = c.req.param("id");
  const state = getRunState(runId);

  if (!state) {
    return c.json({ error: `Run ${runId} not found` }, 404);
  }

  return streamSSE(c, async (stream) => {
    // Replay any events that already arrived before the client connected
    for (const event of state.events) {
      await stream.writeSSE({ data: JSON.stringify(event) });
    }

    // If the run is already terminal, close immediately
    if (state.run.status === "complete" || state.run.status === "error") {
      return;
    }

    // Stream future events as they are emitted
    await new Promise<void>((resolve) => {
      const onEvent = async (event: RunEvent) => {
        await stream.writeSSE({ data: JSON.stringify(event) });

        if (event.type === "run_finish" || event.type === "run_error") {
          state.emitter.off("event", onEvent);
          resolve();
        }
      };

      state.emitter.on("event", onEvent);

      // Clean up if the client disconnects
      stream.onAbort(() => {
        state.emitter.off("event", onEvent);
        resolve();
      });
    });
  });
});

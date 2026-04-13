import { Hono } from "hono";
import { randomUUID } from "crypto";
import { createRun } from "../store/runs.js";
import { startRun } from "../services/runner.js";
import type { ConfirmPipelineRequest, ConfirmPipelineResponse } from "@skillrunner/shared";

export const pipelineRouter = new Hono();

pipelineRouter.post("/run", async (c) => {
  let body: ConfirmPipelineRequest;
  try {
    body = await c.req.json<ConfirmPipelineRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { pipeline, model } = body;
  if (!pipeline?.id || !pipeline.steps?.length) {
    return c.json({ error: "Valid pipeline with steps is required" }, 400);
  }

  const runId = randomUUID();
  createRun(runId, pipeline, model);

  // Fire and forget — SSE route streams progress back to client
  void startRun(runId);

  const response: ConfirmPipelineResponse = { runId };
  return c.json(response);
});

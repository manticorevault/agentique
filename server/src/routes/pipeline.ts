import { Hono } from "hono";
import { randomUUID } from "crypto";
import { createRun } from "../store/runs.js";
import { startRun } from "../services/runner.js";
import { getStepInputSchema } from "../services/skillInputs.js";
import type {
  ConfirmPipelineRequest,
  ConfirmPipelineResponse,
  PipelineInputSchemaRequest,
  PipelineInputSchemaResponse,
  StepInputSchema,
} from "@skillrunner/shared";

export const pipelineRouter = new Hono();

// ── POST /api/pipeline/input-schema ──────────────────────────────────────────
//
// Given a pipeline, fetches SKILL.md for every step and extracts or infers
// the input fields the user must provide. Returns only steps with ≥1 field.

pipelineRouter.post("/input-schema", async (c) => {
  let body: PipelineInputSchemaRequest;
  try {
    body = await c.req.json<PipelineInputSchemaRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { pipeline } = body;
  if (!pipeline?.steps?.length) {
    return c.json({ error: "Pipeline with steps is required" }, 400);
  }

  // Fan out in parallel — one schema fetch per step
  const results = await Promise.allSettled(
    pipeline.steps.map(async (step) => {
      const match = pipeline.matches.find((m) => m.stepId === step.id);
      if (!match || match.skillId === "no-match") return null;

      const fields = await getStepInputSchema(match);
      if (fields.length === 0) return null;

      return {
        stepId: step.id,
        stepName: step.name,
        fields,
      } satisfies StepInputSchema;
    })
  );

  const schemas: StepInputSchema[] = results
    .filter((r): r is PromiseFulfilledResult<StepInputSchema | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((s): s is StepInputSchema => s !== null);

  const response: PipelineInputSchemaResponse = { schemas };
  return c.json(response);
});

// ── POST /api/pipeline/run ────────────────────────────────────────────────────

pipelineRouter.post("/run", async (c) => {
  let body: ConfirmPipelineRequest;
  try {
    body = await c.req.json<ConfirmPipelineRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { pipeline, model, inputs } = body;
  if (!pipeline?.id || !pipeline.steps?.length) {
    return c.json({ error: "Valid pipeline with steps is required" }, 400);
  }

  const runId = randomUUID();
  createRun(runId, pipeline, model, "", inputs);

  // Fire and forget — SSE route streams progress back to client
  void startRun(runId);

  const response: ConfirmPipelineResponse = { runId };
  return c.json(response);
});

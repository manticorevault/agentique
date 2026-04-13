import { Hono } from "hono";
import { decomposeWorkflow } from "../services/openrouter.js";
import { matchSkills } from "../services/skillsmp.js";
import { randomUUID } from "crypto";
import type { DecomposeRequest, DecomposeResponse } from "@skillrunner/shared";

export const workflowRouter = new Hono();

workflowRouter.post("/decompose", async (c) => {
  let body: DecomposeRequest;
  try {
    body = await c.req.json<DecomposeRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { description } = body;
  if (!description?.trim()) {
    return c.json({ error: "description is required" }, 400);
  }

  const steps = await decomposeWorkflow(description.trim());
  const matches = await matchSkills(steps);

  const response: DecomposeResponse = {
    pipeline: {
      id: randomUUID(),
      description: description.trim(),
      steps,
      matches,
    },
  };

  return c.json(response);
});

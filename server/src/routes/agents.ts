import { Hono } from "hono";
import { randomUUID } from "crypto";
import {
  listAgents, getAgent, saveAgent, patchAgent, deleteAgent as removeAgent,
} from "../store/db.js";
import { createRun } from "../store/runs.js";
import { startRun } from "../services/runner.js";
import { DEFAULT_MODEL } from "@skillrunner/shared";
import type {
  Agent, AgentListResponse, CreateAgentRequest, UpdateAgentRequest,
  RunAgentRequest, RunAgentResponse, Pipeline,
} from "@skillrunner/shared";

export const agentsRouter = new Hono();

// List all agents
agentsRouter.get("/", (c) => {
  const response: AgentListResponse = { agents: listAgents() };
  return c.json(response);
});

// Get one agent
agentsRouter.get("/:id", (c) => {
  const agent = getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Not found" }, 404);
  return c.json(agent);
});

// Create agent
agentsRouter.post("/", async (c) => {
  let body: CreateAgentRequest;
  try { body = await c.req.json<CreateAgentRequest>(); }
  catch { return c.json({ error: "Invalid JSON" }, 400); }

  if (!body.name?.trim()) return c.json({ error: "name is required" }, 400);
  if (!body.steps?.length) return c.json({ error: "at least one step is required" }, 400);

  const now = Date.now();
  const agent: Agent = {
    id: randomUUID(),
    name: body.name.trim(),
    description: body.description?.trim() ?? "",
    model: body.model ?? DEFAULT_MODEL,
    steps: body.steps.map((s, i) => ({ ...s, id: s.id || randomUUID(), order: i })),
    createdAt: now,
    updatedAt: now,
  };

  saveAgent(agent);
  return c.json(agent, 201);
});

// Update agent
agentsRouter.put("/:id", async (c) => {
  const existing = getAgent(c.req.param("id"));
  if (!existing) return c.json({ error: "Not found" }, 404);

  let body: UpdateAgentRequest;
  try { body = await c.req.json<UpdateAgentRequest>(); }
  catch { return c.json({ error: "Invalid JSON" }, 400); }

  const updated: Agent = {
    ...existing,
    name: body.name?.trim() ?? existing.name,
    description: body.description?.trim() ?? existing.description,
    model: body.model ?? existing.model,
    steps: body.steps
      ? body.steps.map((s, i) => ({ ...s, id: s.id || randomUUID(), order: i }))
      : existing.steps,
    updatedAt: Date.now(),
  };

  patchAgent(updated);
  return c.json(updated);
});

// Delete agent
agentsRouter.delete("/:id", (c) => {
  const agent = getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Not found" }, 404);
  removeAgent(c.req.param("id"));
  return c.json({ ok: true });
});

// Run agent
agentsRouter.post("/:id/run", async (c) => {
  const agent = getAgent(c.req.param("id"));
  if (!agent) return c.json({ error: "Not found" }, 404);

  let body: RunAgentRequest = {};
  try { body = await c.req.json<RunAgentRequest>(); } catch { /* input is optional */ }

  const pipelineId = randomUUID();
  const pipeline: Pipeline = {
    id: pipelineId,
    description: agent.name,
    steps: agent.steps.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      order: s.order,
      ...(s.model ? { model: s.model } : {}),
    })),
    matches: agent.steps.map((s) => ({
      stepId: s.id,
      skillId: s.skillId,
      skillName: s.skillName,
      skillDescription: s.skillDescription,
      repoUrl: s.repoUrl,
      confidence: 1,
    })),
  };

  const runId = randomUUID();
  const model = body.model ?? agent.model;
  createRun(runId, pipeline, model, body.input ?? "");
  void startRun(runId);

  const response: RunAgentResponse = { runId, pipelineId };
  return c.json(response);
});

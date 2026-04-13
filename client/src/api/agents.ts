import type {
  Agent, AgentListResponse, CreateAgentRequest, UpdateAgentRequest,
  RunAgentRequest, RunAgentResponse, SkillSearchResponse,
} from "@skillrunner/shared";

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export const searchSkills = (q: string) =>
  req<SkillSearchResponse>("GET", `/api/skills/search?q=${encodeURIComponent(q)}`);

export const listAgents = () =>
  req<AgentListResponse>("GET", "/api/agents");

export const createAgent = (body: CreateAgentRequest) =>
  req<Agent>("POST", "/api/agents", body);

export const updateAgent = (id: string, body: UpdateAgentRequest) =>
  req<Agent>("PUT", `/api/agents/${id}`, body);

export const deleteAgent = (id: string) =>
  req<{ ok: boolean }>("DELETE", `/api/agents/${id}`);

export const runAgent = (id: string, body: RunAgentRequest = {}) =>
  req<RunAgentResponse>("POST", `/api/agents/${id}/run`, body);

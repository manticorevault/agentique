import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import type { HistoryEntry, Pipeline, StepRun, RunStatus, Agent, AgentStep } from "@skillrunner/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, "../../../.skillrunner.db");

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id          TEXT    PRIMARY KEY,
    name        TEXT    NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    model       TEXT    NOT NULL,
    steps_json  TEXT    NOT NULL,
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS runs (
    id           TEXT    PRIMARY KEY,
    pipeline_json TEXT   NOT NULL,
    model        TEXT    NOT NULL,
    status       TEXT    NOT NULL,
    steps_json   TEXT    NOT NULL,
    final_output TEXT    NOT NULL DEFAULT '',
    error        TEXT,
    started_at   INTEGER NOT NULL,
    finished_at  INTEGER,
    cost_usd     REAL
  )
`);

// Migration: add cost_usd to existing databases that predate this column
try {
  db.exec("ALTER TABLE runs ADD COLUMN cost_usd REAL");
} catch {
  // Column already exists — safe to ignore
}

interface RunRow {
  id: string;
  pipeline_json: string;
  model: string;
  status: string;
  steps_json: string;
  final_output: string;
  error: string | null;
  started_at: number;
  finished_at: number | null;
  cost_usd: number | null;
}

function rowToEntry(row: RunRow): HistoryEntry {
  return {
    id: row.id,
    pipeline: JSON.parse(row.pipeline_json) as Pipeline,
    model: row.model,
    status: row.status as RunStatus,
    steps: JSON.parse(row.steps_json) as StepRun[],
    finalOutput: row.final_output,
    error: row.error ?? undefined,
    startedAt: row.started_at,
    finishedAt: row.finished_at ?? undefined,
    totalCostUsd: row.cost_usd ?? undefined,
  };
}

const insertRun = db.prepare<RunRow>(`
  INSERT OR REPLACE INTO runs
    (id, pipeline_json, model, status, steps_json, final_output, error, started_at, finished_at, cost_usd)
  VALUES
    (@id, @pipeline_json, @model, @status, @steps_json, @final_output, @error, @started_at, @finished_at, @cost_usd)
`);

export function saveRun(entry: HistoryEntry): void {
  insertRun.run({
    id: entry.id,
    pipeline_json: JSON.stringify(entry.pipeline),
    model: entry.model,
    status: entry.status,
    steps_json: JSON.stringify(entry.steps),
    final_output: entry.finalOutput,
    error: entry.error ?? null,
    started_at: entry.startedAt,
    finished_at: entry.finishedAt ?? null,
    cost_usd: entry.totalCostUsd ?? null,
  });
}

export function getRun(id: string): HistoryEntry | undefined {
  const row = db.prepare<[string], RunRow>("SELECT * FROM runs WHERE id = ?").get(id);
  return row ? rowToEntry(row) : undefined;
}

export function listRuns(limit = 20): HistoryEntry[] {
  const rows = db
    .prepare<[], RunRow>("SELECT * FROM runs ORDER BY started_at DESC LIMIT 20")
    .all();
  return rows.map(rowToEntry);
}

// ─── Agents ──────────────────────────────────────────────────────────────────

interface AgentRow {
  id: string;
  name: string;
  description: string;
  model: string;
  steps_json: string;
  created_at: number;
  updated_at: number;
}

function rowToAgent(row: AgentRow): Agent {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    model: row.model,
    steps: JSON.parse(row.steps_json) as AgentStep[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const insertAgent = db.prepare<AgentRow>(`
  INSERT INTO agents (id, name, description, model, steps_json, created_at, updated_at)
  VALUES (@id, @name, @description, @model, @steps_json, @created_at, @updated_at)
`);

const updateAgent = db.prepare<AgentRow>(`
  UPDATE agents
  SET name=@name, description=@description, model=@model,
      steps_json=@steps_json, updated_at=@updated_at
  WHERE id=@id
`);

export function saveAgent(agent: Agent): void {
  insertAgent.run({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    model: agent.model,
    steps_json: JSON.stringify(agent.steps),
    created_at: agent.createdAt,
    updated_at: agent.updatedAt,
  });
}

export function patchAgent(agent: Agent): void {
  updateAgent.run({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    model: agent.model,
    steps_json: JSON.stringify(agent.steps),
    created_at: agent.createdAt,
    updated_at: agent.updatedAt,
  });
}

export function getAgent(id: string): Agent | undefined {
  const row = db.prepare<[string], AgentRow>("SELECT * FROM agents WHERE id = ?").get(id);
  return row ? rowToAgent(row) : undefined;
}

export function listAgents(): Agent[] {
  return db
    .prepare<[], AgentRow>("SELECT * FROM agents ORDER BY updated_at DESC")
    .all()
    .map(rowToAgent);
}

export function deleteAgent(id: string): void {
  db.prepare("DELETE FROM agents WHERE id = ?").run(id);
}

// ─── Workflow Decomposition ───────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  order: number;
  /** Optional per-step model override. Falls back to run-level model if absent. */
  model?: string;
}

// ─── Skill Matching ───────────────────────────────────────────────────────────

export interface SkillMatch {
  stepId: string;
  skillId: string;
  skillName: string;
  skillDescription: string;
  repoUrl: string;
  confidence: number;
}

// ─── Pipeline (confirmed by user) ─────────────────────────────────────────────

export interface Pipeline {
  id: string;
  description: string;
  steps: WorkflowStep[];
  matches: SkillMatch[];
}

// ─── Run State ────────────────────────────────────────────────────────────────

export type RunStatus = "pending" | "running" | "complete" | "error";
export type StepStatus = "pending" | "running" | "complete" | "error";

export interface StepRun {
  stepId: string;
  stepName: string;
  status: StepStatus;
  output: string;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: RunStatus;
  steps: StepRun[];
  finalOutput?: string;
  error?: string;
}

// ─── SSE Run Events ───────────────────────────────────────────────────────────

export interface RunEventStepStart {
  type: "step_start";
  runId: string;
  stepId: string;
  stepName: string;
  order: number;
  startedAt: number;
}

export interface RunEventStepOutput {
  type: "step_output";
  runId: string;
  stepId: string;
  chunk: string;
}

export interface RunEventStepFinish {
  type: "step_finish";
  runId: string;
  stepId: string;
  output: string;
  finishedAt: number;
}

export interface RunEventStepError {
  type: "step_error";
  runId: string;
  stepId: string;
  error: string;
  finishedAt: number;
}

export interface RunEventRunFinish {
  type: "run_finish";
  runId: string;
  finalOutput: string;
}

export interface RunEventRunError {
  type: "run_error";
  runId: string;
  error: string;
}

export type RunEvent =
  | RunEventStepStart
  | RunEventStepOutput
  | RunEventStepFinish
  | RunEventStepError
  | RunEventRunFinish
  | RunEventRunError;

// ─── Model Selection ─────────────────────────────────────────────────────────

/** A single model option returned by GET /api/models */
export interface ModelOption {
  id: string;             // OpenRouter ID, e.g. "anthropic/claude-haiku-4.5"
  name: string;           // Display name from OpenRouter
  note: string;           // Compact label: "200K ctx · $1/$5 per M"
  contextLength: number;  // Max context tokens
  provider: string;       // First segment of id, e.g. "anthropic"
}

export interface ModelsResponse {
  models: ModelOption[];
}

/** The fallback model ID used when the /api/models list hasn't loaded yet. */
export const DEFAULT_MODEL = "anthropic/claude-haiku-4.5";

/**
 * Convert an OpenRouter model ID to the format opencode expects.
 * opencode uses the verbatim OpenRouter ID prefixed with "openrouter/".
 * e.g. "anthropic/claude-haiku-4.5" → "openrouter/anthropic/claude-haiku-4.5"
 */
export function toOpencodeModelId(openrouterId: string): string {
  return `openrouter/${openrouterId}`;
}

// ─── Skill input fields ───────────────────────────────────────────────────────

export interface InputField {
  id: string;
  label: string;
  type: "text" | "textarea" | "url" | "number";
  placeholder?: string;
  required: boolean;
}

export interface StepInputSchema {
  stepId: string;
  stepName: string;
  fields: InputField[];
}

// ─── API Request/Response shapes ─────────────────────────────────────────────

export interface DecomposeRequest {
  description: string;
}

export interface DecomposeResponse {
  pipeline: Pipeline;
}

export interface ConfirmPipelineRequest {
  pipeline: Pipeline;
  model?: string;
  /** stepId → { fieldLabel → value } collected from the pre-run input form */
  inputs?: Record<string, Record<string, string>>;
}

export interface ConfirmPipelineResponse {
  runId: string;
}

export interface PipelineInputSchemaRequest {
  pipeline: Pipeline;
}

export interface PipelineInputSchemaResponse {
  /** Only steps that have at least one detectable input field are included. */
  schemas: StepInputSchema[];
}

// ─── Skill Browser ───────────────────────────────────────────────────────────

export interface SkillSearchResult {
  id: string;
  name: string;
  author: string;
  description: string;
  githubUrl: string;
  skillUrl: string;
  stars: number;
  score: number;
}

export interface SkillSearchResponse {
  results: SkillSearchResult[];
  query: string;
}

// ─── Agents ──────────────────────────────────────────────────────────────────

export interface AgentStep {
  id: string;
  name: string;
  description: string;
  skillId: string;
  skillName: string;
  skillDescription: string;
  repoUrl: string;
  order: number;
  /** Optional per-step model override. Falls back to agent-level model if absent. */
  model?: string;
  /** Input fields the user must fill in before running this step. */
  inputSchema?: InputField[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  steps: AgentStep[];
  createdAt: number;
  updatedAt: number;
}

export interface CreateAgentRequest {
  name: string;
  description?: string;
  model: string;
  steps: AgentStep[];
}

export interface UpdateAgentRequest {
  name?: string;
  description?: string;
  model?: string;
  steps?: AgentStep[];
}

export interface RunAgentRequest {
  input?: string;
  model?: string;
}

export interface RunAgentResponse {
  runId: string;
  pipelineId: string;
}

export interface AgentListResponse {
  agents: Agent[];
}

// ─── History ──────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  pipeline: Pipeline;
  model: string;
  status: RunStatus;
  steps: StepRun[];
  finalOutput: string;
  error?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface HistoryListResponse {
  runs: HistoryEntry[];
}

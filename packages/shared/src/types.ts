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
  /** Actual token usage reported by opencode/OpenRouter for this step */
  tokens?: { input: number; output: number };
  /** Actual cost in USD for this step */
  costUsd?: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: RunStatus;
  steps: StepRun[];
  finalOutput?: string;
  error?: string;
  totalCostUsd?: number;
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
  tokens?: { input: number; output: number };
  costUsd?: number;
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
  totalCostUsd?: number;
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

// ─── Model pricing ────────────────────────────────────────────────────────────

export interface ModelPrices {
  /** USD per million input tokens */
  input: number;
  /** USD per million output tokens */
  output: number;
}

/** Static price map keyed by OpenRouter model ID. Prices in USD per million tokens. */
export const MODEL_PRICES: Record<string, ModelPrices> = {
  "anthropic/claude-haiku-4.5":                    { input: 1.00,  output: 5.00  },
  "anthropic/claude-sonnet-4.5":                   { input: 3.00,  output: 15.00 },
  "anthropic/claude-sonnet-4.6":                   { input: 3.00,  output: 15.00 },
  "anthropic/claude-opus-4.5":                     { input: 15.00, output: 75.00 },
  "anthropic/claude-opus-4.6":                     { input: 15.00, output: 75.00 },
  "openai/gpt-4.1-nano":                           { input: 0.10,  output: 0.40  },
  "openai/gpt-4.1-mini":                           { input: 0.40,  output: 1.60  },
  "openai/gpt-4.1":                                { input: 2.00,  output: 8.00  },
  "openai/gpt-4o":                                 { input: 2.50,  output: 10.00 },
  "openai/o4-mini":                                { input: 1.10,  output: 4.40  },
  "openai/o3":                                     { input: 10.00, output: 40.00 },
  "google/gemini-2.0-flash-001":                   { input: 0.10,  output: 0.40  },
  "google/gemini-2.5-flash-lite":                  { input: 0.10,  output: 0.40  },
  "google/gemini-2.5-flash":                       { input: 0.30,  output: 2.50  },
  "google/gemini-2.5-pro":                         { input: 1.25,  output: 10.00 },
  "x-ai/grok-3-mini":                              { input: 0.30,  output: 0.50  },
  "x-ai/grok-4":                                   { input: 3.00,  output: 15.00 },
  "meta-llama/llama-4-scout":                      { input: 0.08,  output: 0.30  },
  "meta-llama/llama-4-maverick":                   { input: 0.15,  output: 0.60  },
  "meta-llama/llama-3.3-70b-instruct":             { input: 0.10,  output: 0.32  },
  "mistralai/mistral-small-3.2-24b-instruct":      { input: 0.07,  output: 0.20  },
  "mistralai/mistral-large-2512":                  { input: 0.50,  output: 1.50  },
  "deepseek/deepseek-chat-v3-0324":                { input: 0.20,  output: 0.77  },
  "deepseek/deepseek-r1-0528":                     { input: 0.50,  output: 2.15  },
  "qwen/qwen3-32b":                                { input: 0.07,  output: 0.24  },
  "qwen/qwen3-235b-a22b-2507":                     { input: 0.03,  output: 0.10  },
  "moonshotai/kimi-k2":                            { input: 0.57,  output: 2.30  },
};

/** Fallback for models not in the price map */
export const DEFAULT_PRICES: ModelPrices = { input: 1.00, output: 5.00 };

export function getModelPrices(modelId: string): ModelPrices {
  return MODEL_PRICES[modelId] ?? DEFAULT_PRICES;
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
  /** Actual total cost in USD, from OpenRouter usage data */
  totalCostUsd?: number;
}

export interface HistoryListResponse {
  runs: HistoryEntry[];
}

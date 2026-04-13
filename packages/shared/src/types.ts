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

export interface SupportedModel {
  id: string;
  label: string;
  note: string;
}

export const SUPPORTED_MODELS: SupportedModel[] = [
  // ── Anthropic ──────────────────────────────────────────────────────────────
  { id: "anthropic/claude-haiku-4-5",           label: "Claude Haiku 4.5",         note: "Fast · cheap" },
  { id: "anthropic/claude-3.5-haiku",           label: "Claude 3.5 Haiku",         note: "Fast · cheap" },
  { id: "anthropic/claude-sonnet-4-5",          label: "Claude Sonnet 4.5",        note: "Balanced" },
  { id: "anthropic/claude-3.7-sonnet",          label: "Claude 3.7 Sonnet",        note: "Balanced · thinking" },
  { id: "anthropic/claude-opus-4-5",            label: "Claude Opus 4.5",          note: "Most capable" },
  // ── OpenAI ─────────────────────────────────────────────────────────────────
  { id: "openai/gpt-4o-mini",                   label: "GPT-4o Mini",              note: "Fast · cheap" },
  { id: "openai/gpt-4o",                        label: "GPT-4o",                   note: "Capable" },
  { id: "openai/o3-mini",                       label: "o3-mini",                  note: "Reasoning · fast" },
  { id: "openai/o3",                            label: "o3",                       note: "Reasoning · powerful" },
  { id: "openai/o4-mini",                       label: "o4-mini",                  note: "Reasoning · fast" },
  { id: "openai/gpt-4.1",                       label: "GPT-4.1",                  note: "Latest · capable" },
  { id: "openai/gpt-4.1-mini",                  label: "GPT-4.1 Mini",             note: "Fast · cheap" },
  { id: "openai/gpt-4.1-nano",                  label: "GPT-4.1 Nano",             note: "Fastest · cheapest" },
  // ── Google ─────────────────────────────────────────────────────────────────
  { id: "google/gemini-flash-2.0",              label: "Gemini 2.0 Flash",         note: "Fast · cheap" },
  { id: "google/gemini-2.0-flash-lite-001",     label: "Gemini 2.0 Flash Lite",    note: "Fastest · cheapest" },
  { id: "google/gemini-2.5-flash-preview",      label: "Gemini 2.5 Flash",         note: "Balanced · thinking" },
  { id: "google/gemini-2.5-pro-preview",        label: "Gemini 2.5 Pro",           note: "Most capable" },
  // ── Meta ───────────────────────────────────────────────────────────────────
  { id: "meta-llama/llama-4-scout",             label: "Llama 4 Scout",            note: "Open · fast" },
  { id: "meta-llama/llama-4-maverick",          label: "Llama 4 Maverick",         note: "Open · capable" },
  { id: "meta-llama/llama-3.3-70b-instruct",   label: "Llama 3.3 70B",            note: "Open · balanced" },
  // ── Mistral ────────────────────────────────────────────────────────────────
  { id: "mistralai/mistral-small-3.1-24b-instruct", label: "Mistral Small 3.1",   note: "Open · fast" },
  { id: "mistralai/mistral-medium-3",           label: "Mistral Medium 3",         note: "Balanced" },
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  { id: "deepseek/deepseek-chat-v3-0324",       label: "DeepSeek V3",              note: "Open · capable" },
  { id: "deepseek/deepseek-r1",                 label: "DeepSeek R1",              note: "Open · reasoning" },
];

export const DEFAULT_MODEL = SUPPORTED_MODELS[0].id;

/**
 * Convert an OpenRouter model ID to the format opencode expects.
 * e.g. "anthropic/claude-3-5-haiku-20241022" → "openrouter/anthropic/claude-3.5-haiku"
 *      "anthropic/claude-haiku-4-5"           → "openrouter/anthropic/claude-haiku-4.5"
 */
export function toOpencodeModelId(openrouterId: string): string {
  // Strip 8-digit date suffix (e.g. -20241022)
  let id = openrouterId.replace(/-\d{8}$/, "");
  // Replace single-digit-hyphen-single-digit version separators with dots
  // Handles mid-string (claude-3-5-haiku) and trailing (haiku-4-5)
  id = id.replace(/-(\d)-(\d)(?=[-/]|$)/g, "-$1.$2");
  return `openrouter/${id}`;
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
}

export interface ConfirmPipelineResponse {
  runId: string;
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

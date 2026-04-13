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
  { id: "anthropic/claude-haiku-4.5",             label: "Claude Haiku 4.5",          note: "Fast · $1/$5 per M" },
  { id: "anthropic/claude-sonnet-4.5",            label: "Claude Sonnet 4.5",         note: "Balanced · $3/$15 per M" },
  { id: "anthropic/claude-sonnet-4.6",            label: "Claude Sonnet 4.6",         note: "Latest · 1M ctx · $3/$15 per M" },
  { id: "anthropic/claude-opus-4.5",              label: "Claude Opus 4.5",           note: "Capable · $5/$25 per M" },
  { id: "anthropic/claude-opus-4.6",              label: "Claude Opus 4.6",           note: "Most capable · 1M ctx · $5/$25 per M" },
  // ── OpenAI ─────────────────────────────────────────────────────────────────
  { id: "openai/gpt-4.1-nano",                    label: "GPT-4.1 Nano",              note: "Fastest · $0.10/$0.40 per M" },
  { id: "openai/gpt-4.1-mini",                    label: "GPT-4.1 Mini",              note: "Fast · $0.40/$1.60 per M" },
  { id: "openai/gpt-4.1",                         label: "GPT-4.1",                   note: "Capable · 1M ctx · $2/$8 per M" },
  { id: "openai/gpt-4o",                          label: "GPT-4o",                    note: "Proven · $2.50/$10 per M" },
  { id: "openai/o4-mini",                         label: "o4-mini",                   note: "Reasoning · fast · $3.50/$4.40 per M" },
  { id: "openai/o3",                              label: "o3",                        note: "Strong reasoning · $10/$8 per M" },
  // ── Google ─────────────────────────────────────────────────────────────────
  { id: "google/gemini-2.0-flash-001",            label: "Gemini 2.0 Flash",          note: "Fast · 1M ctx · $0.10/$0.40 per M" },
  { id: "google/gemini-2.5-flash-lite",           label: "Gemini 2.5 Flash Lite",     note: "Fastest 2.5 · 1M ctx · $0.10/$0.40 per M" },
  { id: "google/gemini-2.5-flash",                label: "Gemini 2.5 Flash",          note: "Balanced · 1M ctx · $0.30/$2.50 per M" },
  { id: "google/gemini-2.5-pro",                  label: "Gemini 2.5 Pro",            note: "Most capable · 1M ctx · $1.25/$10 per M" },
  // ── xAI ────────────────────────────────────────────────────────────────────
  { id: "x-ai/grok-3-mini",                       label: "Grok 3 Mini",               note: "Reasoning · $0.30/$0.50 per M" },
  { id: "x-ai/grok-4",                            label: "Grok 4",                    note: "Latest · 256K ctx · $3/$15 per M" },
  // ── Meta ───────────────────────────────────────────────────────────────────
  { id: "meta-llama/llama-4-scout",               label: "Llama 4 Scout",             note: "Open · fast · $0.08/$0.30 per M" },
  { id: "meta-llama/llama-4-maverick",            label: "Llama 4 Maverick",          note: "Open · capable · 1M ctx · $0.15/$0.60 per M" },
  { id: "meta-llama/llama-3.3-70b-instruct",      label: "Llama 3.3 70B",             note: "Open · proven · $0.10/$0.32 per M" },
  // ── Mistral ────────────────────────────────────────────────────────────────
  { id: "mistralai/mistral-small-3.2-24b-instruct", label: "Mistral Small 3.2",       note: "Open · cheap · $0.07/$0.20 per M" },
  { id: "mistralai/mistral-large-2512",            label: "Mistral Large",             note: "Open · capable · $0.50/$1.50 per M" },
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  { id: "deepseek/deepseek-chat-v3-0324",          label: "DeepSeek V3",               note: "Open · capable · $0.20/$0.77 per M" },
  { id: "deepseek/deepseek-r1-0528",               label: "DeepSeek R1 (0528)",        note: "Open · reasoning · $0.50/$2.15 per M" },
  // ── Qwen ───────────────────────────────────────────────────────────────────
  { id: "qwen/qwen3-32b",                          label: "Qwen3 32B",                 note: "Open · balanced · $0.07/$0.24 per M" },
  { id: "qwen/qwen3-235b-a22b-2507",               label: "Qwen3 235B",                note: "Open · huge · $0.03/$0.10 per M" },
  // ── Moonshot ───────────────────────────────────────────────────────────────
  { id: "moonshotai/kimi-k2",                      label: "Kimi K2",                   note: "Long ctx · capable · $0.57/$2.30 per M" },
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

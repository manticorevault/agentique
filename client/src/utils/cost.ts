import { getModelPrices } from "@skillrunner/shared";
import type { Pipeline } from "@skillrunner/shared";

// ─── Token / cost calculation ─────────────────────────────────────────────────

/** Rough chars-to-tokens ratio */
const CHARS_PER_TOKEN = 4;

/** Estimate tokens from a string of text */
export function textTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Compute USD cost from actual token counts */
export function calcCostUsd(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const { input, output } = getModelPrices(modelId);
  return (inputTokens / 1_000_000) * input + (outputTokens / 1_000_000) * output;
}

// ─── Pre-run estimate (PipelineReview) ───────────────────────────────────────

export interface StepEstimate {
  stepId: string;
  stepName: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface PipelineEstimate {
  steps: StepEstimate[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
}

/**
 * Estimate cost for a pipeline before it runs.
 *
 * Per step:
 *   input  = 500 (system overhead) + skill_desc_tokens + 300 (prev-step context)
 *   output = input × 1.5  (rough estimate)
 */
export function estimatePreRunCost(pipeline: Pipeline, modelId: string): PipelineEstimate {
  const steps: StepEstimate[] = pipeline.steps.map((step) => {
    const match = pipeline.matches.find((m) => m.stepId === step.id);
    const skillDescTokens = match ? textTokens(match.skillDescription) : 0;

    const inputTokens = 500 + skillDescTokens + 300;
    const outputTokens = Math.ceil(inputTokens * 1.5);
    const costUsd = calcCostUsd(inputTokens, outputTokens, modelId);

    return { stepId: step.id, stepName: step.name, inputTokens, outputTokens, costUsd };
  });

  const totalInputTokens = steps.reduce((s, r) => s + r.inputTokens, 0);
  const totalOutputTokens = steps.reduce((s, r) => s + r.outputTokens, 0);
  const totalCostUsd = steps.reduce((s, r) => s + r.costUsd, 0);

  return { steps, totalInputTokens, totalOutputTokens, totalCostUsd };
}

// ─── Running / completed cost (Sidebar) ──────────────────────────────────────

/** Estimate tokens from a completed step output (fallback when actuals unavailable) */
export function stepTokens(output: string): number {
  return textTokens(output);
}

/** Estimate cost from output text alone (legacy fallback) */
export function stepCost(output: string, modelId: string): number {
  const outTok = textTokens(output);
  const inTok = Math.ceil(outTok / 1.5); // rough reverse
  return calcCostUsd(inTok, outTok, modelId);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatUsd(usd: number): string {
  if (usd === 0) return "free";
  if (usd < 0.00001) return "<$0.00001";
  if (usd < 0.001) return `~$${usd.toFixed(5)}`;
  if (usd < 0.01)  return `~$${usd.toFixed(4)}`;
  if (usd < 1)     return `~$${usd.toFixed(3)}`;
  return `~$${usd.toFixed(2)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** @deprecated kept for compatibility — use calcCostUsd with actual tokens */
export function estimateCost(
  outputs: string[],
  modelId: string
): { tokens: number; usd: number } {
  const tokens = outputs.reduce((s, o) => s + textTokens(o), 0);
  const usd = stepCost(outputs.join(""), modelId);
  return { tokens, usd };
}

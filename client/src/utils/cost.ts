// Approximate output token prices ($ per 1K tokens) via OpenRouter
const OUTPUT_PRICE_PER_1K: Record<string, number> = {
  "anthropic/claude-3-haiku":          0.00125,
  "anthropic/claude-3.5-sonnet":       0.015,
  "anthropic/claude-3-opus":           0.075,
  "google/gemini-flash-1.5":           0.000075,
  "openai/gpt-4o-mini":                0.0006,
  "openai/gpt-4o":                     0.01,
  "meta-llama/llama-3.1-8b-instruct":  0.0,
};

export function estimateCost(
  outputs: string[],
  model: string
): { tokens: number; usd: number } {
  const totalChars = outputs.reduce((sum, o) => sum + o.length, 0);
  const tokens = Math.round(totalChars / 4);
  const pricePerK = OUTPUT_PRICE_PER_1K[model] ?? 0.001;
  return { tokens, usd: (tokens / 1000) * pricePerK };
}

export function formatUsd(usd: number): string {
  if (usd === 0) return "free tier";
  if (usd < 0.0001) return "<$0.0001";
  return `~$${usd.toFixed(4)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function stepTokens(output: string): number {
  return Math.round(output.length / 4);
}

export function stepCost(output: string, model: string): number {
  const tokens = stepTokens(output);
  const pricePerK = OUTPUT_PRICE_PER_1K[model] ?? 0.001;
  return (tokens / 1000) * pricePerK;
}

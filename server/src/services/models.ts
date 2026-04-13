import { execFile } from "child_process";
import { promisify } from "util";
import { env } from "../env.js";
import type { ModelOption } from "@skillrunner/shared";

const execFileAsync = promisify(execFile);
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ─── opencode allowlist ───────────────────────────────────────────────────────

/**
 * Build a Set of model IDs that opencode can actually run.
 * `opencode models` returns lines like "openrouter/anthropic/claude-haiku-4.5".
 * We strip the leading "openrouter/" to get the bare OpenRouter ID.
 */
async function buildAllowlist(): Promise<Set<string>> {
  try {
    const { stdout } = await execFileAsync("opencode", ["models"], {
      timeout: 10_000,
    });
    const ids = new Set<string>();
    for (const raw of stdout.split("\n")) {
      const line = raw.trim();
      if (line.startsWith("openrouter/")) {
        ids.add(line.slice("openrouter/".length)); // bare OpenRouter ID
      }
    }
    return ids;
  } catch (e) {
    console.warn("[models] Could not query opencode models — allowing all:", e);
    return new Set(); // empty set = allow all
  }
}

let allowlistPromise: Promise<Set<string>> | null = null;

function getallowlist(): Promise<Set<string>> {
  if (!allowlistPromise) {
    allowlistPromise = buildAllowlist();
  }
  return allowlistPromise;
}

// ─── OpenRouter model fetch ───────────────────────────────────────────────────

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/** Format a compact pricing note like "128K ctx · $0.50/$1.50 per M" */
function formatNote(m: OpenRouterModel): string {
  const ctx = m.context_length ? `${Math.round(m.context_length / 1000)}K ctx` : null;
  const promptCost = parseFloat(m.pricing?.prompt ?? "0") * 1e6;
  const completionCost = parseFloat(m.pricing?.completion ?? "0") * 1e6;
  const pricing =
    promptCost > 0 || completionCost > 0
      ? `$${promptCost.toFixed(2)}/$${completionCost.toFixed(2)} per M`
      : null;
  return [ctx, pricing].filter(Boolean).join(" · ");
}

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cachedModels: ModelOption[] | null = null;
let cachedAt = 0;

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getModels(): Promise<ModelOption[]> {
  if (cachedModels && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedModels;
  }

  const [allowlist, res] = await Promise.all([
    getallowlist(),
    fetch(`${OPENROUTER_BASE}/models`, {
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    }),
  ]);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter models API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as OpenRouterModelsResponse;
  const allModels = data.data ?? [];

  const filtered = allowlist.size > 0
    ? allModels.filter((m) => allowlist.has(m.id))
    : allModels;

  const models: ModelOption[] = filtered
    .map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      note: formatNote(m),
      contextLength: m.context_length ?? 0,
      provider: m.id.split("/")[0] ?? "unknown",
    }))
    .sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

  cachedModels = models;
  cachedAt = Date.now();
  return models;
}

/** Invalidate the model cache (e.g. after opencode updates). */
export function invalidateModelsCache(): void {
  cachedModels = null;
  cachedAt = 0;
  allowlistPromise = null;
}

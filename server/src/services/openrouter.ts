import { env } from "../env.js";
import type { WorkflowStep } from "@skillrunner/shared";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DECOMPOSE_MODEL = "anthropic/claude-3-haiku";

const SYSTEM_PROMPT = `You are a workflow decomposer. Given a natural language description of a task or workflow, break it down into a sequence of discrete, named steps.

Return ONLY a valid JSON array of step objects. Each object must have:
- "name": a short (3-6 words) action-oriented step title
- "description": 1-2 sentences describing what this step does

Example:
[
  {"name": "Scrape target URL", "description": "Fetch the HTML content from the given URL and extract the main body text."},
  {"name": "Summarize content", "description": "Use an LLM to produce a concise summary of the extracted text."}
]

Return ONLY the JSON array. No markdown, no explanation.`;

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

async function chatCompletion(
  model: string,
  messages: OpenRouterMessage[]
): Promise<string> {
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/skillrunner",
      "X-Title": "SkillRunner",
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  return data.choices[0]?.message?.content ?? "";
}

export async function decomposeWorkflow(
  description: string
): Promise<WorkflowStep[]> {
  const raw = await chatCompletion(DECOMPOSE_MODEL, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: description },
  ]);

  let parsed: Array<{ name: string; description: string }>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse OpenRouter response as JSON: ${raw}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("OpenRouter response is not a JSON array");
  }

  return parsed.map((step, i) => ({
    id: `step-${i + 1}`,
    name: step.name,
    description: step.description,
    order: i,
  }));
}

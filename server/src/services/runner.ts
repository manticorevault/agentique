import { spawn } from "child_process";
import { writeFile, mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import {
  getRunState,
  emitEvent,
  updateStepStatus,
  updateStepTiming,
  updateStepCost,
} from "../store/runs.js";
import { saveRun } from "../store/db.js";
import { DEFAULT_MODEL, toOpencodeModelId } from "@skillrunner/shared";
import type { WorkflowStep, SkillMatch } from "@skillrunner/shared";
import { fetchSkillMd } from "./skillContent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ARTIFACTS_DIR = resolve(__dirname, "../../../../.artifacts");

// ─── Prompt construction ──────────────────────────────────────────────────────

function buildStepPrompt(
  step: WorkflowStep,
  match: SkillMatch,
  skillContent: string,
  prevOutput: string,
  totalSteps: number,
  userInputs?: Record<string, string>
): string {
  let skillSection: string;

  if (match.skillId === "no-match") {
    skillSection = "No specific skill found — execute this step using your best judgment.";
  } else if (skillContent.trim()) {
    skillSection =
      `Skill: ${match.skillName}\n` +
      `\n--- SKILL.md ---\n${skillContent.trim()}\n--- END SKILL.md ---`;
  } else {
    skillSection =
      `Skill: ${match.skillName} — ${match.skillDescription}` +
      (match.repoUrl ? ` (source: ${match.repoUrl})` : "") + ".";
  }

  const inputSection =
    prevOutput.trim()
      ? `\nInput from previous step:\n${prevOutput.trim()}`
      : "\nThis is the first step — no prior input.";

  // Inject user-provided field values when present
  const userInputSection =
    userInputs && Object.keys(userInputs).length > 0
      ? `\nUser-provided inputs:\n` +
        Object.entries(userInputs)
          .map(([label, value]) => `- ${label}: ${value}`)
          .join("\n")
      : "";

  return (
    `You are an autonomous pipeline agent executing step ${step.order + 1} of ${totalSteps}.\n` +
    `Step name: ${step.name}\n` +
    `Step description: ${step.description}\n` +
    `${skillSection}` +
    inputSection +
    userInputSection +
    `\n\n` +
    `Available tools: bash, read, glob, grep, edit, write, webfetch, task, skill\n` +
    `When the task requires live data from a URL, use the webfetch tool to retrieve it — ` +
    `do NOT reason from training data when a real fetch is possible.\n\n` +
    `CRITICAL RULES — you MUST follow these without exception:\n` +
    `1. NEVER ask for permission, confirmation, or clarification. Proceed immediately.\n` +
    `2. NEVER say "Should I proceed?", "Do you want me to...?", or any similar question.\n` +
    `3. NEVER wait for user input. There is no user — you are running fully autonomously.\n` +
    `4. If something is ambiguous, make a reasonable assumption and continue.\n` +
    `5. If a URL or resource is unavailable, output your best result with what you have.\n` +
    `6. Complete your work and output ONLY the result. No commentary, no headers, no meta-text.`
  );
}

interface OpencodeResult {
  output: string;
  tokens: { input: number; output: number };
  costUsd: number;
}

interface OpencodeEvent {
  type: string;
  part?: {
    text?: string;
    tokens?: { input?: number; output?: number; total?: number };
    cost?: number;
  };
  error?: unknown;
}

/**
 * Run a single opencode step.
 * Streams JSON events from opencode stdout line-by-line.
 * Calls onChunk for each text delta so the caller can emit SSE in real-time.
 * Returns accumulated text output plus actual token usage when the process exits.
 */
function runOpencode(
  prompt: string,
  model: string,
  onChunk: (chunk: string) => void
): Promise<OpencodeResult> {
  return new Promise((resolve, reject) => {
    const opModel = toOpencodeModelId(model);
    const textParts: string[] = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let stderr = "";
    let lineBuffer = "";

    const child = spawn(
      "opencode",
      ["run", "--format", "json", "--model", opModel, prompt],
      { env: { ...process.env }, stdio: ["ignore", "pipe", "pipe"] }
    );

    function processLine(trimmed: string) {
      if (!trimmed) return;
      try {
        const ev = JSON.parse(trimmed) as OpencodeEvent;
        if (ev.type === "text" && ev.part?.text) {
          textParts.push(ev.part.text);
          onChunk(ev.part.text);
        } else if (ev.type === "step_finish" && ev.part?.tokens) {
          // opencode reports per-agent-step token usage — accumulate across all steps
          totalInputTokens += ev.part.tokens.input ?? 0;
          totalOutputTokens += ev.part.tokens.output ?? 0;
          totalCostUsd += ev.part.cost ?? 0;
        } else if (ev.type === "error") {
          reject(new Error(`opencode error: ${JSON.stringify(ev.error)}`));
        }
      } catch {
        // non-JSON line (progress spinner, etc.) — ignore
      }
    }

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (raw: string) => {
      lineBuffer += raw;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) processLine(line.trim());
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => { stderr += chunk; });

    child.on("close", (code) => {
      processLine(lineBuffer.trim()); // flush remainder
      if (code !== 0) {
        reject(new Error(`opencode exited ${code}: ${stderr.slice(0, 300)}`));
      } else {
        resolve({
          output: textParts.join(""),
          tokens: { input: totalInputTokens, output: totalOutputTokens },
          costUsd: totalCostUsd,
        });
      }
    });

    child.on("error", (err) => {
      reject(new Error(`Failed to spawn opencode: ${err.message}`));
    });
  });
}

export async function startRun(runId: string): Promise<void> {
  const state = getRunState(runId);
  if (!state) return;

  const { run, pipeline } = state;
  run.status = "running";

  let prevOutput = state.initialInput;
  let totalCostUsd = 0;

  for (const step of pipeline.steps) {
    const match = pipeline.matches.find((m) => m.stepId === step.id);
    if (!match) {
      const error = `No skill match found for step "${step.name}"`;
      emitEvent(runId, { type: "step_error", runId, stepId: step.id, error, finishedAt: Date.now() });
      run.status = "error";
      run.error = error;
      emitEvent(runId, { type: "run_error", runId, error });
      persist(runId);
      return;
    }

    const stepStartedAt = Date.now();
    updateStepStatus(runId, step.id, "running");
    updateStepTiming(runId, step.id, "startedAt", stepStartedAt);
    emitEvent(runId, {
      type: "step_start",
      runId,
      stepId: step.id,
      stepName: step.name,
      order: step.order,
      startedAt: stepStartedAt,
    });

    const skillContent = await fetchSkillMd(match.repoUrl);
    const userInputs = state.stepInputs?.[step.id];
    const prompt = buildStepPrompt(step, match, skillContent, prevOutput, pipeline.steps.length, userInputs);

    let result: OpencodeResult;
    try {
      result = await runOpencode(
        prompt,
        step.model ?? state.model ?? DEFAULT_MODEL,
        (chunk) => emitEvent(runId, { type: "step_output", runId, stepId: step.id, chunk })
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const finishedAt = Date.now();
      updateStepStatus(runId, step.id, "error");
      updateStepTiming(runId, step.id, "finishedAt", finishedAt);
      emitEvent(runId, { type: "step_error", runId, stepId: step.id, error, finishedAt });
      run.status = "error";
      run.error = error;
      emitEvent(runId, { type: "run_error", runId, error });
      persist(runId);
      return;
    }

    const { output, tokens, costUsd } = result;
    totalCostUsd += costUsd;

    const stepFinishedAt = Date.now();
    updateStepStatus(runId, step.id, "complete", output);
    updateStepTiming(runId, step.id, "finishedAt", stepFinishedAt);
    updateStepCost(runId, step.id, tokens, costUsd);
    emitEvent(runId, { type: "step_finish", runId, stepId: step.id, output, finishedAt: stepFinishedAt, tokens, costUsd });

    prevOutput = output;
  }

  run.status = "complete";
  run.finalOutput = prevOutput;
  run.totalCostUsd = totalCostUsd;
  emitEvent(runId, { type: "run_finish", runId, finalOutput: prevOutput, totalCostUsd });
  persist(runId);

  // Save final output to .artifacts/ so it can be retrieved later (e.g. via Telegram)
  if (prevOutput.trim()) {
    const filename = `agentique-output-${runId.slice(0, 8)}.txt`;
    void mkdir(ARTIFACTS_DIR, { recursive: true })
      .then(() => writeFile(resolve(ARTIFACTS_DIR, filename), prevOutput, "utf8"))
      .catch((err) => console.error("[runner] Failed to save artifact:", err));
  }
}

function persist(runId: string): void {
  const state = getRunState(runId);
  if (!state) return;
  try {
    saveRun({
      id: runId,
      pipeline: state.pipeline,
      model: state.model,
      status: state.run.status,
      steps: state.run.steps,
      finalOutput: state.run.finalOutput ?? "",
      error: state.run.error,
      startedAt: state.startedAt,
      finishedAt: Date.now(),
    });
  } catch (err) {
    console.error("Failed to persist run to SQLite:", err);
  }
}

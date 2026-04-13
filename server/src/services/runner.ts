import { spawn } from "child_process";
import {
  getRunState,
  emitEvent,
  updateStepStatus,
  updateStepTiming,
} from "../store/runs.js";
import { saveRun } from "../store/db.js";
import { DEFAULT_MODEL, toOpencodeModelId } from "@skillrunner/shared";
import type { WorkflowStep, SkillMatch } from "@skillrunner/shared";

// ─── Skill content fetching ───────────────────────────────────────────────────

const skillContentCache = new Map<string, { content: string; cachedAt: number }>();
const SKILL_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch the raw SKILL.md for a skill from its GitHub repo URL.
 * Tries `main` then `master` branch. Returns empty string on failure so the
 * pipeline degrades gracefully rather than aborting.
 */
async function fetchSkillMd(repoUrl: string): Promise<string> {
  if (!repoUrl) return "";

  const cached = skillContentCache.get(repoUrl);
  if (cached && Date.now() - cached.cachedAt < SKILL_CACHE_TTL) {
    return cached.content;
  }

  const match = repoUrl.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (!match) return "";

  const [, owner, repo] = match;

  for (const branch of ["main", "master"]) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/SKILL.md`;
    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
        const content = await res.text();
        skillContentCache.set(repoUrl, { content, cachedAt: Date.now() });
        return content;
      }
    } catch {
      // network error — try next branch
    }
  }

  return "";
}

// ─── Prompt construction ──────────────────────────────────────────────────────

function buildStepPrompt(
  step: WorkflowStep,
  match: SkillMatch,
  skillContent: string,
  prevOutput: string,
  totalSteps: number
): string {
  let skillSection: string;

  if (match.skillId === "no-match") {
    skillSection = "No specific skill found — execute this step using your best judgment.";
  } else if (skillContent.trim()) {
    skillSection =
      `Skill: ${match.skillName}\n` +
      `\n--- SKILL.md ---\n${skillContent.trim()}\n--- END SKILL.md ---`;
  } else {
    // SKILL.md unavailable — fall back to the description we have
    skillSection =
      `Skill: ${match.skillName} — ${match.skillDescription}` +
      (match.repoUrl ? ` (source: ${match.repoUrl})` : "") + ".";
  }

  const inputSection =
    prevOutput.trim()
      ? `\nInput from previous step:\n${prevOutput.trim()}`
      : "\nThis is the first step — no prior input.";

  return (
    `You are an autonomous pipeline agent executing step ${step.order + 1} of ${totalSteps}.\n` +
    `Step name: ${step.name}\n` +
    `Step description: ${step.description}\n` +
    `${skillSection}` +
    inputSection +
    `\n\n` +
    `CRITICAL RULES — you MUST follow these without exception:\n` +
    `1. NEVER ask for permission, confirmation, or clarification. Proceed immediately.\n` +
    `2. NEVER say "Should I proceed?", "Do you want me to...?", or any similar question.\n` +
    `3. NEVER wait for user input. There is no user — you are running fully autonomously.\n` +
    `4. If something is ambiguous, make a reasonable assumption and continue.\n` +
    `5. If a URL or resource is unavailable, output your best result with what you have.\n` +
    `6. Complete your work and output ONLY the result. No commentary, no headers, no meta-text.`
  );
}

/**
 * Run a single opencode step.
 * Streams JSON events from opencode stdout line-by-line.
 * Calls onChunk for each text delta so the caller can emit SSE in real-time.
 * Returns the full accumulated text output when the process exits.
 */
function runOpencode(
  prompt: string,
  model: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const opModel = toOpencodeModelId(model);
    const textParts: string[] = [];
    let stderr = "";
    let lineBuffer = "";

    const child = spawn(
      "opencode",
      ["run", "--format", "json", "--model", opModel, prompt],
      { env: { ...process.env }, stdio: ["ignore", "pipe", "pipe"] }
    );

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (raw: string) => {
      lineBuffer += raw;
      const lines = lineBuffer.split("\n");
      lineBuffer = lines.pop() ?? "";          // keep incomplete trailing line
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const ev = JSON.parse(trimmed) as { type: string; part?: { text?: string }; error?: unknown };
          if (ev.type === "text" && ev.part?.text) {
            textParts.push(ev.part.text);
            onChunk(ev.part.text);
          } else if (ev.type === "error") {
            reject(new Error(`opencode error: ${JSON.stringify(ev.error)}`));
          }
        } catch {
          // non-JSON line (progress spinner, etc.) — ignore
        }
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => { stderr += chunk; });

    child.on("close", (code) => {
      // flush any remaining buffered line
      const last = lineBuffer.trim();
      if (last) {
        try {
          const ev = JSON.parse(last) as { type: string; part?: { text?: string } };
          if (ev.type === "text" && ev.part?.text) {
            textParts.push(ev.part.text);
            onChunk(ev.part.text);
          }
        } catch { /* ignore */ }
      }
      if (code !== 0) {
        reject(new Error(`opencode exited ${code}: ${stderr.slice(0, 300)}`));
      } else {
        resolve(textParts.join(""));
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
    const prompt = buildStepPrompt(step, match, skillContent, prevOutput, pipeline.steps.length);

    let output: string;
    try {
      output = await runOpencode(
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

    const stepFinishedAt = Date.now();
    updateStepStatus(runId, step.id, "complete", output);
    updateStepTiming(runId, step.id, "finishedAt", stepFinishedAt);
    emitEvent(runId, { type: "step_finish", runId, stepId: step.id, output, finishedAt: stepFinishedAt });

    prevOutput = output;
  }

  run.status = "complete";
  run.finalOutput = prevOutput;
  emitEvent(runId, { type: "run_finish", runId, finalOutput: prevOutput });
  persist(runId);
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

import { randomUUID } from "crypto";
import { writeFile, readFile, mkdir, readdir, stat } from "fs/promises";
import { resolve } from "path";
import { env } from "../env.js";
import { decomposeWorkflow } from "./openrouter.js";
import { matchSkills } from "./skillsmp.js";
import { createRun, getRunState } from "../store/runs.js";
import { startRun, ARTIFACTS_DIR } from "./runner.js";
import { DEFAULT_MODEL } from "@skillrunner/shared";
import type { Pipeline, RunEvent } from "@skillrunner/shared";

// ─── Telegram API helpers ─────────────────────────────────────────────────────

const BASE = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

interface TgMessage {
  message_id: number;
  chat: { id: number };
  text?: string;
}

interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

async function tgCall(method: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`[Telegram] ${method} failed:`, text);
  }
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

async function sendMessage(chatId: number, text: string, extra?: Record<string, unknown>) {
  return tgCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });
}

async function getUpdates(offset: number): Promise<TgUpdate[]> {
  const res = (await tgCall("getUpdates", {
    offset,
    timeout: 25,
    allowed_updates: ["message"],
  })) as { result?: TgUpdate[] };
  return res.result ?? [];
}

// ─── Conversation state ───────────────────────────────────────────────────────

interface IdleState   { phase: "idle" }
interface ConfirmingState {
  phase: "confirming";
  pipeline: Pipeline;
  description: string;
}
interface RunningState {
  phase: "running";
  runId: string;
  stepCount: number;
}

type ConvState = IdleState | ConfirmingState | RunningState;

const conversations = new Map<number, ConvState>();
// Stores the last artifact file listing per chat so /send <n> works
const lastFileLists = new Map<number, string[]>();

function getState(chatId: number): ConvState {
  return conversations.get(chatId) ?? { phase: "idle" };
}

function setState(chatId: number, state: ConvState) {
  conversations.set(chatId, state);
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatPipeline(pipeline: Pipeline): string {
  const lines = ["<b>📋 Proposed pipeline</b>\n"];
  for (const step of pipeline.steps) {
    const match = pipeline.matches.find((m) => m.stepId === step.id);
    const skillLine = match && match.skillId !== "no-match"
      ? `\n   🔧 ${match.skillName} (${Math.round(match.confidence * 100)}% match)`
      : "\n   🔧 General execution";
    lines.push(`${step.order + 1}. <b>${step.name}</b>${skillLine}`);
  }
  lines.push(`\nModel: ${DEFAULT_MODEL}`);
  lines.push("\nReply <code>/run</code> to start · <code>/cancel</code> to discard");
  return lines.join("\n");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatCost(usd?: number): string {
  if (!usd) return "";
  if (usd < 0.0001) return " · &lt;$0.0001";
  return ` · $${usd.toFixed(4)}`;
}

// Telegram hard limit for text messages
const TG_MAX_CHARS = 4096;

/** Escape characters that Telegram's HTML parse mode would misinterpret. */
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Send the artifact as a Telegram message if it fits within the character limit.
 * If it's too long, read the file the runner already saved and send it as a document.
 */
async function sendArtifact(chatId: number, output: string, runId: string): Promise<void> {
  if (output.length <= TG_MAX_CHARS) {
    await sendMessage(chatId, escapeHtml(output));
    return;
  }

  // The runner saves every output to .artifacts/ — reuse that file
  const filename = `agentique-output-${runId.slice(0, 8)}.txt`;
  const filePath = resolve(ARTIFACTS_DIR, filename);

  // Give the runner's async write a moment to finish, then read
  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    // File not ready yet — fall back to writing it ourselves
    await mkdir(ARTIFACTS_DIR, { recursive: true });
    await writeFile(filePath, output, "utf8");
    buf = Buffer.from(output, "utf8");
  }

  const form = new FormData();
  form.append("chat_id", String(chatId));
  form.append("caption", `📄 Output too long for a message (${output.length.toLocaleString()} chars) — sending as file.`);
  form.append("document", new Blob([buf], { type: "text/plain" }), filename);

  const res = await fetch(`${BASE()}/sendDocument`, { method: "POST", body: form });
  if (!res.ok) {
    await sendMessage(
      chatId,
      `📄 Output saved to file (${output.length.toLocaleString()} chars):\n<code>${filePath}</code>`
    );
  }
}

// ─── Run progress via EventEmitter ───────────────────────────────────────────

function attachRunListener(chatId: number, runId: string, stepCount: number) {
  const state = getRunState(runId);
  if (!state) return;

  const stepStartedAt = new Map<string, number>();

  state.emitter.on("event", (event: RunEvent) => {
    switch (event.type) {
      case "step_start": {
        stepStartedAt.set(event.stepId, event.startedAt);
        void sendMessage(
          chatId,
          `⚡ Step ${event.order + 1}/${stepCount}: <b>${event.stepName}</b>…`
        );
        break;
      }
      case "step_finish": {
        const start = stepStartedAt.get(event.stepId);
        const dur = start ? ` · ${formatDuration(event.finishedAt - start)}` : "";
        const cost = formatCost(event.costUsd);
        const stepRun = state.run.steps.find((s) => s.stepId === event.stepId);
        const order = state.pipeline.steps.find((s) => s.id === event.stepId)?.order ?? 0;
        void sendMessage(
          chatId,
          `✅ Step ${order + 1}/${stepCount}: <b>${stepRun?.stepName ?? ""}</b>${dur}${cost}`
        );
        break;
      }
      case "step_error": {
        const order = state.pipeline.steps.find((s) => s.id === event.stepId)?.order ?? 0;
        void sendMessage(
          chatId,
          `❌ Step ${order + 1}/${stepCount} failed:\n<code>${event.error.slice(0, 300)}</code>`
        );
        break;
      }
      case "run_finish": {
        const webUrl = `${env.PUBLIC_URL}/run/${runId}`;
        const totalCost = event.totalCostUsd
          ? `💰 Total cost: $${event.totalCostUsd.toFixed(4)}\n`
          : "";
        const output = event.finalOutput?.trim() || "(no output)";

        void (async () => {
          await sendMessage(
            chatId,
            `🎉 <b>Pipeline complete!</b>\n${totalCost}🔗 <a href="${webUrl}">View on web</a>`
          );
          await sendArtifact(chatId, output, runId);
        })();

        setState(chatId, { phase: "idle" });
        break;
      }
      case "run_error": {
        void sendMessage(
          chatId,
          `💥 Pipeline failed:\n<code>${event.error.slice(0, 400)}</code>`
        );
        setState(chatId, { phase: "idle" });
        break;
      }
    }
  });
}

// ─── Message handler ──────────────────────────────────────────────────────────

async function handleMessage(msg: TgMessage) {
  const chatId = msg.chat.id;
  const text = msg.text?.trim() ?? "";
  const state = getState(chatId);

  // Global commands
  if (text === "/start" || text === "/help") {
    return sendMessage(
      chatId,
      `👋 <b>Welcome to Agentique!</b>\n\nDescribe a workflow in plain English and I'll build it.\n\n<b>Examples:</b>\n• <i>Scrape HackerNews and summarise the top 10 stories</i>\n• <i>Research the latest Claude releases and write a tweet thread</i>\n\n<b>Commands:</b>\n/run — confirm a proposed pipeline\n/cancel — discard the current pipeline\n/status — check if a run is in progress\n/artifacts — list saved output files\n/send &lt;n&gt; — send an artifact file by number`
    );
  }

  if (text === "/cancel") {
    setState(chatId, { phase: "idle" });
    return sendMessage(chatId, "🗑 Cancelled. Send me a new workflow description whenever you're ready.");
  }

  if (text === "/status") {
    if (state.phase === "running") {
      const s = getRunState(state.runId);
      const done = s?.run.steps.filter((x) => x.status === "complete").length ?? 0;
      return sendMessage(chatId, `⏳ Run in progress: ${done}/${state.stepCount} steps complete.`);
    }
    if (state.phase === "confirming") {
      return sendMessage(chatId, "⏸ Waiting for your confirmation. Reply /run to start or /cancel to discard.");
    }
    return sendMessage(chatId, "💤 No active run. Send me a workflow description to get started.");
  }

  // List artifact files
  if (text === "/artifacts") {
    try {
      await mkdir(ARTIFACTS_DIR, { recursive: true });
      const files = await readdir(ARTIFACTS_DIR);
      if (files.length === 0) {
        return sendMessage(chatId, "📂 No artifacts yet. Run a pipeline to generate output files.");
      }
      // Gather stats and sort newest first
      const entries = await Promise.all(
        files.map(async (name) => {
          const s = await stat(resolve(ARTIFACTS_DIR, name));
          return { name, size: s.size, mtime: s.mtime };
        })
      );
      entries.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
      lastFileLists.set(chatId, entries.map((e) => e.name));

      const lines = ["<b>📂 Artifacts</b>\n"];
      for (let i = 0; i < entries.length; i++) {
        const { name, size, mtime } = entries[i];
        const kb = (size / 1024).toFixed(1);
        const date = mtime.toISOString().slice(0, 10);
        lines.push(`${i + 1}. <code>${name}</code>\n   ${kb} KB · ${date}`);
      }
      lines.push("\nReply <code>/send &lt;number&gt;</code> to send a file.");
      return sendMessage(chatId, lines.join("\n"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return sendMessage(chatId, `❌ Could not list artifacts:\n<code>${msg.slice(0, 300)}</code>`);
    }
  }

  // Send a specific artifact file
  if (text.startsWith("/send")) {
    const arg = text.slice("/send".length).trim();
    let filename: string | undefined;

    const fileList = lastFileLists.get(chatId);
    const idx = parseInt(arg, 10);
    if (!isNaN(idx) && fileList) {
      filename = fileList[idx - 1];
    } else if (arg) {
      filename = arg;
    }

    if (!filename) {
      return sendMessage(
        chatId,
        "Usage: <code>/send &lt;number&gt;</code> (from /artifacts list) or <code>/send &lt;filename&gt;</code>"
      );
    }

    const filePath = resolve(ARTIFACTS_DIR, filename);
    try {
      const s = await stat(filePath);
      const form = new FormData();
      form.append("chat_id", String(chatId));
      form.append("caption", `📄 <b>${filename}</b>\n${(s.size / 1024).toFixed(1)} KB`);
      const buf = await readFile(filePath);
      form.append("document", new Blob([buf], { type: "text/plain" }), filename);
      const res = await fetch(`${BASE()}/sendDocument`, { method: "POST", body: form });
      if (!res.ok) {
        return sendMessage(chatId, `❌ Failed to send file: ${await res.text()}`);
      }
      return;
    } catch {
      return sendMessage(chatId, `❌ File not found: <code>${filename}</code>\nRun /artifacts to see available files.`);
    }
  }

  // Confirm run
  if (state.phase === "confirming") {
    const confirmWords = ["/run", "yes", "confirm", "go", "start", "run it", "✅", "👍"];
    if (confirmWords.some((w) => text.toLowerCase().includes(w))) {
      const { pipeline, description } = state;
      const runId = randomUUID();
      createRun(runId, pipeline, DEFAULT_MODEL, description);
      setState(chatId, { phase: "running", runId, stepCount: pipeline.steps.length });
      attachRunListener(chatId, runId, pipeline.steps.length);

      await sendMessage(
        chatId,
        `🚀 <b>Starting pipeline</b> — ${pipeline.steps.length} step${pipeline.steps.length !== 1 ? "s" : ""}…`
      );

      // Fire-and-forget, same as the HTTP route
      void startRun(runId).catch((err: Error) => {
        void sendMessage(chatId, `💥 Runner crashed: <code>${err.message.slice(0, 300)}</code>`);
        setState(chatId, { phase: "idle" });
      });

      return;
    }

    // Treat any other message as a new description — discard old pipeline
    setState(chatId, { phase: "idle" });
  }

  // Running — ignore stray messages
  if (state.phase === "running") {
    return sendMessage(chatId, "⏳ A pipeline is already running. Reply /status to check progress or /cancel to stop.");
  }

  // Idle — treat as new workflow description
  if (!text || text.startsWith("/")) {
    return sendMessage(chatId, "Send me a workflow description to get started. Try: <i>Scrape HackerNews and summarise the top 10 stories</i>");
  }

  await sendMessage(chatId, "🔍 Decomposing your workflow…");

  try {
    const steps = await decomposeWorkflow(text);
    const matches = await matchSkills(steps);
    const pipeline: Pipeline = {
      id: randomUUID(),
      description: text,
      steps,
      matches,
    };

    setState(chatId, { phase: "confirming", pipeline, description: text });
    return sendMessage(chatId, formatPipeline(pipeline));
  } catch (err) {
    setState(chatId, { phase: "idle" });
    const msg = err instanceof Error ? err.message : String(err);
    return sendMessage(chatId, `❌ Failed to decompose workflow:\n<code>${msg.slice(0, 300)}</code>`);
  }
}

// ─── Public: handle a single update (used by webhook route) ──────────────────

export async function handleUpdate(update: TgUpdate) {
  if (update.message) {
    await handleMessage(update.message).catch((err) => {
      console.error("[Telegram] handleMessage error:", err);
    });
  }
}

// ─── Public: long polling loop (used when no webhook is configured) ───────────

export function startPolling() {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  console.log("[Telegram] Starting long-poll loop…");

  let offset = 0;

  async function poll() {
    try {
      const updates = await getUpdates(offset);
      for (const update of updates) {
        await handleUpdate(update);
        offset = update.update_id + 1;
      }
    } catch (err) {
      // Network errors are common on long-poll timeout — suppress noise
      if (!(err instanceof Error && err.message.includes("fetch"))) {
        console.error("[Telegram] poll error:", err);
      }
    }
    // Schedule next poll immediately — getUpdates itself blocks for up to 25s
    setTimeout(poll, 100);
  }

  void poll();
}

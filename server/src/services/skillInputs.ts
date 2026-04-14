import { env } from "../env.js";
import type { InputField, SkillMatch } from "@skillrunner/shared";
import { fetchSkillMd } from "./skillContent.js";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const INFER_MODEL = "anthropic/claude-haiku-4.5";

// ─── Markdown parser ──────────────────────────────────────────────────────────

/**
 * Extract the body of the first matching section header from markdown.
 * Returns the text lines between that header and the next same-level header.
 */
function extractSection(content: string, headings: string[]): string {
  const lines = content.split("\n");
  const pattern = /^#{1,3}\s+(.+)$/;
  let inSection = false;
  let depth = 0;
  const body: string[] = [];

  for (const line of lines) {
    const m = line.match(pattern);
    if (m) {
      const level = (line.match(/^#+/) ?? [""])[0].length;
      if (inSection && level <= depth) break;
      if (!inSection && headings.some((h) => m[1].toLowerCase().includes(h.toLowerCase()))) {
        inSection = true;
        depth = level;
        continue;
      }
    }
    if (inSection) body.push(line);
  }

  return body.join("\n").trim();
}

/** Parse a markdown table row: | col | col | … | → string[] */
function parseTableRow(line: string): string[] {
  return line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

/**
 * Try to extract InputFields from a markdown table inside the inputs section.
 *
 * Handles tables where the first row is a header with cols like:
 *   Field / Name / Parameter | Type | Required | Description / Placeholder / Label
 */
function parseTableInputs(section: string): InputField[] | null {
  const lines = section.split("\n").map((l) => l.trim()).filter(Boolean);
  const tableLines = lines.filter((l) => l.startsWith("|") && l.endsWith("|"));
  if (tableLines.length < 2) return null;

  // Find header row (skip separator rows like |---|---|)
  const headerIdx = tableLines.findIndex((l) => !/^[|\s\-:]+$/.test(l));
  if (headerIdx === -1) return null;

  const headers = parseTableRow(tableLines[headerIdx]).map((h) => h.toLowerCase());
  const fieldIdx = headers.findIndex((h) => ["field", "name", "parameter", "id", "key"].includes(h));
  const typeIdx = headers.findIndex((h) => h === "type");
  const reqIdx = headers.findIndex((h) => ["required", "req"].includes(h));
  const descIdx = headers.findIndex((h) => ["description", "desc", "placeholder", "label", "detail"].includes(h));

  if (fieldIdx === -1) return null;

  const dataRows = tableLines.slice(headerIdx + 1).filter((l) => !/^[|\s\-:]+$/.test(l));
  if (dataRows.length === 0) return null;

  const fields: InputField[] = [];
  for (const row of dataRows) {
    const cols = parseTableRow(row);
    const rawId = cols[fieldIdx] ?? "";
    if (!rawId) continue;

    const id = rawId.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const label = rawId.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const rawType = (cols[typeIdx] ?? "text").toLowerCase();
    const type = normaliseType(rawType);
    const rawReq = (cols[reqIdx] ?? "false").toLowerCase();
    const required = ["true", "yes", "required", "1"].includes(rawReq);
    const placeholder = cols[descIdx] ?? "";

    fields.push({ id, label, type, placeholder, required });
  }

  return fields.length > 0 ? fields : null;
}

/**
 * Parse a bulleted list inputs section.
 *
 * Handles patterns like:
 *   - **url** (required): The URL to scrape
 *   - `selector` (optional, text): CSS selector
 *   - url: The URL to fetch
 */
function parseListInputs(section: string): InputField[] | null {
  const lines = section.split("\n").filter((l) => /^\s*[-*]\s/.test(l));
  if (lines.length === 0) return null;

  const fields: InputField[] = [];

  for (const line of lines) {
    // Strip leading bullet
    const text = line.replace(/^\s*[-*]\s+/, "");

    // Pattern: **name** (required, type): description
    // Pattern: `name` (optional): description
    // Pattern: name (required): description
    // Pattern: name: description
    const m = text.match(
      /^[*`]{0,2}([a-zA-Z_][\w-]*)[*`]{0,2}\s*(?:\(([^)]*)\))?\s*:?\s*(.*)/
    );
    if (!m) continue;

    const rawId = m[1];
    const meta = (m[2] ?? "").toLowerCase();
    const description = m[3]?.trim() ?? "";

    const id = rawId.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
    const label = rawId.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const required = meta.includes("required") && !meta.includes("optional");
    const rawType = meta.split(",").find((p) => ["text", "textarea", "url", "number"].includes(p.trim())) ?? "text";
    const type = normaliseType(rawType.trim());
    const placeholder = description.slice(0, 80);

    fields.push({ id, label, type, placeholder, required });
  }

  return fields.length > 0 ? fields : null;
}

/**
 * Parse a YAML-style block. Looks for inline yaml blocks or simple
 * key: value pairs beneath an inputs header.
 *
 * ```yaml
 * inputs:
 *   - id: url
 *     label: Target URL
 *     type: url
 *     required: true
 * ```
 */
function parseYamlInputs(content: string): InputField[] | null {
  // Look for a fenced yaml/yml block
  const yamlBlock = content.match(/```ya?ml\s*([\s\S]*?)```/i);
  const raw = yamlBlock ? yamlBlock[1] : content;

  // Only proceed if it looks like an inputs block
  if (!/inputs\s*:/i.test(raw)) return null;

  const lines = raw.split("\n");
  const fields: InputField[] = [];
  let current: Partial<InputField> | null = null;

  for (const line of lines) {
    // New list item (  - id: ... or  - label: ...)
    if (/^\s+-\s+(id|label)\s*:/.test(line)) {
      if (current?.id) fields.push(finalise(current));
      current = {};
    }
    if (!current) continue;

    const kv = line.match(/^\s+(\w+)\s*:\s*(.+)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    const v = val.trim().replace(/^['"]|['"]$/g, "");

    if (key === "id") current.id = v;
    else if (key === "label") current.label = v;
    else if (key === "type") current.type = normaliseType(v);
    else if (key === "placeholder") current.placeholder = v;
    else if (key === "required") current.required = v === "true" || v === "1" || v === "yes";
  }
  if (current?.id) fields.push(finalise(current));

  return fields.length > 0 ? fields : null;
}

function finalise(partial: Partial<InputField>): InputField {
  const id = partial.id ?? "input";
  return {
    id,
    label: partial.label ?? id.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    type: partial.type ?? "text",
    placeholder: partial.placeholder,
    required: partial.required ?? false,
  };
}

function normaliseType(raw: string): InputField["type"] {
  if (raw.includes("textarea") || raw.includes("long") || raw.includes("multi")) return "textarea";
  if (raw.includes("url") || raw.includes("http") || raw.includes("link")) return "url";
  if (raw.includes("num") || raw.includes("int") || raw.includes("float")) return "number";
  return "text";
}

/**
 * Attempt to extract InputFields from raw SKILL.md content.
 * Returns null when no recognisable inputs section is found.
 */
export function parseSkillInputs(content: string): InputField[] | null {
  if (!content.trim()) return null;

  // 1. YAML block anywhere in the file
  const yaml = parseYamlInputs(content);
  if (yaml) return yaml;

  // 2. Markdown section headed "Inputs", "Parameters", "Arguments", "Options"
  const section = extractSection(content, ["inputs", "parameters", "arguments", "options", "fields"]);
  if (!section) return null;

  // 3. Table inside that section
  const table = parseTableInputs(section);
  if (table) return table;

  // 4. Bulleted list inside that section
  const list = parseListInputs(section);
  if (list) return list;

  return null;
}

// ─── LLM inference ────────────────────────────────────────────────────────────

const INFER_SYSTEM = `You are analyzing a skill's documentation to identify what inputs a user must provide before running it.

Return ONLY a JSON array of 0–3 input fields. Each field:
{
  "id": "snake_case_id",
  "label": "Human-readable label",
  "type": "text" | "textarea" | "url" | "number",
  "placeholder": "Short example or hint (max 60 chars)",
  "required": true | false
}

Rules:
- Only include inputs the user genuinely needs to provide (URLs, topics, names, API endpoints, etc.)
- DO NOT include inputs that are self-evident from context or that the skill derives itself
- Return [] if the skill works without any user-provided input
- Return ONLY the JSON array, no markdown, no explanation`;

async function inferInputsFromLLM(
  skillName: string,
  skillDescription: string,
  skillContent: string
): Promise<InputField[]> {
  const userMsg =
    `Skill: ${skillName}\nDescription: ${skillDescription}\n\n` +
    (skillContent.trim()
      ? `SKILL.md:\n${skillContent.slice(0, 3000)}`
      : "(No SKILL.md available)");

  let raw: string;
  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/skillrunner",
        "X-Title": "SkillRunner",
      },
      body: JSON.stringify({
        model: INFER_MODEL,
        messages: [
          { role: "system", content: INFER_SYSTEM },
          { role: "user", content: userMsg },
        ],
      }),
    });

    if (!res.ok) return [];
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    raw = data.choices[0]?.message?.content ?? "[]";
  } catch {
    return [];
  }

  try {
    // Strip markdown fences if the model wrapped the JSON
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned) as InputField[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 3).map((f) => ({
      id: String(f.id ?? "input"),
      label: String(f.label ?? f.id ?? "Input"),
      type: normaliseType(String(f.type ?? "text")),
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      required: Boolean(f.required),
    }));
  } catch {
    return [];
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getStepInputSchema(match: SkillMatch): Promise<InputField[]> {
  const skillContent = await fetchSkillMd(match.repoUrl);

  // 1. Try structured parsing first (fast, no API call)
  const parsed = parseSkillInputs(skillContent);
  if (parsed) return parsed;

  // 2. Fall back to LLM inference
  return inferInputsFromLLM(match.skillName, match.skillDescription, skillContent);
}

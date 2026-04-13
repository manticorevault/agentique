/**
 * One-shot probe — run with:
 *   npx tsx server/scripts/probe-skillsmp.ts
 * from the repo root. Prints the raw SkillsMP response so we can confirm
 * the actual JSON shape and fix the property mapping in skillsmp.ts.
 */
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") });

const key = process.env.SKILLSMP_API_KEY;
if (!key) {
  console.error("SKILLSMP_API_KEY not set");
  process.exit(1);
}

const query = encodeURIComponent("scrape url fetch html content");
const url = `https://skillsmp.com/api/v1/skills/ai-search?q=${query}&limit=3`;

console.log("GET", url, "\n");

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
});

console.log("Status:", res.status, res.statusText);
console.log("Content-Type:", res.headers.get("content-type"));
console.log("\nBody:");
console.log(JSON.stringify(await res.json(), null, 2));

import { env } from "../env.js";
import type { WorkflowStep, SkillMatch, SkillSearchResult } from "@skillrunner/shared";

const SKILLSMP_BASE = "https://skillsmp.com/api/v1";

// Actual response shape from GET /skills/ai-search
interface SkillsmpSkill {
  id: string;
  name: string;
  author: string;
  description: string;
  githubUrl: string;
  skillUrl: string;
  stars: number;
  updatedAt: string;
}

interface SkillsmpResultItem {
  file_id: string;
  filename: string;
  score: number;
  skill: SkillsmpSkill;
}

interface SkillsmpSearchResponse {
  success: boolean;
  data: {
    data: SkillsmpResultItem[];
    has_more: boolean;
  };
}

function noMatch(stepId: string): SkillMatch {
  return {
    stepId,
    skillId: "no-match",
    skillName: "Generic task execution",
    skillDescription: "No specific skill found — execute the step directly.",
    repoUrl: "",
    confidence: 0,
  };
}

async function fetchSkillMatch(query: string): Promise<SkillsmpResultItem | null> {
  const url = `${SKILLSMP_BASE}/skills/ai-search?q=${encodeURIComponent(query)}`;
  const headers = {
    Authorization: `Bearer ${env.SKILLSMP_API_KEY}`,
    "Content-Type": "application/json",
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = (await res.json()) as SkillsmpSearchResponse;
      return data.data?.data?.[0] ?? null;
    }
    // On first 5xx, wait briefly and retry once; on 4xx or second failure, give up
    if (res.status < 500 || attempt === 1) {
      console.warn(`SkillsMP ${res.status} for query "${query}" — using no-match fallback`);
      return null;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
}

async function searchSkill(step: WorkflowStep): Promise<SkillMatch> {
  // Use only the step name — SkillsMP 500s on long or description-heavy queries.
  const query = step.name.trim().slice(0, 100);
  try {
    const top = await fetchSkillMatch(query);
    if (!top) return noMatch(step.id);
    return {
      stepId: step.id,
      skillId: top.skill.id,
      skillName: top.skill.name,
      skillDescription: top.skill.description,
      repoUrl: top.skill.githubUrl,
      confidence: top.score,
    };
  } catch (err) {
    console.warn(`SkillsMP lookup failed for step "${step.name}":`, err);
    return noMatch(step.id);
  }
}

export async function matchSkills(steps: WorkflowStep[]): Promise<SkillMatch[]> {
  return Promise.all(steps.map(searchSkill));
}

// ─── Featured skills cache ────────────────────────────────────────────────────

const FEATURED_QUERIES = [
  "web scraper",
  "send email",
  "data analysis",
  "web search",
  "generate report",
  "unit tests",
  "api integration",
  "write code",
  "git commit",
  "blog post",
  "social media post",
  "pdf export",
];

let featuredCache: SkillSearchResult[] | null = null;
let featuredCachedAt = 0;
const FEATURED_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getFeaturedSkills(): Promise<SkillSearchResult[]> {
  if (featuredCache && Date.now() - featuredCachedAt < FEATURED_TTL_MS) {
    return featuredCache;
  }

  const settled = await Promise.allSettled(
    FEATURED_QUERIES.map((q) => searchSkills(q, 5))
  );

  const seen = new Set<string>();
  const merged: SkillSearchResult[] = [];

  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const skill of result.value) {
      if (seen.has(skill.id)) continue;
      seen.add(skill.id);
      merged.push(skill);
    }
  }

  // Sort: highest stars first, then by score
  merged.sort((a, b) => b.stars - a.stars || b.score - a.score);

  featuredCache = merged.slice(0, 24);
  featuredCachedAt = Date.now();
  return featuredCache;
}

export async function searchSkills(
  query: string,
  limit = 12
): Promise<SkillSearchResult[]> {
  const url = `${SKILLSMP_BASE}/skills/ai-search?q=${encodeURIComponent(query.slice(0, 120))}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.SKILLSMP_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SkillsMP ${res.status} on GET ${url}: ${body}`);
  }

  const data = (await res.json()) as SkillsmpSearchResponse;
  return (data.data?.data ?? []).slice(0, limit).map((item) => ({
    id: item.skill.id,
    name: item.skill.name,
    author: item.skill.author,
    description: item.skill.description,
    githubUrl: item.skill.githubUrl,
    skillUrl: item.skill.skillUrl,
    stars: item.skill.stars,
    score: item.score,
  }));
}

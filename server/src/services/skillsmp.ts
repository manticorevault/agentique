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

async function searchSkill(step: WorkflowStep): Promise<SkillMatch> {
  const query = encodeURIComponent(`${step.name} ${step.description}`);
  const url = `${SKILLSMP_BASE}/skills/ai-search?q=${query}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.SKILLSMP_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `SkillsMP ${res.status} on GET ${url} (step "${step.name}"): ${body}`
    );
  }

  const data = (await res.json()) as SkillsmpSearchResponse;
  const top = data.data?.data?.[0];

  if (!top) {
    return {
      stepId: step.id,
      skillId: "no-match",
      skillName: "Generic task execution",
      skillDescription: "No specific skill found — execute the step directly.",
      repoUrl: "",
      confidence: 0,
    };
  }

  return {
    stepId: step.id,
    skillId: top.skill.id,
    skillName: top.skill.name,
    skillDescription: top.skill.description,
    repoUrl: top.skill.githubUrl,
    confidence: top.score,
  };
}

export async function matchSkills(steps: WorkflowStep[]): Promise<SkillMatch[]> {
  return Promise.all(steps.map(searchSkill));
}

export async function searchSkills(
  query: string,
  limit = 12
): Promise<SkillSearchResult[]> {
  const url = `${SKILLSMP_BASE}/skills/ai-search?q=${encodeURIComponent(query)}`;

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

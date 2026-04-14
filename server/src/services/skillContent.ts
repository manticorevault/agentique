/**
 * Fetches and caches raw SKILL.md content from a GitHub repo URL.
 * Shared by runner.ts (prompt injection) and the input-schema route (field parsing).
 */

const skillContentCache = new Map<string, { content: string; cachedAt: number }>();
const SKILL_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function fetchSkillMd(repoUrl: string): Promise<string> {
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

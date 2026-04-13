import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock env before the module is imported
vi.mock("../../src/env.js", () => ({
  env: {
    SKILLSMP_API_KEY: "test-key",
    OPENROUTER_API_KEY: "test-key",
    PORT: 3001,
  },
}));

const { matchSkills } = await import("../../src/services/skillsmp.js");

const STEP = {
  id: "step-1",
  name: "Scrape target URL",
  description: "Fetch the HTML content from the given URL.",
  order: 0,
};

// Actual shape returned by the SkillsMP API (confirmed via probe)
const MOCK_SUCCESS_RESPONSE = {
  success: true,
  data: {
    object: "vector_store.search_results.page",
    search_query: "How do I scrape a URL?",
    data: [
      {
        file_id: "abc123",
        filename: "skills/web-scraper.md",
        score: 0.9918,
        skill: {
          id: "owner-repo-skills-web-scraper",
          name: "web-scraper",
          author: "owner",
          description: "Fetch any URL and extract clean content.",
          githubUrl: "https://github.com/owner/repo/tree/main/skills/web-scraper",
          skillUrl: "https://skillsmp.com/skills/owner-repo-skills-web-scraper",
          stars: 5,
          updatedAt: "1770000000",
        },
      },
    ],
    has_more: false,
    next_page: null,
  },
  meta: { requestId: "req-1", responseTimeMs: 300 },
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("matchSkills", () => {
  it("maps the top result to a SkillMatch using the confirmed API shape", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUCCESS_RESPONSE,
    } as Response);

    const [match] = await matchSkills([STEP]);

    expect(match.stepId).toBe("step-1");
    expect(match.skillId).toBe("owner-repo-skills-web-scraper");
    expect(match.skillName).toBe("web-scraper");
    expect(match.repoUrl).toBe(
      "https://github.com/owner/repo/tree/main/skills/web-scraper"
    );
    expect(match.confidence).toBeCloseTo(0.9918);
  });

  it("returns a no-match placeholder when data.data is empty", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { data: [], has_more: false },
      }),
    } as Response);

    const [match] = await matchSkills([STEP]);

    expect(match.skillId).toBe("no-match");
    expect(match.confidence).toBe(0);
  });

  it("throws with URL and status when API returns non-2xx", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    } as Response);

    await expect(matchSkills([STEP])).rejects.toThrow("SkillsMP 401");
    await expect(matchSkills([STEP])).rejects.toThrow(
      "skills/ai-search"
    );
  });

  it("fans out one request per step and returns a match per step", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUCCESS_RESPONSE,
    } as Response);

    const steps = [
      STEP,
      { id: "step-2", name: "Summarise", description: "Summarise the text.", order: 1 },
    ];

    const matches = await matchSkills(steps);

    expect(matches).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(matches[0].stepId).toBe("step-1");
    expect(matches[1].stepId).toBe("step-2");
  });

  it("includes the correct Authorization header", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUCCESS_RESPONSE,
    } as Response);

    await matchSkills([STEP]);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-key");
  });

  it("builds the URL with the encoded query", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => MOCK_SUCCESS_RESPONSE,
    } as Response);

    await matchSkills([STEP]);

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain("/skills/ai-search?q=");
    expect(url).toContain("Scrape");
  });
});

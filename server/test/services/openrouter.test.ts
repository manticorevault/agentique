import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/env.js", () => ({
  env: {
    SKILLSMP_API_KEY: "test-key",
    OPENROUTER_API_KEY: "test-or-key",
    PORT: 3001,
  },
}));

const { decomposeWorkflow } = await import("../../src/services/openrouter.js");

const MOCK_STEPS_JSON = JSON.stringify([
  { name: "Scrape target URL", description: "Fetch the HTML content from the URL." },
  { name: "Summarise content", description: "Produce a concise summary of the text." },
]);

function mockOkResponse(content: string) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content } }],
    }),
  } as Response;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("decomposeWorkflow", () => {
  it("returns WorkflowStep[] with correct fields from a valid JSON response", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOkResponse(MOCK_STEPS_JSON));

    const steps = await decomposeWorkflow("Scrape a URL and summarise it");

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      id: "step-1",
      name: "Scrape target URL",
      description: "Fetch the HTML content from the URL.",
      order: 0,
    });
    expect(steps[1]).toMatchObject({
      id: "step-2",
      order: 1,
    });
  });

  it("throws when OpenRouter returns a non-2xx status", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limited",
    } as Response);

    await expect(decomposeWorkflow("anything")).rejects.toThrow("OpenRouter error 429");
  });

  it("throws when the model returns invalid JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOkResponse("Sorry, I can't do that."));

    await expect(decomposeWorkflow("anything")).rejects.toThrow(
      "Failed to parse OpenRouter response as JSON"
    );
  });

  it("throws when the model returns a non-array JSON value", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockOkResponse(JSON.stringify({ steps: [] }))
    );

    await expect(decomposeWorkflow("anything")).rejects.toThrow(
      "OpenRouter response is not a JSON array"
    );
  });

  it("sends the OpenRouter API key in the Authorization header", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOkResponse(MOCK_STEPS_JSON));

    await decomposeWorkflow("anything");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-or-key");
  });

  it("sends a POST to the OpenRouter chat completions endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(mockOkResponse(MOCK_STEPS_JSON));

    await decomposeWorkflow("anything");

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain("openrouter.ai");
    expect(url).toContain("chat/completions");
    expect(init?.method).toBe("POST");
  });
});

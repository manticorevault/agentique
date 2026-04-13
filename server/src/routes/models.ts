import { Hono } from "hono";
import { getModels } from "../services/models.js";
import type { ModelsResponse } from "@skillrunner/shared";

export const modelsRouter = new Hono();

/** GET /api/models — returns all models runnable by opencode via OpenRouter */
modelsRouter.get("/", async (c) => {
  try {
    const models = await getModels();
    return c.json({ models } satisfies ModelsResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[models] Failed to fetch models:", message);
    return c.json({ error: message }, 502);
  }
});

import { Hono } from "hono";
import { handleUpdate } from "../services/telegram.js";

export const telegramRouter = new Hono();

/**
 * POST /api/telegram/webhook
 *
 * Register this URL with Telegram via:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://yourserver.com/api/telegram/webhook
 *
 * For local development, long polling is used instead (started automatically).
 */
telegramRouter.post("/webhook", async (c) => {
  const update = await c.req.json();
  // Respond immediately — handle the update in the background
  void handleUpdate(update);
  return c.json({ ok: true });
});

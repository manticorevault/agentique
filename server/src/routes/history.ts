import { Hono } from "hono";
import { getRun, listRuns } from "../store/db.js";
import type { HistoryListResponse } from "@skillrunner/shared";

export const historyRouter = new Hono();

historyRouter.get("/", (c) => {
  const limitParam = c.req.query("limit");
  const runs = listRuns(limitParam ? Math.min(parseInt(limitParam, 10), 200) : 20);
  const response: HistoryListResponse = { runs };
  return c.json(response);
});

historyRouter.get("/:id", (c) => {
  const id = c.req.param("id");
  const run = getRun(id);
  if (!run) return c.json({ error: `Run ${id} not found` }, 404);
  return c.json(run);
});

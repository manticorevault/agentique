import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { env } from "./env.js";
import { workflowRouter } from "./routes/workflow.js";
import { pipelineRouter } from "./routes/pipeline.js";
import { streamRouter } from "./routes/stream.js";
import { historyRouter } from "./routes/history.js";
import { skillsRouter } from "./routes/skills.js";
import { agentsRouter } from "./routes/agents.js";

const app = new Hono();

app.get("/healthz", (c) => c.json({ ok: true }));
app.route("/api/workflow", workflowRouter);
app.route("/api/pipeline", pipelineRouter);
app.route("/api/pipeline", streamRouter);
app.route("/api/runs", historyRouter);
app.route("/api/skills", skillsRouter);
app.route("/api/agents", agentsRouter);

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Server running on http://localhost:${info.port}`);
});

export default app;

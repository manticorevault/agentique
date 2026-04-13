import { Hono } from "hono";
import { searchSkills, getFeaturedSkills } from "../services/skillsmp.js";
import type { SkillSearchResponse } from "@skillrunner/shared";

export const skillsRouter = new Hono();

skillsRouter.get("/featured", async (c) => {
  const results = await getFeaturedSkills();
  const response: SkillSearchResponse = { results, query: "" };
  return c.json(response);
});

skillsRouter.get("/search", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q) return c.json({ error: "q is required" }, 400);

  const results = await searchSkills(q);
  const response: SkillSearchResponse = { results, query: q };
  return c.json(response);
});

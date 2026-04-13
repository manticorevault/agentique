# SkillRunner — Workflow Compiler

## What this is
A standalone web app that takes a natural language workflow description,
matches each step to a skill from SkillsMP, spawns one OpenCode agent
per step (each preloaded with its matched skill), chains outputs between
steps, and produces a single final artifact. No org charts, no persistent
agent identities, no setup overhead.

## Stack
- Server: Node.js + TypeScript + Hono
- Client: React + Vite (plain CSS, no component library)
- Agent runtime: OpenCode (spawned as child process via `opencode serve`)
- Skill discovery: SkillsMP REST API (https://skillsmp.com/api/v1)
- LLM for workflow parsing: OpenRouter (OpenAI-compatible API)

## Core architecture
1. User describes a workflow in plain English
2. Server calls OpenRouter to decompose it into named steps
3. For each step, server calls SkillsMP ai-search to find the best skill
4. User reviews and confirms the proposed pipeline
5. Server spawns one OpenCode instance per step in sequence
6. Each agent is preloaded with its matched skill and receives the
   previous step's output as context
7. Final step's output is returned as a downloadable artifact

## Key decisions
- OpenCode is the embedded open-source agent runtime — not Claude Code
- OpenRouter is used for both workflow parsing and agent execution (BYOK)
- SkillsMP provides skill discovery — skills themselves live on GitHub
- Cheaper models (Haiku, Flash) should be used for skill-execution steps
- More capable models only for workflow parsing and complex synthesis
- All data stays local except API calls to SkillsMP and OpenRouter
- No authentication, no database (SQLite only if persistence is needed)
- No Docker required to run

## Environment variables
SKILLSMP_API_KEY=     # from skillsmp.com/docs/api
OPENROUTER_API_KEY=   # from openrouter.ai
PORT=3001

## What NOT to do
- No PostgreSQL — SQLite only if needed
- No Paperclip-style org charts or persistent agent roles
- No authentication layer in v1
- No CSS framework or UI component library
- No sudo npm install
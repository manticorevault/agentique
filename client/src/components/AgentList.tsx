import { useEffect, useState } from "react";
import type { Agent } from "@skillrunner/shared";
import { SUPPORTED_MODELS } from "@skillrunner/shared";
import { listAgents, deleteAgent, runAgent } from "../api/agents.js";

interface Props {
  onEdit: (agent: Agent) => void;
  onRunStarted: (runId: string, agent: Agent) => void;
  onNew: () => void;
}

function RunModal({
  agent,
  onRun,
  onClose,
}: {
  agent: Agent;
  onRun: (input: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Run "{agent.name}"</h3>
        <p className="modal-meta">
          {agent.steps.length} steps ·{" "}
          {SUPPORTED_MODELS.find((m) => m.id === agent.model)?.label ?? agent.model}
        </p>
        <label className="modal-label">Initial input <span>(optional)</span></label>
        <textarea
          rows={3}
          placeholder="Provide context or a URL for the first step…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button onClick={() => onRun(input)}>Run agent</button>
        </div>
      </div>
    </div>
  );
}

export function AgentList({ onEdit, onRunStarted, onNew }: Props) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState<Agent | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const data = await listAgents();
      setAgents(data.agents);
    } catch {
      setError("Failed to load agents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function handleDelete(agent: Agent) {
    if (!confirm(`Delete agent "${agent.name}"?`)) return;
    try {
      await deleteAgent(agent.id);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
    } catch {
      setError("Delete failed.");
    }
  }

  async function handleRun(agent: Agent, input: string) {
    setRunningAgent(null);
    try {
      const { runId } = await runAgent(agent.id, { input });
      onRunStarted(runId, agent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed.");
    }
  }

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <h2>Agents</h2>
        <button onClick={onNew}>+ New agent</button>
      </div>

      {error && <p className="global-error">{error}</p>}
      {loading && <p className="sidebar-note">Loading…</p>}

      {!loading && agents.length === 0 && (
        <div className="agent-empty">
          <p>No agents yet.</p>
          <p className="sidebar-note">
            Create a reusable workflow by combining skills into named steps.
          </p>
          <button onClick={onNew} style={{ marginTop: "1rem" }}>Create your first agent</button>
        </div>
      )}

      <ul className="agent-cards">
        {agents.map((agent) => {
          const modelLabel = SUPPORTED_MODELS.find((m) => m.id === agent.model)?.label ?? agent.model;
          return (
            <li key={agent.id} className="agent-card">
              <div className="agent-card-body">
                <div className="agent-card-name">{agent.name}</div>
                {agent.description && (
                  <p className="agent-card-desc">{agent.description}</p>
                )}
                <div className="agent-card-meta">
                  <span>{agent.steps.length} step{agent.steps.length !== 1 ? "s" : ""}</span>
                  <span>{modelLabel}</span>
                </div>
                <ol className="agent-card-steps">
                  {agent.steps.map((s) => (
                    <li key={s.id}>
                      <span className="agent-card-step-name">{s.name}</span>
                      {s.skillId !== "no-match" && s.skillName && (
                        <span className="skill-badge">{s.skillName}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="agent-card-actions">
                <button onClick={() => setRunningAgent(agent)}>Run</button>
                <button className="btn-secondary" onClick={() => onEdit(agent)}>Edit</button>
                <button
                  className="btn-secondary btn-danger"
                  onClick={() => void handleDelete(agent)}
                >Delete</button>
              </div>
            </li>
          );
        })}
      </ul>

      {runningAgent && (
        <RunModal
          agent={runningAgent}
          onRun={(input) => void handleRun(runningAgent, input)}
          onClose={() => setRunningAgent(null)}
        />
      )}
    </div>
  );
}

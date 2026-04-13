import { useState } from "react";
import { randomUUID } from "../utils/uuid.js";
import type { Agent, AgentStep, SkillSearchResult } from "@skillrunner/shared";
import { SUPPORTED_MODELS, DEFAULT_MODEL } from "@skillrunner/shared";
import { createAgent, updateAgent } from "../api/agents.js";
import { SkillBrowser } from "./SkillBrowser.js";

interface Props {
  existing?: Agent;
  onSaved: (agent: Agent) => void;
  onCancel: () => void;
}

function emptyStep(order: number): AgentStep {
  return {
    id: randomUUID(),
    name: "",
    description: "",
    skillId: "no-match",
    skillName: "",
    skillDescription: "",
    repoUrl: "",
    order,
  };
}

export function AgentBuilder({ existing, onSaved, onCancel }: Props) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [model, setModel] = useState(existing?.model ?? DEFAULT_MODEL);
  const [steps, setSteps] = useState<AgentStep[]>(
    existing?.steps.length ? existing.steps : [emptyStep(0)]
  );
  const [pickerForStep, setPickerForStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateStep(index: number, patch: Partial<AgentStep>) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, emptyStep(prev.length)]);
  }

  function removeStep(index: number) {
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i }))
    );
  }

  function moveStep(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= steps.length) return;
    setSteps((prev) => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  }

  function applySkill(index: number, skill: SkillSearchResult) {
    updateStep(index, {
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
      repoUrl: skill.githubUrl,
      // Pre-fill step name/description from skill if still blank
      name: steps[index].name || skill.name,
      description: steps[index].description || skill.description,
    });
    setPickerForStep(null);
  }

  async function handleSave() {
    if (!name.trim()) { setError("Agent name is required."); return; }
    if (steps.some((s) => !s.name.trim())) {
      setError("All steps need a name."); return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { name: name.trim(), description, model, steps };
      const saved = existing
        ? await updateAgent(existing.id, payload)
        : await createAgent(payload);
      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="agent-builder">
      <div className="agent-builder-header">
        <h2>{existing ? "Edit agent" : "New agent"}</h2>
      </div>

      {error && <p className="global-error">{error}</p>}

      <div className="agent-meta">
        <input
          className="agent-name-input"
          placeholder="Agent name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="agent-desc-input"
          rows={2}
          placeholder="What does this agent do? (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="model-selector" style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="agent-model">Default model</label>
        <select
          id="agent-model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        >
          {SUPPORTED_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
          ))}
        </select>
      </div>

      <h3 className="steps-heading">Steps</h3>

      <ol className="agent-steps-list">
        {steps.map((step, i) => (
          <li key={step.id} className="agent-step-item">
            <div className="agent-step-controls">
              <div className="agent-step-reorder">
                <button
                  className="btn-icon"
                  title="Move up"
                  disabled={i === 0}
                  onClick={() => moveStep(i, -1)}
                >↑</button>
                <button
                  className="btn-icon"
                  title="Move down"
                  disabled={i === steps.length - 1}
                  onClick={() => moveStep(i, 1)}
                >↓</button>
              </div>

              <div className="agent-step-fields">
                <input
                  className="agent-step-name"
                  placeholder={`Step ${i + 1} name`}
                  value={step.name}
                  onChange={(e) => updateStep(i, { name: e.target.value })}
                />
                <input
                  className="agent-step-desc"
                  placeholder="What should this step do?"
                  value={step.description}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                />

                {step.skillId !== "no-match" && step.skillName ? (
                  <div className="agent-step-skill">
                    <span className="skill-badge">
                      {step.repoUrl ? (
                        <a href={step.repoUrl} target="_blank" rel="noreferrer">{step.skillName}</a>
                      ) : step.skillName}
                    </span>
                    <button
                      className="btn-icon"
                      onClick={() => updateStep(i, { skillId: "no-match", skillName: "", repoUrl: "" })}
                    >Remove skill</button>
                    <button
                      className="btn-icon"
                      onClick={() => setPickerForStep(pickerForStep === i ? null : i)}
                    >Change</button>
                  </div>
                ) : (
                  <button
                    className="btn-icon btn-icon-primary"
                    onClick={() => setPickerForStep(pickerForStep === i ? null : i)}
                  >
                    {pickerForStep === i ? "Close picker" : "Search skill…"}
                  </button>
                )}

                {pickerForStep === i && (
                  <div className="inline-picker">
                    <SkillBrowser onSelect={(skill) => applySkill(i, skill)} />
                  </div>
                )}

                <div className="agent-step-model">
                  <select
                    value={step.model ?? ""}
                    onChange={(e) => updateStep(i, { model: e.target.value || undefined })}
                    title="Model for this step (leave as Default to inherit the agent model)"
                  >
                    <option value="">Default ({SUPPORTED_MODELS.find((m) => m.id === model)?.label ?? model})</option>
                    {SUPPORTED_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>{m.label} — {m.note}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="btn-icon step-remove"
                title="Remove step"
                disabled={steps.length === 1}
                onClick={() => removeStep(i)}
              >✕</button>
            </div>
          </li>
        ))}
      </ol>

      <button className="btn-secondary" onClick={addStep} style={{ marginTop: "0.75rem" }}>
        + Add step
      </button>

      <div className="agent-builder-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving…" : existing ? "Save changes" : "Create agent"}
        </button>
      </div>
    </div>
  );
}

import type { Pipeline } from "@skillrunner/shared";
import { SUPPORTED_MODELS } from "@skillrunner/shared";
import { useFadeInList } from "../hooks/useFadeInList.js";

interface Props {
  pipeline: Pipeline;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export function PipelineReview({
  pipeline,
  selectedModel,
  onModelChange,
  onConfirm,
  onBack,
  loading,
}: Props) {
  const stepsRef = useFadeInList<HTMLOListElement>(80);
  return (
    <div className="pipeline-review">
      <h2>Proposed pipeline</h2>
      <p className="workflow-description">"{pipeline.description}"</p>

      <ol className="steps-list" ref={stepsRef}>
        {pipeline.steps.map((step) => {
          const match = pipeline.matches.find((m) => m.stepId === step.id);
          return (
            <li key={step.id} className="step-item">
              <div className="step-header">
                <span className="step-name">{step.name}</span>
                {match && match.skillId !== "no-match" && (
                  <span className="skill-badge">
                    {match.repoUrl ? (
                      <a href={match.repoUrl} target="_blank" rel="noreferrer">
                        {match.skillName}
                      </a>
                    ) : (
                      match.skillName
                    )}
                  </span>
                )}
              </div>
              <p className="step-description">{step.description}</p>
            </li>
          );
        })}
      </ol>

      <div className="model-selector">
        <label htmlFor="model-select">Model for all steps</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={loading}
        >
          {SUPPORTED_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} — {m.note}
            </option>
          ))}
        </select>
      </div>

      <div className="review-actions">
        <button className="btn-secondary" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button onClick={onConfirm} disabled={loading}>
          {loading ? "Starting…" : "Run pipeline"}
        </button>
      </div>
    </div>
  );
}

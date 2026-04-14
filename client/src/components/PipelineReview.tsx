import type { Pipeline } from "@skillrunner/shared";
import { useFadeInList } from "../hooks/useFadeInList.js";
import { useModels } from "../hooks/useModels.js";
import { estimatePreRunCost, formatUsd } from "../utils/cost.js";

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
  const { grouped, loading: modelsLoading } = useModels();
  const estimate = estimatePreRunCost(pipeline, selectedModel);

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

      {/* ── Cost estimate ───────────────────────────────── */}
      <div className="pre-run-estimate">
        <table className="estimate-table">
          <tbody>
            {estimate.steps.map((s, i) => (
              <tr key={s.stepId}>
                <td className="est-step">Step {i + 1} — {s.stepName}</td>
                <td className="est-tokens">~{s.inputTokens.toLocaleString()} in / {s.outputTokens.toLocaleString()} out tok</td>
                <td className="est-usd">{formatUsd(s.costUsd)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="est-step est-total">Estimated total</td>
              <td className="est-tokens est-total">~{estimate.totalInputTokens.toLocaleString()} / {estimate.totalOutputTokens.toLocaleString()} tok</td>
              <td className="est-usd est-total">{formatUsd(estimate.totalCostUsd)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="estimate-note">Rough estimate · actual cost depends on skill content length and model output</p>
      </div>

      <div className="model-selector">
        <label htmlFor="model-select">Model for all steps</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={loading || modelsLoading}
        >
          {modelsLoading ? (
            <option value="">Loading models…</option>
          ) : (
            grouped.map(({ provider, models }) => (
              <optgroup key={provider} label={provider}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.note ? ` — ${m.note}` : ""}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </div>

      <div className="review-actions">
        <button className="btn-secondary" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button onClick={onConfirm} disabled={loading || modelsLoading}>
          {loading ? "Starting…" : "Run pipeline"}
        </button>
      </div>
    </div>
  );
}

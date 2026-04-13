import { useState } from "react";
import type { Pipeline, StepRun, RunStatus } from "@skillrunner/shared";
import { SUPPORTED_MODELS } from "@skillrunner/shared";
import { estimateCost, formatUsd, formatDuration, stepTokens, stepCost } from "../utils/cost.js";

interface Props {
  runId: string;
  pipeline: Pipeline;
  steps: StepRun[];
  finalOutput: string;
  status: RunStatus;
  model: string;
  startedAt: number;
  finishedAt: number | null;
  onRerun: () => void;
  onClose: () => void;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPipelineJson(pipeline: Pipeline) {
  downloadText(JSON.stringify(pipeline, null, 2), `pipeline-${pipeline.id.slice(0, 8)}.json`);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handle() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button className="btn-icon" onClick={handle}>
      {copied ? "Copied!" : label}
    </button>
  );
}

export function Sidebar({
  runId,
  pipeline,
  steps,
  finalOutput,
  status,
  model,
  startedAt,
  finishedAt,
  onRerun,
  onClose,
}: Props) {
  const modelLabel = SUPPORTED_MODELS.find((m) => m.id === model)?.label ?? model;
  const duration = finishedAt != null ? formatDuration(finishedAt - startedAt) : null;
  const stepsWithOutput = steps.filter((s) => s.output.trim());
  const { tokens: totalTokens, usd: totalUsd } = estimateCost(
    stepsWithOutput.map((s) => s.output),
    model
  );
  const shareUrl = `${window.location.origin}/run/${runId}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Run details</span>
        <button className="sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>
      </div>

      {/* ── Run info ─────────────────────────────── */}
      <section className="sidebar-section">
        <h4>Run info</h4>
        <dl className="info-grid">
          <dt>Model</dt>   <dd>{modelLabel}</dd>
          <dt>Steps</dt>   <dd>{pipeline.steps.length}</dd>
          <dt>Status</dt>
          <dd className={`info-status ${status}`}>
            {status === "complete" ? "Complete" : status === "error" ? "Failed" : "Running"}
          </dd>
          {duration && <><dt>Duration</dt><dd>{duration}</dd></>}
        </dl>
      </section>

      {/* ── Cost estimate ────────────────────────── */}
      {stepsWithOutput.length > 0 && (
        <section className="sidebar-section">
          <h4>Cost estimate</h4>
          <table className="cost-table">
            <tbody>
              {stepsWithOutput.map((step, i) => (
                <tr key={step.stepId}>
                  <td className="cost-step">Step {i + 1}</td>
                  <td className="cost-tokens">~{stepTokens(step.output).toLocaleString()} tok</td>
                  <td className="cost-usd">{formatUsd(stepCost(step.output, model))}</td>
                  {step.startedAt && step.finishedAt && (
                    <td className="cost-dur">{formatDuration(step.finishedAt - step.startedAt)}</td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="cost-step cost-total">Total</td>
                <td className="cost-tokens cost-total">~{totalTokens.toLocaleString()} tok</td>
                <td className="cost-usd cost-total">{formatUsd(totalUsd)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
          <p className="sidebar-note">Output tokens only · input not counted</p>
        </section>
      )}

      {/* ── Artifacts ────────────────────────────── */}
      <section className="sidebar-section">
        <h4>Artifacts</h4>
        {finalOutput.trim() ? (
          <div className="artifact-row artifact-final">
            <div className="artifact-label">Final output</div>
            <div className="artifact-actions">
              <CopyButton text={finalOutput} />
              <button
                className="btn-icon btn-icon-primary"
                onClick={() => downloadText(finalOutput, `output-final-${Date.now()}.txt`)}
              >
                Download
              </button>
            </div>
          </div>
        ) : (
          <p className="sidebar-note">Final output not yet available.</p>
        )}
        {stepsWithOutput.length > 0 && (
          <div className="artifact-step-list">
            {stepsWithOutput.map((step, i) => (
              <div key={step.stepId} className="artifact-row">
                <div className="artifact-label">Step {i + 1} — {step.stepName}</div>
                <div className="artifact-actions">
                  <CopyButton text={step.output} />
                  <button
                    className="btn-icon"
                    onClick={() => downloadText(step.output, `output-step-${i + 1}-${Date.now()}.txt`)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Skills used ──────────────────────────── */}
      <section className="sidebar-section">
        <h4>Skills used</h4>
        <ul className="skills-list">
          {pipeline.steps.map((step) => {
            const match = pipeline.matches.find((m) => m.stepId === step.id);
            if (!match || match.skillId === "no-match") {
              return (
                <li key={step.id} className="skill-row">
                  <span className="skill-row-step">{step.name}</span>
                  <span className="skill-row-name muted">No skill matched</span>
                </li>
              );
            }
            return (
              <li key={step.id} className="skill-row">
                <span className="skill-row-step">{step.name}</span>
                <div className="skill-row-detail">
                  {match.repoUrl ? (
                    <a href={match.repoUrl} target="_blank" rel="noreferrer">{match.skillName}</a>
                  ) : (
                    <span>{match.skillName}</span>
                  )}
                  <span className="skill-confidence">{Math.round(match.confidence * 100)}% match</span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Actions ──────────────────────────────── */}
      <section className="sidebar-section sidebar-actions">
        <CopyButton text={shareUrl} label="Copy share link" />
        <button className="btn-secondary btn-full" onClick={onRerun}>Re-run pipeline</button>
        <button className="btn-secondary btn-full" onClick={() => exportPipelineJson(pipeline)}>
          Export pipeline JSON
        </button>
      </section>
    </aside>
  );
}

import { useEffect, useState } from "react";
import type { HistoryEntry } from "@skillrunner/shared";
import { SUPPORTED_MODELS } from "@skillrunner/shared";
import { formatDuration } from "../utils/cost.js";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn-icon"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ArtifactCard({ run, onReplay }: { run: HistoryEntry; onReplay: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const modelLabel = SUPPORTED_MODELS.find((m) => m.id === run.model)?.label ?? run.model;
  const duration =
    run.finishedAt != null ? formatDuration(run.finishedAt - run.startedAt) : null;
  const stepsWithOutput = run.steps.filter((s) => s.output.trim());

  return (
    <div className={`artifact-card ${run.status}`}>
      <div className="artifact-card-header">
        <div className="artifact-card-title">
          <span className={`artifact-card-status ${run.status}`}>
            {run.status === "complete" ? "●" : "✕"}
          </span>
          <span className="artifact-card-desc">{run.pipeline.description}</span>
        </div>
        <div className="artifact-card-meta">
          <span>{formatDate(run.startedAt)}</span>
          <span>{modelLabel}</span>
          <span>{run.pipeline.steps.length} steps</span>
          {duration && <span>{duration}</span>}
        </div>
      </div>

      {run.status === "complete" && run.finalOutput.trim() && (
        <div className="artifact-card-output">
          <div className="artifact-card-output-header">
            <span className="artifact-output-label">Final output</span>
            <div className="artifact-output-actions">
              <CopyButton text={run.finalOutput} />
              <button
                className="btn-icon btn-icon-primary"
                onClick={() =>
                  downloadText(
                    run.finalOutput,
                    `output-${run.pipeline.description.slice(0, 30).replace(/\s+/g, "-")}-${run.id.slice(0, 6)}.txt`
                  )
                }
              >
                Download
              </button>
            </div>
          </div>
          <pre className="artifact-card-pre">{run.finalOutput}</pre>
        </div>
      )}

      {run.status === "error" && run.error && (
        <p className="artifact-card-error">{run.error}</p>
      )}

      {stepsWithOutput.length > 1 && (
        <div className="artifact-card-steps">
          <button
            className="btn-icon artifact-expand-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Hide" : "Show"} {stepsWithOutput.length} step outputs
          </button>

          {expanded && (
            <ol className="artifact-steps-list">
              {stepsWithOutput.map((step, i) => (
                <li key={step.stepId} className="artifact-step-entry">
                  <div className="artifact-step-entry-header">
                    <span className="artifact-step-entry-name">
                      Step {i + 1} — {step.stepName}
                    </span>
                    <div className="artifact-output-actions">
                      <CopyButton text={step.output} />
                      <button
                        className="btn-icon"
                        onClick={() =>
                          downloadText(
                            step.output,
                            `step-${i + 1}-${step.stepName.replace(/\s+/g, "-").slice(0, 20)}-${run.id.slice(0, 6)}.txt`
                          )
                        }
                      >
                        Download
                      </button>
                    </div>
                  </div>
                  <pre className="artifact-card-pre artifact-step-pre">{step.output}</pre>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="artifact-card-footer">
        <button className="btn-icon" onClick={() => onReplay(run.id)}>
          View run
        </button>
      </div>
    </div>
  );
}

interface Props {
  onReplay: (runId: string) => void;
}

export function ArtifactsPage({ onReplay }: Props) {
  const [runs, setRuns] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "complete" | "error">("all");

  useEffect(() => {
    fetch("/api/runs?limit=100")
      .then((r) => r.json())
      .then((data: { runs: HistoryEntry[] }) => setRuns(data.runs))
      .catch(() => setError("Failed to load artifacts"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = runs.filter((r) => filter === "all" || r.status === filter);
  const completeCount = runs.filter((r) => r.status === "complete").length;

  return (
    <div className="artifacts-page">
      <div className="artifacts-page-header">
        <div>
          <h2>Artifacts</h2>
          <p className="subtitle">Outputs from all pipeline runs — download or copy any result.</p>
        </div>
        <div className="artifacts-filter">
          <button
            className={filter === "all" ? "nav-active" : "btn-secondary"}
            onClick={() => setFilter("all")}
          >
            All ({runs.length})
          </button>
          <button
            className={filter === "complete" ? "nav-active" : "btn-secondary"}
            onClick={() => setFilter("complete")}
          >
            Complete ({completeCount})
          </button>
          <button
            className={filter === "error" ? "nav-active" : "btn-secondary"}
            onClick={() => setFilter("error")}
          >
            Failed ({runs.length - completeCount})
          </button>
        </div>
      </div>

      {loading && <p className="sidebar-note">Loading…</p>}
      {error && <p className="global-error">{error}</p>}

      {!loading && filtered.length === 0 && (
        <div className="agent-empty">
          <p>No artifacts yet.</p>
          <p className="sidebar-note">Run a workflow or agent to generate outputs.</p>
        </div>
      )}

      <div className="artifact-cards-grid">
        {filtered.map((run) => (
          <ArtifactCard key={run.id} run={run} onReplay={onReplay} />
        ))}
      </div>
    </div>
  );
}

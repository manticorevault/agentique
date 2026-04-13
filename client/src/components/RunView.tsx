import type { StepRun, RunStatus } from "@skillrunner/shared";
import { formatDuration } from "../utils/cost.js";

interface Props {
  steps: StepRun[];
  status: RunStatus;
  error: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Waiting",
  running: "Running…",
  complete: "Done",
  error: "Error",
};

export function RunView({ steps, status, error, sidebarOpen, onToggleSidebar }: Props) {
  return (
    <div className="run-view">
      <div className="run-view-header">
        <h2>
          Running pipeline
          {status === "complete" && <span className="status-badge complete">Complete</span>}
          {status === "error" && <span className="status-badge error">Failed</span>}
        </h2>
        <button
          className={`btn-sidebar-toggle ${sidebarOpen ? "active" : ""}`}
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Close details" : "Open details"}
        >
          {sidebarOpen ? "✕ Close" : "Details"}
        </button>
      </div>

      <ol className="steps-list">
        {steps.map((step) => {
          const duration =
            step.startedAt && step.finishedAt
              ? formatDuration(step.finishedAt - step.startedAt)
              : null;

          return (
            <li key={step.stepId} className={`step-item step-${step.status}`}>
              <div className="step-header">
                <span className="step-name">{step.stepName}</span>
                <span className={`step-status-label ${step.status}`}>
                  {STATUS_LABEL[step.status] ?? step.status}
                  {duration && step.status !== "pending" && step.status !== "running" && (
                    <span className="step-duration"> · {duration}</span>
                  )}
                </span>
              </div>
              {(step.status === "running" || step.status === "complete") && step.output && (
                <pre className={`step-output${step.status === "running" ? " step-output-streaming" : ""}`}>
                  {step.output}
                  {step.status === "running" && <span className="stream-cursor">▌</span>}
                </pre>
              )}
              {step.status === "running" && !step.output && (
                <p className="step-thinking">Thinking…</p>
              )}
              {step.error && (
                <p className="step-error">{step.error}</p>
              )}
            </li>
          );
        })}
      </ol>

      {status === "error" && error && (
        <p className="run-error">{error}</p>
      )}

      {status === "complete" && !sidebarOpen && (
        <p className="artifact-hint">
          Open <strong>Details</strong> to download artifacts and view cost.
        </p>
      )}
    </div>
  );
}

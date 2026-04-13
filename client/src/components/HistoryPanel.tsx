import { useEffect, useState } from "react";
import type { HistoryEntry } from "@skillrunner/shared";
import { SUPPORTED_MODELS } from "@skillrunner/shared";
import { formatDuration } from "../utils/cost.js";

interface Props {
  onOpen: (runId: string) => void;
  onClose: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryPanel({ onOpen, onClose }: Props) {
  const [runs, setRuns] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((data: { runs: HistoryEntry[] }) => setRuns(data.runs))
      .catch(() => setError("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history-panel">
      <div className="history-header">
        <h3>Recent runs</h3>
        <button className="sidebar-close" onClick={onClose}>✕</button>
      </div>

      {loading && <p className="sidebar-note">Loading…</p>}
      {error && <p className="sidebar-note" style={{ color: "var(--color-error)" }}>{error}</p>}

      {!loading && runs.length === 0 && (
        <p className="sidebar-note">No runs yet.</p>
      )}

      <ul className="history-list">
        {runs.map((run) => {
          const modelLabel = SUPPORTED_MODELS.find((m) => m.id === run.model)?.label ?? run.model;
          const duration =
            run.finishedAt != null
              ? formatDuration(run.finishedAt - run.startedAt)
              : null;

          return (
            <li
              key={run.id}
              className="history-row"
              onClick={() => onOpen(run.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onOpen(run.id)}
            >
              <div className="history-row-top">
                <span className={`history-status ${run.status}`}>
                  {run.status === "complete" ? "●" : run.status === "error" ? "✕" : "○"}
                </span>
                <span className="history-desc">{run.pipeline.description}</span>
              </div>
              <div className="history-row-meta">
                <span>{formatDate(run.startedAt)}</span>
                <span>{modelLabel}</span>
                <span>{run.pipeline.steps.length} steps</span>
                {duration && <span>{duration}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

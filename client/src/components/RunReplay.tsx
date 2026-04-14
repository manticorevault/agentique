import { useEffect, useState } from "react";
import type { HistoryEntry } from "@skillrunner/shared";
import { RunView } from "./RunView.js";
import { Sidebar } from "./Sidebar.js";

interface Props {
  runId: string;
  onBack: () => void;
}

export function RunReplay({ runId, onBack }: Props) {
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetch(`/api/runs/${runId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<HistoryEntry>;
      })
      .then(setEntry)
      .catch(() => setError(`Could not load run ${runId}.`));
  }, [runId]);

  if (error) {
    return (
      <div>
        <p className="global-error">{error}</p>
        <button className="btn-secondary" onClick={onBack}>Back to home</button>
      </div>
    );
  }

  if (!entry) {
    return <p className="sidebar-note">Loading run…</p>;
  }

  return (
    <div className={`run-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="run-main">
        <div className="replay-back">
          <button className="btn-secondary" onClick={onBack}>← Home</button>
        </div>
        <RunView
          steps={entry.steps}
          status={entry.status}
          error={entry.error ?? ""}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
      </div>
      {sidebarOpen && (
        <Sidebar
          runId={entry.id}
          pipeline={entry.pipeline}
          steps={entry.steps}
          finalOutput={entry.finalOutput}
          status={entry.status}
          model={entry.model}
          startedAt={entry.startedAt}
          finishedAt={entry.finishedAt ?? null}
          totalCostUsd={entry.totalCostUsd ?? null}
          onRerun={onBack}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

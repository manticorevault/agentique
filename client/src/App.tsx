import { useState, useEffect } from "react";
import { WorkflowForm } from "./components/WorkflowForm.js";
import { PipelineReview } from "./components/PipelineReview.js";
import { RunView } from "./components/RunView.js";
import { Sidebar } from "./components/Sidebar.js";
import { HistoryPanel } from "./components/HistoryPanel.js";
import { RunReplay } from "./components/RunReplay.js";
import { AgentList } from "./components/AgentList.js";
import { AgentBuilder } from "./components/AgentBuilder.js";
import { SkillBrowser } from "./components/SkillBrowser.js";
import { ArtifactsPage } from "./components/ArtifactsPage.js";
import { useRunStream } from "./hooks/useRunStream.js";
import { decomposeWorkflow, confirmPipeline } from "./api/client.js";
import { DEFAULT_MODEL } from "@skillrunner/shared";
import type { Pipeline, StepRun, Agent } from "@skillrunner/shared";

type Phase = "form" | "review" | "running" | "replay" | "agents" | "agent-builder" | "skills" | "artifacts";

function runIdFromUrl(): string | null {
  const m = window.location.pathname.match(/^\/run\/([^/]+)$/);
  return m ? m[1] : null;
}

// ── Nav bar ────────────────────────────────────────────────────────────────────
function AppNav({
  phase,
  onNav,
}: {
  phase: Phase;
  onNav: (p: Phase) => void;
}) {
  const top = ["form", "review", "running", "replay"].includes(phase) ? "form" : phase;
  return (
    <nav className="app-nav">
      <button
        className={`nav-logo ${top === "form" ? "nav-active" : ""}`}
        onClick={() => onNav("form")}
      >
        SkillRunner
      </button>
      <div className="nav-links">
        <button
          className={top === "agents" ? "nav-active" : ""}
          onClick={() => onNav("agents")}
        >
          Agents
        </button>
        <button
          className={top === "artifacts" ? "nav-active" : ""}
          onClick={() => onNav("artifacts")}
        >
          Artifacts
        </button>
        <button
          className={top === "skills" ? "nav-active" : ""}
          onClick={() => onNav("skills")}
        >
          Browse Skills
        </button>
      </div>
    </nav>
  );
}

// ── Live run screen ────────────────────────────────────────────────────────────
interface RunScreenProps {
  runId: string;
  initialSteps: StepRun[];
  pipeline: Pipeline;
  model: string;
  startedAt: number;
  onRerun: () => void;
}

function RunScreen({ runId, initialSteps, pipeline, model, startedAt, onRerun }: RunScreenProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { steps, status, finalOutput, error, finishedAt } = useRunStream(runId, initialSteps);

  useEffect(() => {
    if (status === "complete") setSidebarOpen(true);
  }, [status]);

  return (
    <div className={`run-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="run-main">
        <RunView
          steps={steps}
          status={status}
          error={error}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
      </div>
      {sidebarOpen && (
        <Sidebar
          runId={runId}
          pipeline={pipeline}
          steps={steps}
          finalOutput={finalOutput}
          status={status}
          model={model}
          startedAt={startedAt}
          finishedAt={finishedAt}
          onRerun={onRerun}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export function App() {
  const initialReplayId = runIdFromUrl();
  const [phase, setPhase] = useState<Phase>(initialReplayId ? "replay" : "form");
  const [replayId, setReplayId] = useState(initialReplayId ?? "");
  const [showHistory, setShowHistory] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | undefined>(undefined);

  // Workflow flow state
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [runId, setRunId] = useState("");
  const [initialSteps, setInitialSteps] = useState<StepRun[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Agent-launched run carries a synthetic Pipeline for the sidebar
  const [agentPipeline, setAgentPipeline] = useState<Pipeline | null>(null);

  useEffect(() => {
    if (phase === "running" && runId)
      window.history.pushState(null, "", `/run/${runId}`);
    else if (["form", "review", "agents", "agent-builder", "skills", "artifacts"].includes(phase))
      window.history.pushState(null, "", "/");
  }, [phase, runId]);

  useEffect(() => {
    function onPop() {
      const id = runIdFromUrl();
      if (id) { setReplayId(id); setPhase("replay"); }
      else setPhase("form");
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(p: Phase) {
    setPhase(p);
    setShowHistory(false);
    setError("");
  }

  // ── Workflow handlers ──────────────────────────────────────────────────────
  async function handleDecompose(description: string) {
    setLoading(true); setError(""); setShowHistory(false);
    try {
      const { pipeline } = await decomposeWorkflow(description);
      setPipeline(pipeline); setPhase("review");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  async function handleConfirm() {
    if (!pipeline) return;
    setLoading(true); setError("");
    try {
      const { runId } = await confirmPipeline({ pipeline, model: selectedModel });
      setRunId(runId); setStartedAt(Date.now());
      setAgentPipeline(pipeline);
      setInitialSteps(pipeline.steps.map((s) => ({
        stepId: s.id, stepName: s.name, status: "pending", output: "",
      })));
      setPhase("running");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }

  // ── Agent run handler ──────────────────────────────────────────────────────
  function handleAgentRunStarted(rid: string, agent: Agent) {
    setRunId(rid); setStartedAt(Date.now());
    // Build a synthetic Pipeline shape so RunScreen + Sidebar work normally
    const synth: Pipeline = {
      id: agent.id,
      description: agent.name,
      steps: agent.steps.map((s) => ({
        id: s.id, name: s.name, description: s.description, order: s.order,
      })),
      matches: agent.steps.map((s) => ({
        stepId: s.id, skillId: s.skillId, skillName: s.skillName,
        skillDescription: s.skillDescription, repoUrl: s.repoUrl, confidence: 1,
      })),
    };
    setAgentPipeline(synth);
    setSelectedModel(agent.model);
    setInitialSteps(agent.steps.map((s) => ({
      stepId: s.id, stepName: s.name, status: "pending", output: "",
    })));
    setPhase("running");
  }

  function openReplay(id: string) {
    setReplayId(id); setShowHistory(false); setPhase("replay");
    window.history.pushState(null, "", `/run/${id}`);
  }

  const activePipeline = agentPipeline ?? pipeline;

  return (
    <main className="app">
      <AppNav phase={phase} onNav={navigate} />

      {error && <p className="global-error">{error}</p>}

      {/* ── Workflow form ──── */}
      {phase === "form" && (
        <>
          <WorkflowForm onSubmit={handleDecompose} loading={loading} />
          <div className="form-footer">
            <button className="btn-secondary btn-history" onClick={() => setShowHistory((v) => !v)}>
              {showHistory ? "Hide history" : "Recent runs"}
            </button>
          </div>
          {showHistory && <HistoryPanel onOpen={openReplay} onClose={() => setShowHistory(false)} />}
        </>
      )}

      {/* ── Pipeline review ─── */}
      {phase === "review" && pipeline && (
        <PipelineReview
          pipeline={pipeline}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onConfirm={() => void handleConfirm()}
          onBack={() => setPhase("form")}
          loading={loading}
        />
      )}

      {/* ── Live run ────────── */}
      {phase === "running" && runId && activePipeline && (
        <RunScreen
          runId={runId}
          initialSteps={initialSteps}
          pipeline={activePipeline}
          model={selectedModel}
          startedAt={startedAt}
          onRerun={() => { setPhase(agentPipeline && !pipeline ? "agents" : "review"); setRunId(""); }}
        />
      )}

      {/* ── Replay ──────────── */}
      {phase === "replay" && replayId && (
        <RunReplay runId={replayId} onBack={() => navigate("form")} />
      )}

      {/* ── Agents ──────────── */}
      {phase === "agents" && !["agent-builder"].includes(phase) && (
        <AgentList
          onEdit={(a) => { setEditingAgent(a); setPhase("agent-builder"); }}
          onRunStarted={handleAgentRunStarted}
          onNew={() => { setEditingAgent(undefined); setPhase("agent-builder"); }}
        />
      )}

      {/* ── Agent builder ───── */}
      {phase === "agent-builder" && (
        <AgentBuilder
          existing={editingAgent}
          onSaved={() => { setEditingAgent(undefined); setPhase("agents"); }}
          onCancel={() => setPhase("agents")}
        />
      )}

      {/* ── Artifacts ───────── */}
      {phase === "artifacts" && (
        <ArtifactsPage onReplay={openReplay} />
      )}

      {/* ── Skill browser ────── */}
      {phase === "skills" && (
        <div className="skill-browser-page">
          <h2>Browse Skills</h2>
          <p className="subtitle">Search the SkillsMP catalogue. Select skills when building an agent.</p>
          <SkillBrowser />
        </div>
      )}
    </main>
  );
}

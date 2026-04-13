import type { Pipeline, PipelineRun, RunEvent, StepStatus } from "@skillrunner/shared";
import { DEFAULT_MODEL } from "@skillrunner/shared";
import { EventEmitter } from "events";

export interface PipelineRunState {
  run: PipelineRun;
  pipeline: Pipeline;
  model: string;
  startedAt: number;
  initialInput: string;
  emitter: EventEmitter;
  events: RunEvent[];
}

const store = new Map<string, PipelineRunState>();

export function createRun(
  runId: string,
  pipeline: Pipeline,
  model: string = DEFAULT_MODEL,
  initialInput = ""
): PipelineRunState {
  const run: PipelineRun = {
    id: runId,
    pipelineId: pipeline.id,
    status: "pending",
    steps: pipeline.steps.map((s) => ({
      stepId: s.id,
      stepName: s.name,
      status: "pending",
      output: "",
    })),
  };

  const state: PipelineRunState = {
    run,
    pipeline,
    model,
    startedAt: Date.now(),
    initialInput,
    emitter: new EventEmitter(),
    events: [],
  };

  store.set(runId, state);
  return state;
}

export function getRunState(runId: string): PipelineRunState | undefined {
  return store.get(runId);
}

export function emitEvent(runId: string, event: RunEvent): void {
  const state = store.get(runId);
  if (!state) return;
  state.events.push(event);
  state.emitter.emit("event", event);
}

export function updateStepStatus(
  runId: string,
  stepId: string,
  status: StepStatus,
  output?: string
): void {
  const state = store.get(runId);
  if (!state) return;
  const step = state.run.steps.find((s) => s.stepId === stepId);
  if (!step) return;
  step.status = status;
  if (output !== undefined) step.output = output;
}

export function updateStepTiming(
  runId: string,
  stepId: string,
  field: "startedAt" | "finishedAt",
  ts: number
): void {
  const state = store.get(runId);
  if (!state) return;
  const step = state.run.steps.find((s) => s.stepId === stepId);
  if (step) step[field] = ts;
}

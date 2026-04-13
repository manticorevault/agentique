import { useEffect, useReducer } from "react";
import type { RunEvent, StepRun, RunStatus } from "@skillrunner/shared";

interface StreamState {
  steps: StepRun[];
  status: RunStatus;
  finalOutput: string;
  error: string;
  finishedAt: number | null;
}

type Action = { event: RunEvent };

function reducer(state: StreamState, { event }: Action): StreamState {
  switch (event.type) {
    case "step_start": {
      return {
        ...state,
        status: "running",
        steps: state.steps.map((s) =>
          s.stepId === event.stepId
            ? { ...s, status: "running", startedAt: event.startedAt }
            : s
        ),
      };
    }
    case "step_output": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === event.stepId
            ? { ...s, output: s.output + event.chunk }
            : s
        ),
      };
    }
    case "step_finish": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === event.stepId
            ? { ...s, status: "complete", output: event.output, finishedAt: event.finishedAt }
            : s
        ),
      };
    }
    case "step_error": {
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.stepId === event.stepId
            ? { ...s, status: "error", error: event.error, finishedAt: event.finishedAt }
            : s
        ),
      };
    }
    case "run_finish": {
      return {
        ...state,
        status: "complete",
        finalOutput: event.finalOutput,
        finishedAt: Date.now(),
      };
    }
    case "run_error": {
      return {
        ...state,
        status: "error",
        error: event.error,
        finishedAt: Date.now(),
      };
    }
    default:
      return state;
  }
}

export function useRunStream(runId: string, initialSteps: StepRun[]) {
  const [state, dispatch] = useReducer(reducer, {
    steps: initialSteps,
    status: "pending",
    finalOutput: "",
    error: "",
    finishedAt: null,
  });

  useEffect(() => {
    if (!runId) return;

    const es = new EventSource(`/api/pipeline/${runId}/stream`);

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const event = JSON.parse(e.data) as RunEvent;
        dispatch({ event });
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [runId]);

  return state;
}

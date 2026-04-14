import type {
  DecomposeRequest,
  DecomposeResponse,
  ConfirmPipelineRequest,
  ConfirmPipelineResponse,
  PipelineInputSchemaRequest,
  PipelineInputSchemaResponse,
  Pipeline,
} from "@skillrunner/shared";

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }

  return res.json() as Promise<TRes>;
}

export function decomposeWorkflow(description: string): Promise<DecomposeResponse> {
  return post<DecomposeRequest, DecomposeResponse>("/api/workflow/decompose", {
    description,
  });
}

export function fetchInputSchema(pipeline: Pipeline): Promise<PipelineInputSchemaResponse> {
  return post<PipelineInputSchemaRequest, PipelineInputSchemaResponse>(
    "/api/pipeline/input-schema",
    { pipeline }
  );
}

export function confirmPipeline(
  req: ConfirmPipelineRequest
): Promise<ConfirmPipelineResponse> {
  return post<ConfirmPipelineRequest, ConfirmPipelineResponse>(
    "/api/pipeline/run",
    req
  );
}

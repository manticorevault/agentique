import type { ModelOption } from "@skillrunner/shared";

export async function fetchModels(): Promise<ModelOption[]> {
  const res = await fetch("/api/models");
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${res.status}: ${err}`);
  }
  const data = (await res.json()) as { models: ModelOption[] };
  return data.models;
}

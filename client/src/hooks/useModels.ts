import { useState, useEffect } from "react";
import type { ModelOption } from "@skillrunner/shared";
import { DEFAULT_MODEL } from "@skillrunner/shared";
import { fetchModels } from "../api/models.js";

export interface UseModelsResult {
  models: ModelOption[];
  loading: boolean;
  error: string;
  defaultModel: string;
  /** Models grouped by provider for use with <optgroup> */
  grouped: Array<{ provider: string; models: ModelOption[] }>;
}

export function useModels(): UseModelsResult {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchModels()
      .then((m) => { if (!cancelled) setModels(m); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Prefer DEFAULT_MODEL if it's in the list; otherwise fall back to first
  const defaultModel =
    models.find((m) => m.id === DEFAULT_MODEL)?.id ??
    models[0]?.id ??
    DEFAULT_MODEL;

  // Group models by provider for <optgroup> rendering
  const grouped = models.reduce<Array<{ provider: string; models: ModelOption[] }>>(
    (acc, m) => {
      const group = acc.find((g) => g.provider === m.provider);
      if (group) {
        group.models.push(m);
      } else {
        acc.push({ provider: m.provider, models: [m] });
      }
      return acc;
    },
    []
  );

  return { models, loading, error, defaultModel, grouped };
}

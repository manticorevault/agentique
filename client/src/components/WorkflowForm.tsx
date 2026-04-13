import { useState } from "react";

interface Props {
  onSubmit: (description: string) => void;
  loading: boolean;
}

export function WorkflowForm({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form className="workflow-form" onSubmit={handleSubmit}>
      <h1>SkillRunner</h1>
      <p className="subtitle">Describe a workflow in plain English and we'll build it.</p>
      <textarea
        className="workflow-input"
        rows={5}
        placeholder="e.g. Scrape a URL, summarise the content, and write a short report"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={loading}
      />
      <button type="submit" disabled={loading || !value.trim()}>
        {loading ? "Decomposing…" : "Build pipeline"}
      </button>
    </form>
  );
}

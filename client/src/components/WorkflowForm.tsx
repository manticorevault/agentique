import { useState } from "react";
import type { SkillSearchResult } from "@skillrunner/shared";
import { FeaturedSkills } from "./FeaturedSkills.js";

interface Props {
  onSubmit: (description: string) => void;
  onSelectSkill: (skill: SkillSearchResult) => void;
  onBrowseAllSkills: () => void;
  loading: boolean;
}

export function WorkflowForm({ onSubmit, onSelectSkill, onBrowseAllSkills, loading }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="workflow-form-page">
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

      <div className="or-divider">
        <span>Or start from a skill</span>
      </div>

      <FeaturedSkills onSelect={onSelectSkill} onBrowseAll={onBrowseAllSkills} />
    </div>
  );
}

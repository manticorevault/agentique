import { useState } from "react";
import { Sparkles } from "lucide-react";
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
      <div className="workflow-hero">
        <div className="hero-badge">
          <Sparkles size={13} />
          AI-powered workflow builder
        </div>

        <h1 className="hero-heading">
          Compose workflows{" "}
          <span className="gradient-text">from plain English.</span>
        </h1>

        <p className="hero-sub">
          Describe what you need done. Agentique decomposes it into steps,
          matches the right skills, and streams results in real time.
        </p>
      </div>

      <form className="workflow-form" onSubmit={handleSubmit}>
        <textarea
          className="workflow-input"
          rows={4}
          placeholder="e.g. Research the latest AI papers, summarize the top 5, and create a newsletter draft…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-build" disabled={loading || !value.trim()}>
          {loading ? "Decomposing…" : "Build workflow →"}
        </button>
      </form>

      <div className="or-divider">
        <span>Or start from a skill</span>
      </div>

      <FeaturedSkills onSelect={onSelectSkill} onBrowseAll={onBrowseAllSkills} />
    </div>
  );
}

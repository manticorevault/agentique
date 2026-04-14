import { useState, useEffect } from "react";
import type { SkillSearchResult } from "@skillrunner/shared";
import { fetchFeaturedSkills } from "../api/agents.js";

// ─── Category inference ───────────────────────────────────────────────────────

const KEYWORD_CATEGORY: [string, string][] = [
  ["scrape", "Web"],
  ["crawl", "Web"],
  ["fetch url", "Web"],
  ["browse", "Web"],
  ["html", "Web"],
  ["search", "Search"],
  ["find", "Search"],
  ["lookup", "Search"],
  ["generate", "Writing"],
  ["write", "Writing"],
  ["draft", "Writing"],
  ["blog", "Writing"],
  ["article", "Writing"],
  ["social media", "Writing"],
  ["summarize", "Analysis"],
  ["summarise", "Analysis"],
  ["analyze", "Analysis"],
  ["analyse", "Analysis"],
  ["extract", "Analysis"],
  ["report", "Analysis"],
  ["data", "Analysis"],
  ["send email", "Communication"],
  ["email", "Communication"],
  ["notify", "Communication"],
  ["slack", "Communication"],
  ["message", "Communication"],
  ["test", "Development"],
  ["commit", "Development"],
  ["build", "Development"],
  ["code", "Development"],
  ["api", "Development"],
  ["deploy", "Development"],
  ["git", "Development"],
];

function inferCategory(skill: SkillSearchResult): string {
  const text = (skill.description + " " + skill.name).toLowerCase();
  for (const [kw, cat] of KEYWORD_CATEGORY) {
    if (text.includes(kw)) return cat;
  }
  const first = skill.description.trim().split(/\s+/)[0] ?? skill.name;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onSelect: (skill: SkillSearchResult) => void;
  onBrowseAll: () => void;
}

export function FeaturedSkills({ onSelect, onBrowseAll }: Props) {
  const [skills, setSkills] = useState<SkillSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedSkills()
      .then((data) => setSkills(data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="featured-skills-loading">
        <span className="featured-skills-loading-dot" />
        <span className="featured-skills-loading-dot" />
        <span className="featured-skills-loading-dot" />
      </div>
    );
  }

  if (skills.length === 0) return null;

  // Group by inferred category
  const categoryMap = new Map<string, SkillSearchResult[]>();
  for (const skill of skills) {
    const cat = inferCategory(skill);
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(skill);
  }

  // Pick the 3 largest categories
  const groups = [...categoryMap.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  return (
    <div className="featured-skills">
      {groups.map(([category, categorySkills]) => (
        <div key={category} className="featured-category">
          <h4 className="featured-category-label">{category}</h4>
          <div className="featured-grid">
            {categorySkills.slice(0, 4).map((skill) => (
              <button
                key={skill.id}
                className="skill-start-card"
                onClick={() => onSelect(skill)}
                type="button"
              >
                <div className="skill-start-header">
                  <span className="skill-start-name">{skill.name}</span>
                  {skill.stars > 0 && (
                    <span className="skill-start-stars">★ {skill.stars}</span>
                  )}
                </div>
                <p className="skill-start-desc">{skill.description}</p>
                <span className="skill-start-author">by {skill.author}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="featured-footer">
        <button
          type="button"
          className="btn-secondary featured-browse-all"
          onClick={onBrowseAll}
        >
          Browse all skills →
        </button>
      </div>
    </div>
  );
}

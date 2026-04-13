import { useState, useRef, useEffect } from "react";
import type { SkillSearchResult } from "@skillrunner/shared";
import { searchSkills, fetchFeaturedSkills } from "../api/agents.js";
import { useFadeInList } from "../hooks/useFadeInList.js";

interface Props {
  /** When provided, renders a "Select" button and calls this instead of showing GitHub link */
  onSelect?: (skill: SkillSearchResult) => void;
}

export function SkillBrowser({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkillSearchResult[]>([]);
  const [featured, setFeatured] = useState<SkillSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useFadeInList<HTMLUListElement>(40);

  useEffect(() => {
    fetchFeaturedSkills()
      .then((data) => setFeatured(data.results))
      .catch(() => {/* silently ignore — featured is best-effort */})
      .finally(() => setFeaturedLoading(false));
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) { setResults([]); setSearched(false); return; }
    debounceRef.current = setTimeout(() => void doSearch(value), 400);
  }

  async function doSearch(q: string) {
    setLoading(true);
    setError("");
    try {
      const data = await searchSkills(q);
      setResults(data.results);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const showFeatured = !query.trim() && !searched;
  const displayList = showFeatured ? featured : results;

  return (
    <div className="skill-browser">
      <div className="skill-search-bar">
        <input
          className="skill-search-input"
          type="search"
          placeholder="Search skills… e.g. web scraper, summarise, send email"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
        />
        {(loading || (showFeatured && featuredLoading)) && (
          <span className="skill-search-spinner">
            {showFeatured ? "Loading…" : "Searching…"}
          </span>
        )}
      </div>

      {error && <p className="sidebar-note" style={{ color: "var(--color-error)" }}>{error}</p>}

      {searched && results.length === 0 && !loading && (
        <p className="sidebar-note">No skills found for "{query}".</p>
      )}

      {showFeatured && !featuredLoading && featured.length > 0 && (
        <p className="sidebar-note" style={{ marginBottom: "var(--space-2)" }}>
          Popular skills
        </p>
      )}

      <ul className="skill-results" ref={resultsRef}>
        {displayList.map((skill) => (
          <li key={skill.id} className="skill-card">
            <div className="skill-card-header">
              <span className="skill-card-name">{skill.name}</span>
              <span className="skill-card-author">by {skill.author}</span>
              {skill.stars > 0 && (
                <span className="skill-card-stars">★ {skill.stars}</span>
              )}
            </div>
            <p className="skill-card-desc">{skill.description}</p>
            <div className="skill-card-footer">
              {skill.githubUrl && (
                <a
                  className="skill-card-link"
                  href={skill.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on GitHub
                </a>
              )}
              {onSelect ? (
                <button
                  className="btn-icon btn-icon-primary"
                  onClick={() => onSelect(skill)}
                >
                  Use this skill
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Derive a readable display label from an OpenRouter model ID.
 * "anthropic/claude-haiku-4.5"  → "Claude Haiku 4.5"
 * "openai/gpt-4.1-nano"         → "GPT-4.1 Nano"
 * "google/gemini-2.5-flash"     → "Gemini 2.5 Flash"
 */
export function modelLabel(id: string): string {
  // Take only the model part after the provider prefix
  const [, model = id] = id.split("/");
  return model
    // Replace hyphen-digit-dot-digit or hyphen-digit-hyphen-digit with dots for version numbers
    .replace(/-(\d+\.\d+)/g, " $1")
    // Replace remaining hyphens with spaces
    .replace(/-/g, " ")
    // Title-case each word
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

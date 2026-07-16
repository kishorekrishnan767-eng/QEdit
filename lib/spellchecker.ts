/**
 * lib/spellchecker.ts
 *
 * Fully OFFLINE, client-side spell-checker for QEdit.
 * Uses `nspell` loaded in the browser + dictionary files served as static
 * assets from /public/dict/ — no API key, no rate limits, no external calls.
 * The dictionary is fetched ONCE and cached for the lifetime of the page.
 */

"use client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SpellError {
  word: string;
  index: number;   // start position in the original string
  length: number;
  suggestions: string[];
}

// ── Singleton state ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let spellInstance: any | null = null;
let loadingPromise: Promise<void> | null = null;

// Per-word suggestion cache — avoids recomputing the same word repeatedly
const suggestionCache = new Map<string, string[]>();

// ── Loader ───────────────────────────────────────────────────────────────────

export async function getSpellChecker(): Promise<void> {
  if (spellInstance) return;           // already ready
  if (loadingPromise) return loadingPromise; // already in flight

  loadingPromise = (async () => {
    try {
      // Fetch dictionary files from /public/dict/ (same-origin static assets)
      const [affRes, dicRes, { default: nspell }] = await Promise.all([
        fetch("/dict/en.aff"),
        fetch("/dict/en.dic"),
        import("nspell"),
      ]);

      if (!affRes.ok || !dicRes.ok) {
        throw new Error("Failed to fetch dictionary files");
      }

      const [aff, dic] = await Promise.all([affRes.text(), dicRes.text()]);
      spellInstance = nspell({ aff, dic });
    } catch (err) {
      // Fail silently — editor still works; spell-check is just unavailable
      console.warn("[spellchecker] Dictionary load failed:", err);
    }
  })();

  return loadingPromise;
}

// ── Core checker ─────────────────────────────────────────────────────────────

/**
 * Tokenizes `text` and returns an array of misspelled words with their
 * positions and up to 5 suggestions. Returns [] if dictionary isn't ready.
 */
export function checkText(text: string): SpellError[] {
  if (!spellInstance || !text.trim()) return [];

  const errors: SpellError[] = [];
  // Match letter sequences; hyphens naturally split words
  const tokenRegex = /[A-Za-z']+/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const raw = match[0];
    // Strip leading/trailing apostrophes
    const word = raw.replace(/^'+|'+$/g, "");

    // Skip: too short, ALL-CAPS (acronyms like BL/CO/PO), no letters
    if (
      word.length < 3 ||
      word === word.toUpperCase() ||
      !/[A-Za-z]/.test(word)
    ) continue;

    if (spellInstance.correct(word)) continue;

    // Cache suggestions
    let suggestions = suggestionCache.get(word);
    if (!suggestions) {
      suggestions = (spellInstance.suggest(word) as string[]).slice(0, 5);
      suggestionCache.set(word, suggestions);
    }

    errors.push({
      word,
      index: match.index + (raw.length - word.length),
      length: word.length,
      suggestions,
    });
  }

  return errors;
}

// Pre-warm dictionary as soon as this module is first imported on the client
if (typeof window !== "undefined") {
  getSpellChecker().catch(() => {/* handled inside */});
}

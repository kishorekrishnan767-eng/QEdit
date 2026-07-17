/**
 * questionPunctuation.ts
 *
 * Smart Academic Question Punctuation — Rule-Based (No AI)
 * Works offline, instantly, and predictably.
 *
 * Usage:
 *   import { applyAcademicPunctuation } from '@/lib/utils/questionPunctuation';
 *   const result = applyAcademicPunctuation("Explain deadlock.");
 *   // => "Explain deadlock."
 */

// ── Rule Sets ──────────────────────────────────────────────────────────────────

/**
 * Rule 1 — Direct question words → append "?"
 */
const QUESTION_STARTERS: string[] = [
  'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
  'is', 'are', 'was', 'were',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might',
  'do', 'does', 'did',
  'has', 'have', 'had',
];

/**
 * Rule 2 — Academic instruction verbs → append "."
 */
const INSTRUCTION_STARTERS: string[] = [
  'explain', 'describe', 'discuss', 'define', 'differentiate',
  'illustrate', 'analyze', 'analyse', 'evaluate', 'justify', 'state',
  'mention', 'list', 'write', 'give', 'draw', 'develop', 'design',
  'construct', 'calculate', 'identify', 'prove', 'summarize', 'summarise',
  'comment', 'classify', 'compare', 'examine', 'outline', 'interpret',
  'derive', 'determine', 'demonstrate', 'elaborate', 'estimate', 'find',
  'formulate', 'compute', 'apply', 'solve', 'trace', 'represent',
  'tabulate', 'distinguish', 'predict', 'propose', 'suggest',
];

/**
 * Rule 3 — Introductory statement phrases → append ":"
 * Order matters: longer / more specific phrases first.
 */
const INTRO_PHRASE_STARTERS: string[] = [
  'answer the following',
  'write short notes on',
  'write a short note on',
  'based on the following',
  'observe the following',
  'read the following',
  'choose the correct answer',
  'match the following',
  'fill in the blanks',
  'fill in the blank',
  'complete the following',
  'attempt any',
  'the following',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Strips all trailing punctuation characters and whitespace from a string.
 * Handles multiple repeated punctuation (e.g. "??", "...", "!!!").
 */
export function cleanEndingPunctuation(text: string): string {
  // Remove trailing punctuation ( . ? ! : ; , ) and whitespace repeatedly
  return text.replace(/[\s.?!:;,]+$/u, '');
}

/**
 * Strips known sub-question and marks prefixes from the start of a question.
 * Handles patterns like "1.", "(a)", "a)", "i)", "[Q1]", "[5 Marks]", etc.
 */
export function cleanLeadingPrefix(text: string): string {
  let cleaned = text.trim();
  
  while (true) {
    const prev = cleaned;
    // Strip bullet numbers/letters like "1.", "(a)", "a)", "i)", "A.", "i."
    cleaned = cleaned.replace(/^\(?([0-9a-zA-Z]+|\d+[a-z]?)[.)]\s*/, '');
    // Strip brackets like "[Q1]" or "[5 Marks]" or "[5]"
    cleaned = cleaned.replace(/^\[[^\]]+\]\s*/, '');
    
    if (cleaned === prev) break;
  }
  
  return cleaned;
}

/**
 * Detects the correct academic punctuation type for a given question.
 * Returns '?', '.', or ':'
 *
 * @param text - The raw question text (with or without ending punctuation)
 * @returns The punctuation character to append
 */
export function detectQuestionType(text: string): '?' | '.' | ':' {
  const cleaned = cleanEndingPunctuation(text).trim();
  if (!cleaned) return '.';

  // Strip leading numbering/marks prefixes to get the true starting text
  const trueStart = cleanLeadingPrefix(cleaned).trim();
  if (!trueStart) return '.';

  // Normalise: lowercase for matching, preserve original for output
  const lower = trueStart.toLowerCase();

  // Rule 3 first — multi-word phrases (must come before single-word checks)
  for (const phrase of INTRO_PHRASE_STARTERS) {
    if (lower.startsWith(phrase)) return ':';
  }

  // Extract first word only for single-word rules
  const firstWord = lower.split(/\s+/)[0];

  // Rule 1 — Direct questions
  if (QUESTION_STARTERS.includes(firstWord)) return '?';

  // Rule 2 — Instruction verbs
  if (INSTRUCTION_STARTERS.includes(firstWord)) return '.';

  // Rule 4 — Default
  return '.';
}

/**
 * Main entry point.
 * Cleans existing ending punctuation and appends the correct academic punctuation.
 *
 * @param text - Raw question text
 * @returns The corrected question text with proper ending punctuation
 */
export function applyAcademicPunctuation(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;

  const cleaned = cleanEndingPunctuation(trimmed);
  if (!cleaned) return trimmed;

  const punctuation = detectQuestionType(cleaned);
  return cleaned + punctuation;
}

// ── Future Extension Point ─────────────────────────────────────────────────────
// To add new rules (e.g. British punctuation, institution-specific rules),
// extend the rule sets above or add a new rule block inside detectQuestionType()
// before the default return. No editor components need to be changed.

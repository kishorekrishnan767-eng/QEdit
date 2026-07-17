export type ExamCategory = 'cycle_test_1' | 'cycle_test_2' | 'model_exam' | null;

export function detectExamCategory(examName: string): ExamCategory {
  const normalized = examName.toLowerCase().replace(/[^a-z0-9]/g, ' ');

  // Match the exact three-keyword check already used in Editor.tsx (~line 1100) for 
  // booklet PDF layout detection — keep both in sync if either changes.
  const isCycle = normalized.includes('cycle') || normalized.includes('cyclic') || normalized.includes('cylic');
  const hasTwo = /\b(2|ii)\b/.test(normalized);
  const hasOne = /\b(1|i)\b/.test(normalized);

  if (isCycle && hasTwo) return 'cycle_test_2';
  if (isCycle && hasOne) return 'cycle_test_1';
  if (isCycle) return 'cycle_test_1'; // default to Test 1 if cycle detected but no number found
  if (normalized.includes('model')) return 'model_exam';

  return null; // does not match any tracked category — Save Final behaves as before
}

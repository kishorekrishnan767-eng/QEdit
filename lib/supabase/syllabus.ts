import { createClient } from '@/lib/supabase/client';

// Supabase caps every select at 1000 rows by default, and the seeded syllabus
// (UG + PG) is well over that. Page through the table so no class goes missing.
const PAGE_SIZE = 1000;

export async function fetchAllSyllabusCourses<T = Record<string, unknown>>(
  columns = '*'
): Promise<{ data: T[]; error: string | null }> {
  const client = createClient();
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from('syllabus_courses')
      .select(columns)
      .order('sem', { ascending: true })
      .order('code', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) return { data: rows, error: error.message };
    if (!data || data.length === 0) break;
    rows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
  }

  return { data: rows, error: null };
}

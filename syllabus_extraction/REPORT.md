# Syllabus Extraction Report — Regulation 2024 UG Syllabi

**Status: extraction complete, awaiting your review before anything is written to the database.**

## Summary

- **31 PDFs found** in `pdf/UG FINAL PDF/` (the task brief said 15/DOCX; actual folder has 31 PDFs, 0 DOCX).
- **6 skipped** — already seeded in `supabase-syllabus.sql` for regulation 2024 (BCA‑CA, BCA‑Data Science, BCA‑Gen AI, BSc‑Computer Science, BSc‑CS AI&ML, BSc‑CS Cyber Security). Per your instruction, not re-extracted.
- **25 files processed**, all succeeded (no silent failures — 4 initially failed and were fixed; see Issues Found below).
- **1,864 course rows extracted** into `syllabus_extraction/syllabus_extracted.csv`.
- Extraction script: `syllabus_extraction/scripts/extract_syllabus.py` (re-runnable).

| program_course | rows |
|---|---|
| BSc | 1,052 |
| BCOM | 680 |
| BA | 132 |

## Schema note — this differs from the original task brief

The actual `syllabus_courses` table (`supabase-syllabus.sql`) and the "Add Course" form (`app/admin/AdminClient.tsx`) use:

```
code, title, sem (integer), course, specialization, regulation
```

There is **no L/T/P/C column** — the app doesn't store credit hours. I still captured L/T/P/C into the CSV as extra QA columns (to help you sanity-check the extraction against the PDFs), but they won't be part of the DB insert.

The "Program / Course" dropdown only had 5 options (General/Common, BCA, BSc, MCA, MSc) with a Specialization sub-field for BCA/BSc only. Per your answers:

- **BA and BCOM** are new `course` values (12 of the 25 files) — not previously in the dropdown.
- **13 new BSc specializations** (Biotechnology, Chemistry, Defence and Strategic Studies, Economics, Fashion Designing, Mathematics, Physical Education, Physics, Psychology, Statistics, Visual Communication, Biomedical Science, and 6 Film Technology tracks) are new specialization values.

I have **not yet touched `AdminClient.tsx` or written any SQL insert** — that's the next step, pending your confirmation of the data below.

## Programme → category mapping (verify this)

| File | Course | Specialization (from cover page) |
|---|---|---|
| 2024 BA ENGLISH FINAL.pdf | BA | English |
| 2024 BA JMC FINAL.pdf | BA | Journalism and Mass Communication |
| 2024 BCOM AF FINAL.pdf | BCOM | Accounting and Finance |
| 2024 BCOM BFSI FINAL.pdf | BCOM | Banking, Financial Services and Insurance |
| 2024 BCOM CA FINAL.pdf | BCOM | Computer Applications |
| 2024 BCOM CS FINAL.pdf | BCOM | Corporate Secretaryship |
| 2024 BCOM FT FINAL.pdf | BCOM | Finance and Taxation |
| 2024 BCOM GENERAL FINAL.pdf | BCOM | Commerce |
| 2024 BCOM IAF FINAL.pdf | BCOM | International Accounting and Finance |
| 2024 BCOM ISM FINAL.pdf | BCOM | Information System Management |
| 2024 BCOM PA FINAL.pdf | BCOM | Professional Accounting |
| 2024 BCOM SF FINAL.pdf | BCOM | Strategic Finance |
| 2024 BSC BIOTECHNOLOGY FINAL.pdf | BSc | Biotechnology |
| 2024 BSC CHEMISTRY FINAL.pdf | BSc | Chemistry |
| 2024 BSC DEFENCE FINAL.pdf | BSc | Defence and Strategic Studies |
| 2024 BSC ECONOMICS FINAL.pdf | BSc | Economics |
| 2024 BSC FASHION DESIGN FINAL.pdf | BSc | Fashion Designing |
| 2024 BSC MATHS FINAL.pdf | BSc | Mathematics |
| 2024 BSC PHYSICAL EDUCATION FINAL.pdf | BSc | Physical Education |
| 2024 BSC PHYSICS FINAL.pdf | BSc | Physics |
| 2024 BSC PSYCHOLOGY FINAL.pdf | BSc | Psychology |
| 2024 BSC STATISTICS.pdf | BSc | Statistics |
| 2024 BSC VISCOM FINAL.pdf | BSc | Visual Communication |
| UG 2024 BSC Biomedical Sciences.pdf | BSc | Biomedical Science |
| UG 2024 BSC Film Technology Syllabus.pdf | BSc | **6 specializations** — see below |

### Special case: Film Technology (6 tracks in one PDF)

This single 485-page PDF bundles a shared foundation year plus **5 specialization tracks**, each with its own Semester 3–8 courses:

- `Film Technology` (base — Semesters 1–2 only, shared by all tracks)
- `Film Technology - Direction`
- `Film Technology - Cinematography`
- `Film Technology - Editing`
- `Film Technology - Sound`
- `Film Technology - Graphics And Animation`

255 rows total across all 6. **Note:** this repeats common courses (Tamil, Hindi, NSS, etc.) once per track, rather than collapsing them into one shared "General" entry the way the existing seed data sometimes does — I did not attempt cross-file de-duplication since that's a curation choice, not an extraction fact. Flag if you'd rather I de-dupe common courses across all specializations.

## Regulation note

All 25 files → regulation **2024**, confirmed via the "Regulation 2024" footer/citation on each document — with one exception worth flagging: **`UG 2024 BSC Biomedical Sciences.pdf`'s cover page says "Academic Year 2025-2026"**, not 2024. I used **2024** because page 2 of that same document explicitly cites "governed by the UG Regulations 2024" — but you may want to double check this is the batch you intend (it looks like a 2025-26 intake curriculum published under the 2024 regulation framework, not a stray 2024 syllabus).

## Row-quality flags

| Flag | Count | Meaning |
|---|---|---|
| *(none)* | 936 | Clean row, code + title + full L/T/P/C |
| `ltpc_shared_with_group` | 498 | Code and title are solid; credit hours are blank because the source table only prints them once for a choice-group (e.g. Tamil‑I/Hindi‑I/French‑I) — expected, not a defect, and doesn't affect the DB import since credits aren't stored |
| `no_code_placeholder` | 352 | The source table itself has **no course code** for this slot — it's a generic label like "Minor Elective – IV" or "Multidisciplinary Course – II". I did not guess a code. These need your manual call if you want a specific code attached |
| `malformed_table_verify_manually` | 58 | Only in Film Technology's Cinematography/Editing/Graphics&Animation tracks, Semesters 4 & 6 — the source PDF's table lost its column structure there. Codes and titles were recovered from raw text and look correct on inspection, but **please spot-check these 58 rows** against the PDF before trusting them fully |
| `ltpc_shared_or_missing` | 20 | Biomedical Sciences only (its tables have no ruling lines, so a fallback text parser was used) — code/title reliable, credit hours occasionally unrecoverable |

None of the flags block a DB insert, since the target table doesn't store L/T/P/C — `no_code_placeholder` and `malformed_table_verify_manually` are the two worth a manual look.

## Issues found and fixed during extraction (for transparency)

Building this required actually validating against ground truth, not just running one pass. Real bugs caught and fixed along the way:

1. **4 files initially extracted 0 rows** (Chemistry, Defence, Physical Education, Psychology) — their "Semester – N" label sat in a different table column than the other documents. Fixed by making the row parser column-position-agnostic instead of assuming a fixed layout.
2. **Cross-table ordering bug** — pdfplumber doesn't always return side-by-side semester tables in reading order (a right-column table can have a marginally higher position than its left-column neighbour), which broke a naive "current semester + 1" approach. Fixed by having each table resolve its own semester state independently.
3. **Long titles wrapping across 2–3 physical table rows**, with the course code landing on the middle row — required a dedicated reconstruction pass, tuned against several real documents (Physical Education, Defence) to avoid both under- and over-merging adjacent rows.
4. **Header/footer text leaking into data** — phrases like "Sessions / Week", "Sessions per", "Hours/", "Total Hours" appear with different spacing/wording per document and were initially mistaken for course content.
5. **Two courses sharing one merged table cell** (e.g. NCC/NSO in BCOM‑CS) — split into separate rows.

All fixes were verified against the **existing seed data in `supabase-syllabus.sql`** as ground truth (row-for-row match on BCA‑CA) before being trusted on the other 24 files, and then re-verified per-file after each fix.

## What I have NOT done yet

- No changes to `app/admin/AdminClient.tsx` (the Program/Course and Specialization dropdowns) yet.
- No SQL insert script written yet.
- No data has been written to Supabase.

## Next step

Please review `syllabus_extraction/syllabus_extracted.csv` (1,864 rows) — particularly the `no_code_placeholder` and `malformed_table_verify_manually` rows, and the Biomedical Sciences regulation-year note above. Once you confirm this looks right, I'll:

1. Add `BA`/`BCOM` and the 13 new specializations to `AdminClient.tsx`'s dropdowns.
2. Write a SQL seed script (matching the style of `supabase-syllabus.sql`) or an insert route, whichever you prefer, to load this data.

"""
Extracts the per-semester course list from SRM UG syllabus PDFs
(pdf/UG FINAL PDF/) into a review CSV, matching the syllabus_courses table
(see ../../supabase-syllabus.sql): code, title, sem, course, specialization,
regulation.

Usage: python scripts/extract_syllabus.py
Outputs (into syllabus_extraction/): syllabus_extracted.csv, file_summaries.json

Six files are skipped because their data is already seeded in
supabase-syllabus.sql (see ALREADY_SEEDED below). One file (Film Technology)
bundles 6 specialization tracks and is extracted as 6 separate specializations
under BSc. One file (Biomedical Sciences) has no ruling lines in its tables
and uses a text-line fallback parser instead of table extraction.

Extraction method: pdfplumber's table detection (real cell boundaries), not
plain text extraction — validated row-for-row against the already-seeded
BCA-CA data in supabase-syllabus.sql before being trusted on the rest.
Rows with no course code in the source table (generic "Minor Elective" /
"Multidisciplinary Course" slots) are kept with a blank code and flagged
no_code_placeholder rather than guessing a code.
"""

import pdfplumber
import re
import csv
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parents[1]
PDF_DIR = PROJECT_ROOT / "pdf" / "UG FINAL PDF"
OUT_DIR = SCRIPT_DIR.parent

ROMAN_MAP = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8}
CODE_RE = re.compile(r'^([A-Z]{2,6}[0-9]{2}[A-Z0-9]{2,6})\b\s*(.*)$')
BOILERPLATE_HEADERS = {
    'FACULTY OF SCIENCE AND HUMANITIES',
    'SRM INSTITUTE OF SCIENCE AND TECHNOLOGY',
}

# Already in supabase-syllabus.sql for regulation 2024 - skipped to avoid duplicates.
ALREADY_SEEDED = {
    "2024 BCA CA FINAL.pdf",
    "2024 BCA DATA SCIENCE FINAL.pdf",
    "2024 BCA GEN AI FINAL.pdf",
    "2024 BSC CS FINAL.pdf",
    "2024 BSC CS AI & ML FINAL.pdf",
    "2024 BSC CS CYBER SECURITY FINAL.pdf",
}

# filename -> (course, specialization); specialization confirmed from each
# cover page's "in <X>" line, not guessed from the filename abbreviation.
FILE_META = {
    "2024 BA ENGLISH FINAL.pdf": ("BA", "English"),
    "2024 BA JMC FINAL.pdf": ("BA", "Journalism and Mass Communication"),
    "2024 BCOM AF FINAL.pdf": ("BCOM", "Accounting and Finance"),
    "2024 BCOM BFSI FINAL.pdf": ("BCOM", "Banking, Financial Services and Insurance"),
    "2024 BCOM CA FINAL.pdf": ("BCOM", "Computer Applications"),
    "2024 BCOM CS FINAL.pdf": ("BCOM", "Corporate Secretaryship"),
    "2024 BCOM FT FINAL.pdf": ("BCOM", "Finance and Taxation"),
    "2024 BCOM GENERAL FINAL.pdf": ("BCOM", "Commerce"),
    "2024 BCOM IAF FINAL.pdf": ("BCOM", "International Accounting and Finance"),
    "2024 BCOM ISM FINAL.pdf": ("BCOM", "Information System Management"),
    "2024 BCOM PA FINAL.pdf": ("BCOM", "Professional Accounting"),
    "2024 BCOM SF FINAL.pdf": ("BCOM", "Strategic Finance"),
    "2024 BSC BIOTECHNOLOGY FINAL.pdf": ("BSc", "Biotechnology"),
    "2024 BSC CHEMISTRY FINAL.pdf": ("BSc", "Chemistry"),
    "2024 BSC DEFENCE FINAL.pdf": ("BSc", "Defence and Strategic Studies"),
    "2024 BSC ECONOMICS FINAL.pdf": ("BSc", "Economics"),
    "2024 BSC FASHION DESIGN FINAL.pdf": ("BSc", "Fashion Designing"),
    "2024 BSC MATHS FINAL.pdf": ("BSc", "Mathematics"),
    "2024 BSC PHYSICAL EDUCATION FINAL.pdf": ("BSc", "Physical Education"),
    "2024 BSC PHYSICS FINAL.pdf": ("BSc", "Physics"),
    "2024 BSC PSYCHOLOGY FINAL.pdf": ("BSc", "Psychology"),
    "2024 BSC STATISTICS.pdf": ("BSc", "Statistics"),
    "2024 BSC VISCOM FINAL.pdf": ("BSc", "Visual Communication"),
}

TEXT_FALLBACK_FILES = {"UG 2024 BSC Biomedical Sciences.pdf"}
MULTI_TRACK_FILES = {"UG 2024 BSC Film Technology Syllabus.pdf"}

FILM_TECH_EXPECTED = {
    'FILM TECHNOLOGY': [1, 2],
    'DIRECTION': [3, 4, 5, 6, 7, 8],
    'CINEMATOGRAPHY': [3, 4, 5, 6, 7, 8],
    'EDITING': [3, 4, 5, 6, 7, 8],
    'SOUND': [3, 4, 5, 6, 7, 8],
    'GRAPHICS AND ANIMATION': [3, 4, 5, 6, 7, 8],
}


def roman_to_int(s):
    return ROMAN_MAP.get(s.upper().strip())


def parse_semester_num(cell_text):
    if not cell_text:
        return None
    m = re.search(r'Semester\s*[–—-]\s*([IVX]+)\s*$', cell_text.strip())
    if m:
        return roman_to_int(m.group(1))
    return None


def clean(s):
    if s is None:
        return None
    s = s.replace('\n', ' ').strip()
    s = re.sub(r'\s+', ' ', s)
    return s if s else None


def parse_row_flexible(row):
    """Position-agnostic row parser: tolerates variable column counts and an
    extra leading blank column, which several documents use inconsistently."""
    if any(cell and str(cell).count('\n') > 1 for cell in row):
        return None  # duplicate/blob wrapper-table row, never real tabular data
    cells = [clean(c) for c in row]
    cells = [c for c in cells if c]
    if not cells:
        return None
    joined = ' '.join(cells)
    if 'Course Code' in joined or 'Course Title' in joined:
        return None
    if re.fullmatch(r'[LTPC]+', joined.replace(' ', '')):
        return None
    if 'Learning Credits' in joined or re.search(r'Total\s*Hours', joined, re.IGNORECASE):
        return 'STOP'
    header_compact = re.sub(r'[\s/]+', '', joined)
    if re.fullmatch(r'(Hours?|Sessions?|Per|Week|Code|C)+', header_compact, re.IGNORECASE):
        return None

    code = None
    m = CODE_RE.match(cells[0])
    remaining = cells[:]
    if m:
        code = m.group(1)
        rest0 = m.group(2).strip()
        remaining = ([rest0] if rest0 else []) + cells[1:]

    l = t = p = c = None
    trail_nums = []
    while remaining and re.fullmatch(r'\d{1,2}', remaining[-1]):
        trail_nums.insert(0, remaining.pop())
        if len(trail_nums) == 4:
            break
    if len(trail_nums) == 4:
        l, t, p, c = trail_nums
    elif trail_nums:
        c = trail_nums[-1]

    title = ' '.join(remaining).strip() or None
    if not title and not code:
        return None
    flag = None
    if not code:
        flag = 'no_code_placeholder'
    elif l is None:
        flag = 'ltpc_shared_with_group'
    return {'code': code, 'title': title, 'l': l, 't': t, 'p': p, 'c': c, 'flag': flag}


def merge_wrapped_entries(entries):
    """Some documents wrap a long course title across up to 3 physical rows,
    with the course code landing on the middle row: [title-prefix, no code],
    [code (+ltpc), title blank], [title-suffix, no code]. Reconstruct these
    into one logical entry; leave normal single-row entries untouched."""
    def is_orphan(x):
        return not x['code'] and x['title'] and not any(x[k] for k in ('l', 't', 'p', 'c'))

    # First, collapse RUNS of 2+ consecutive orphan (no-code) rows into one
    # combined orphan entry. A lone orphan row immediately before a code row
    # is a genuine title-prefix (handled below); a run of 2+ is more likely
    # its own dangling phrase with no code in the source table at all, and
    # must not be allowed to glom onto whatever code row follows it — unless
    # the run is exactly 2 rows sandwiched between two bare (title-less) code
    # rows, which means it's really a [suffix][prefix] split, not one phrase.
    def is_bare_code(x):
        return x['code'] and not x['title']

    collapsed = []
    i, n = 0, len(entries)
    while i < n:
        if is_orphan(entries[i]) and i + 1 < n and is_orphan(entries[i + 1]):
            j = i
            while j < n and is_orphan(entries[j]):
                j += 1
            run = entries[i:j]
            prev_is_bare_code = bool(collapsed) and is_bare_code(collapsed[-1])
            next_is_bare_code = j < n and is_bare_code(entries[j])
            if len(run) == 2 and prev_is_bare_code and next_is_bare_code:
                collapsed.append(run[0])
                collapsed.append(run[1])
            else:
                merged_orphan = dict(entries[i])
                merged_orphan['title'] = ' '.join(r['title'] for r in run)
                merged_orphan['_multirow_orphan'] = True
                collapsed.append(merged_orphan)
            i = j
        else:
            collapsed.append(entries[i])
            i += 1
    entries = collapsed

    merged = []
    i, n = 0, len(entries)
    while i < n:
        e = entries[i]
        # Prefix (title, optionally with its own ltpc) immediately before a
        # code row that has no title of its own yet: attach the prefix as
        # this course's title, carry over any ltpc it had, and absorb up to
        # one more trailing continuation line if the title kept wrapping —
        # but never steal a line that is itself a valid prefix for the code
        # row that follows it.
        if not e['code'] and e['title'] and not e.get('_multirow_orphan') \
                and i + 1 < n and entries[i + 1]['code'] and not entries[i + 1]['title']:
            nxt = dict(entries[i + 1])
            nxt['title'] = e['title']
            for k in ('l', 't', 'p', 'c'):
                if nxt[k] is None:
                    nxt[k] = e[k]
            j = i + 2
            while j < n and j < i + 3 and not entries[j]['code'] and entries[j]['title'] \
                    and not any(entries[j][k] for k in ('l', 't', 'p', 'c')) \
                    and not (j + 1 < n and entries[j + 1]['code'] and not entries[j + 1]['title']):
                nxt['title'] = (nxt['title'] + ' ' + entries[j]['title']).strip()
                j += 1
            nxt['flag'] = None if nxt['l'] else 'ltpc_shared_with_group'
            merged.append(nxt)
            i = j
            continue
        if e['code'] and not e['title'] and i + 1 < n and not entries[i + 1]['code'] \
                and not (i + 2 < n and entries[i + 2]['code'] and not entries[i + 2]['title']):
            e = dict(e)
            j = i + 1
            while j < n and j < i + 2 and not entries[j]['code']:
                if entries[j]['title']:
                    e['title'] = (e['title'] + ' ' + entries[j]['title']).strip() if e['title'] else entries[j]['title']
                for k in ('l', 't', 'p', 'c'):
                    if e[k] is None and entries[j][k] is not None:
                        e[k] = entries[j][k]
                j += 1
            e['flag'] = None if e['l'] else 'ltpc_shared_with_group'
            merged.append(e)
            i = j
            continue
        merged.append(e)
        i += 1
    for m in merged:
        m.pop('_multirow_orphan', None)
    return merged


def rows_from_clean_table(rows):
    out = []
    for row in rows[1:]:
        r = parse_row_flexible(row)
        if r is None:
            continue
        if r == 'STOP':
            break
        out.append(r)
    return merge_wrapped_entries(out)


def is_clean_semester_table(rows):
    if not rows or not rows[0]:
        return None
    for cell in rows[0]:
        if not cell:
            continue
        if str(cell).count('\n') > 1:
            return None
        sem = parse_semester_num(str(cell))
        if sem is not None:
            return sem
    return None


def looks_like_track_name(line):
    if not line or line in BOILERPLATE_HEADERS:
        return False
    if not re.fullmatch(r'[A-Z][A-Z &]+', line):
        return False
    return 3 <= len(line) <= 45


def clean_title_fragment(cell_text):
    if not cell_text:
        return None
    parts = [p.strip() for p in str(cell_text).split('\n') if p.strip()]
    text_parts = [p for p in parts if not re.fullmatch(r'[\d\s]+', p)]
    if not text_parts:
        return None
    t = text_parts[0]
    t = re.sub(r'\s+\d(\s+\d){0,3}\s*$', '', t).strip()
    return t or None


def recover_malformed_semester(rows, target_sem):
    """Best-effort recovery for a semester whose table lost its column
    structure in the source PDF (seen in 3 of Film Technology's 6 tracks, for
    semesters 4 and 6 only). Code/title pairs are generally reliable; every
    row from this path is flagged malformed_table_verify_manually."""
    roman_target = [k for k, v in ROMAN_MAP.items() if v == target_sem][0]
    start = None
    for i, row in enumerate(rows):
        for cell in row:
            if cell and re.fullmatch(rf'Semester\s*[-–]\s*{roman_target}', str(cell).strip()):
                start = i + 1
                break
        if start is not None:
            break
    if start is None:
        return []
    out = []
    for row in rows[start:]:
        cells = [c for c in row if c is not None]
        joined = ' '.join(str(c) for c in cells)
        if not joined.strip():
            continue
        if re.search(r'Semester\s*[-–]\s*[IVX]+', joined) and 'Total' not in joined:
            break
        if 'Total Learning Credits' in joined:
            break
        code, title = None, None
        for cell in row:
            if cell and CODE_RE.match(str(cell).strip()):
                code = CODE_RE.match(str(cell).strip()).group(1)
                break
        for cell in row:
            t = clean_title_fragment(cell)
            if t and not CODE_RE.match(t) and t not in ('Code', 'Course Title', 'Hours/', 'Week'):
                title = t
                break
        if not code and not title:
            continue
        if not title:
            title = code
            code = None
        if not code and re.match(r'^(Hou?r?s?/?|Course Title\b.*|Wee?k?)$', title.strip()):
            continue
        out.append({'code': code, 'title': title, 'l': None, 't': None, 'p': None, 'c': None,
                    'flag': 'malformed_table_verify_manually'})
    return out


def parse_blob_lines(text):
    """Line-based fallback for PDFs with no ruling lines (Biomedical Sciences)."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    out = []
    pending = None
    for line in lines:
        if re.match(r'^Semester\s*[-–]', line):
            pending = None
            continue
        if line in ('Hours/ Week', 'Hours/', 'Week', 'L T P') or re.fullmatch(r'Code Course Title C', line):
            continue
        if 'Total Learning Credits' in line:
            pending = None
            continue
        m = re.fullmatch(r'(\d)\s+(\d)\s+(\d)\s+(\d+)', line)
        if m and pending is not None and pending['l'] is None:
            pending['l'], pending['t'], pending['p'], pending['c'] = m.groups()
            continue
        m = CODE_RE.match(line)
        if m:
            code, rest = m.groups()
            m2 = re.match(r'^(.*?)\s+(\d)\s+(\d)\s+(\d)\s+(\d+)$', rest)
            if m2:
                title, l, t, p, c = m2.groups()
                flag = None
            else:
                title, l, t, p, c = rest.strip(), None, None, None, None
                flag = 'ltpc_shared_or_missing'
            row = {'code': code, 'title': title.strip(), 'l': l, 't': t, 'p': p, 'c': c, 'flag': flag}
            out.append(row)
            pending = row
            continue
        m3 = re.match(r'^(.+?)\s+(\d+)$', line)
        if m3 and len(m3.group(1)) > 3:
            label, cred = m3.groups()
            out.append({'code': None, 'title': label.strip(), 'l': None, 't': None, 'p': None, 'c': cred,
                        'flag': 'no_code_placeholder'})
            pending = None
            continue
    return out


def split_multiline_row(row):
    """A few documents merge two course rows into one table row when there's
    no ruling line between them (e.g. NCC/NSO sharing one cell, each on its
    own line). If every non-empty cell has exactly the same 2 newline-
    separated lines, split it into two ordinary rows. Leave anything else
    (including the many-line 'blob' wrapper-table rows) untouched."""
    line_counts = [len(str(c).split('\n')) for c in row if c]
    if not line_counts or max(line_counts) != 2 or any(lc not in (1, 2) for lc in line_counts):
        return [row]
    rows = []
    for k in range(2):
        new_row = []
        for c in row:
            if c is None:
                new_row.append(None)
            else:
                parts = str(c).split('\n')
                new_row.append(parts[k] if len(parts) == 2 else (parts[0] if k == 0 else None))
        rows.append(new_row)
    return rows


def semester_from_row(row):
    for cell in row:
        if not cell or str(cell).count('\n') > 1:
            continue
        sem = parse_semester_num(str(cell))
        if sem is not None:
            return sem
    return None


def extract_standard(pdf_path, max_pages=20):
    """Each pdfplumber table resolves its own semester state independently —
    never carried across tables. This matters because side-by-side column
    tables (two semesters per page) are not always returned in semester
    order (pdfplumber sorts by bbox position, and a right-column table can
    have a slightly higher top-y than its left-column neighbour), so a
    cross-table 'current+1' state machine breaks. Some documents also merge
    two semesters into one table object (a second 'Semester - N' marker row
    appears mid-table) — handled by simply re-triggering on any marker found,
    with no '+1' constraint, and resetting to 'unknown' at each new table so
    unrelated later tables (CLO/detail pages) can never inherit state."""
    rows_out = []
    with pdfplumber.open(pdf_path) as pdf:
        n = min(max_pages, len(pdf.pages))
        for page in pdf.pages[:n]:
            for t in page.find_tables():
                data = t.extract()
                if not data:
                    continue
                current_sem = 0
                sem_entries = []  # (sem, entry) per row, before wrap-merge
                for raw_row in data:
                    for row in split_multiline_row(raw_row):
                        sem_here = semester_from_row(row)
                        if sem_here is not None:
                            current_sem = sem_here
                            continue
                        if current_sem == 0:
                            continue
                        r = parse_row_flexible(row)
                        if r is None or r == 'STOP':
                            continue
                        sem_entries.append((current_sem, r))
                # merge wrapped-title rows within each contiguous same-semester run
                i = 0
                while i < len(sem_entries):
                    j = i
                    while j < len(sem_entries) and sem_entries[j][0] == sem_entries[i][0]:
                        j += 1
                    merged = merge_wrapped_entries([e for _, e in sem_entries[i:j]])
                    for m in merged:
                        m['sem'] = sem_entries[i][0]
                        rows_out.append(m)
                    i = j
    return rows_out


def extract_text_fallback(pdf_path, max_pages=20):
    rows_out = []
    with pdfplumber.open(pdf_path) as pdf:
        n = min(max_pages, len(pdf.pages))
        for page in pdf.pages[:n]:
            text = page.extract_text() or ''
            if 'Semester' not in text:
                continue
            chunks = re.split(r'(?=Semester\s*[-–]\s*[IVX]+)', text)
            for chunk in chunks:
                sem = parse_semester_num(chunk.split('\n')[0]) if chunk.strip().startswith('Semester') else None
                if sem is None:
                    m = re.match(r'^Semester\s*[-–]\s*([IVX]+)', chunk.strip())
                    if m:
                        sem = roman_to_int(m.group(1))
                if sem is None:
                    continue
                for r in parse_blob_lines(chunk):
                    r['sem'] = sem
                    rows_out.append(r)
    return rows_out


def extract_multi_track(pdf_path, max_pages=25, expected_sems_by_track=None):
    """For documents like Film Technology that bundle multiple specialization
    tracks in one PDF. Returns dict: track_name -> list of row dicts (with 'sem')."""
    results = {}
    wrapper_tables = {}
    current_track = None
    with pdfplumber.open(pdf_path) as pdf:
        n = min(max_pages, len(pdf.pages))
        for page in pdf.pages[:n]:
            text = page.extract_text() or ''
            lines = [l.strip() for l in text.split('\n') if l.strip()]
            for j in range(len(lines) - 1):
                if looks_like_track_name(lines[j]) and re.match(r'^[789]\.', lines[j + 1]):
                    current_track = lines[j]
                    break
            track_key = current_track or 'UNKNOWN'
            for t in page.find_tables():
                rows = t.extract()
                if rows and rows[0] and rows[0][0] and 'Programme (Semester-wise)' in str(rows[0][0]):
                    wrapper_tables.setdefault(track_key, []).append(rows)
                sem = is_clean_semester_table(rows)
                if sem is None:
                    continue
                results.setdefault(track_key, [])
                for r in rows_from_clean_table(rows):
                    r['sem'] = sem
                    results[track_key].append(r)
    if expected_sems_by_track:
        for track, expected in expected_sems_by_track.items():
            found = set(r['sem'] for r in results.get(track, []))
            missing = sorted(set(expected) - found)
            for sem in missing:
                for wrows in wrapper_tables.get(track, []):
                    recovered = recover_malformed_semester(wrows, sem)
                    if recovered:
                        for r in recovered:
                            r['sem'] = sem
                        results.setdefault(track, []).extend(recovered)
                        break
    return results


def get_cover_specialization(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        text = pdf.pages[0].extract_text() or ''
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    spec_lines = []
    capture = False
    for l in lines:
        if re.fullmatch(r'in|In', l):
            capture = True
            continue
        if capture:
            if re.match(r'(Four|Three) Years?', l):
                break
            spec_lines.append(l)
    spec = ' '.join(spec_lines).strip('() ')
    return spec or None


def main():
    all_files = sorted(PDF_DIR.glob('*.pdf'))
    records = []
    file_summaries = []

    for pdf_path in all_files:
        fname = pdf_path.name
        if fname in ALREADY_SEEDED:
            file_summaries.append({'file': fname, 'status': 'skipped_already_seeded'})
            continue

        if fname in MULTI_TRACK_FILES:
            track_results = extract_multi_track(pdf_path, expected_sems_by_track=FILM_TECH_EXPECTED)
            n_rows = 0
            n_flagged = 0
            for track, rows in track_results.items():
                spec = "Film Technology" if track == "FILM TECHNOLOGY" else f"Film Technology - {track.title()}"
                for r in rows:
                    records.append({
                        'regulation': '2024', 'course_code': r['code'], 'subject_title': r['title'],
                        'semester': r['sem'], 'program_course': 'BSc', 'specialization': spec,
                        'l': r['l'], 't': r['t'], 'p': r['p'], 'c': r['c'],
                        'flag': r['flag'] or '', 'source_file': fname,
                    })
                    n_rows += 1
                    if r['flag']:
                        n_flagged += 1
            file_summaries.append({
                'file': fname, 'status': 'ok_multi_track', 'programme': 'BSc - Film Technology (6 tracks)',
                'regulation': '2024', 'rows': n_rows, 'flagged': n_flagged,
                'tracks': {k: sorted(set(r['sem'] for r in v)) for k, v in track_results.items()},
            })
            continue

        if fname in TEXT_FALLBACK_FILES:
            rows = extract_text_fallback(pdf_path)
            course, spec = FILE_META.get(fname, ("BSc", get_cover_specialization(pdf_path)))
        else:
            rows = extract_standard(pdf_path)
            course, spec = FILE_META.get(fname, (None, None))
            if course is None:
                file_summaries.append({'file': fname, 'status': 'ERROR_unmapped_file'})
                continue

        n_flagged = sum(1 for r in rows if r['flag'])
        sems_found = sorted(set(r['sem'] for r in rows))
        for r in rows:
            records.append({
                'regulation': '2024', 'course_code': r['code'], 'subject_title': r['title'],
                'semester': r['sem'], 'program_course': course, 'specialization': spec,
                'l': r['l'], 't': r['t'], 'p': r['p'], 'c': r['c'],
                'flag': r['flag'] or '', 'source_file': fname,
            })
        file_summaries.append({
            'file': fname, 'status': 'ok' if rows else 'ERROR_no_rows_extracted',
            'programme': f'{course} - {spec}', 'regulation': '2024',
            'rows': len(rows), 'flagged': n_flagged, 'semesters_found': sems_found,
        })

    csv_path = OUT_DIR / 'syllabus_extracted.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=['regulation', 'course_code', 'subject_title', 'semester',
                                           'program_course', 'specialization', 'l', 't', 'p', 'c',
                                           'flag', 'source_file'])
        w.writeheader()
        for r in records:
            w.writerow(r)

    json_path = OUT_DIR / 'file_summaries.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(file_summaries, f, indent=2, ensure_ascii=False)

    print(f"Total records: {len(records)}")
    print(f"CSV written to: {csv_path}")
    for s in file_summaries:
        print(s)


if __name__ == '__main__':
    main()

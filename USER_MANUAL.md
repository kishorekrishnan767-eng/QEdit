# QPaper Editor — User Manual

> **Version 0.1.0** · Crafted with 💚 by Chan's Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Interface Overview](#3-interface-overview)
4. [Header Details](#4-header-details)
5. [Managing Sections (Parts)](#5-managing-sections-parts)
6. [Adding & Editing Questions](#6-adding--editing-questions)
7. [Question Types](#7-question-types)
8. [Advanced Question Features](#8-advanced-question-features)
9. [Reordering & Deleting Questions](#9-reordering--deleting-questions)
10. [Page Setup](#10-page-setup)
11. [Preview Panel](#11-preview-panel)
12. [Saving as PDF](#12-saving-as-pdf)
13. [Keyboard & UI Tips](#13-keyboard--ui-tips)
14. [FAQ & Troubleshooting](#14-faq--troubleshooting)

---

## 1. Introduction

**QPaper Editor** is a web-based question paper generator designed for educators and academic institutions. It provides a split-screen interface where you type your exam content on the left and see a live, print-ready A4 preview on the right — eliminating the formatting struggles of traditional word processors.

### Key Highlights

- **Live A4 Preview** — See exactly how your question paper will look on printed paper.
- **Automatic Pagination** — Content automatically flows across multiple A4 pages.
- **Multi-Part Support** — Organize questions into Part A, B, C, etc.
- **OBE Support** — Bloom's Level (BL), Course Outcome (CO), and Programme Outcome (PO) columns.
- **Multiple Question Types** — Short answer, long answer, and MCQ.
- **OR Questions & Sub-questions** — Support for either/or choices and sub-parts (i, ii, iii…).
- **One-Click PDF Export** — Generate a landscape PDF with two pages per sheet, ready for printing.

---

## 2. Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)

### Installation & Running

1. Open a terminal and navigate to the project folder:
   ```
   cd "Qpaper App/qpaper-editor"
   ```

2. Install dependencies (first time only):
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

You will see the QPaper Editor with a split-screen layout.

---

## 3. Interface Overview

The application is divided into **two panels**:

| Panel | Description |
|-------|-------------|
| **Left Panel (Editor)** | Where you fill in header details, manage sections, and add/edit questions. |
| **Right Panel (Preview)** | A live, read-only A4 preview of your question paper that updates in real-time. |

### Top Toolbar (Left Panel)

The top bar contains:

- **QPaper Logo** — Displayed at the top-left corner.
- **Page Setup** button — Opens a modal to configure display options and layout settings.
- **Save as PDF** button — Generates and downloads the question paper as a PDF file.

---

## 4. Header Details

The **Header Details** section is the first card in the editor panel. It lets you configure the metadata that appears at the top of your question paper.

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Institution Name** | Name of your university/institution | SRM Institute of Science and Technology |
| **College** | Faculty or college name | Faculty of Science and Humanities, KTR |
| **Department** | Department name | Department of Computer Applications |
| **Exam Name** | Type of examination | Model Examination |
| **Course Code** | Subject/course code | UCS2401 |
| **Subject** | Subject name | Data Structures |
| **Class** | Year + Course + Specialization (3 dropdowns) | II BCA DS |
| **Semester** | ODD or EVEN | ODD |
| **Reg No. Boxes** | Number of registration number boxes (5–20) | 15 |
| **Date** | Exam date (optional, date picker) | 14-02-2026 |
| **Duration** | Hours + Minutes dropdowns | 3 Hours |
| **Total Marks** | Maximum marks for the paper | 100 |
| **Institution Logo** | Upload a custom logo image | — |

### Text Formatting Toggles

Located next to the "Header Details" heading, you'll find two small toggles:

- **Auto Caps** — When enabled, automatically capitalizes the first letter of every word (Title Case) as you type in header fields and question text.
- **ALL CAPS** — When enabled, converts all text to uppercase as you type.

### Logo Options

- **Upload** — Click "Choose File" to upload a custom institution logo.
- **Reset** — Reverts the logo back to the default SRM logo.
- **Delete** — Removes the logo entirely.

### Collapsing the Header

Click the **▲/▼ chevron** button on the right side of the "Header Details" heading to collapse or expand this section, giving you more room for managing questions.

---

## 5. Managing Sections (Parts)

Question papers are organized into **sections** (also called "Parts"). Each section represents a distinct part of the paper (e.g., Part A, Part B, Part C).

### Adding a New Section

Click the **"+ Add New Part"** button (dashed green border) to add a new section. The app automatically assigns the next available letter (A through G).

### Configuring a Section

Click the **⚙ Settings** icon next to any section heading to open the Section Configuration modal:

| Setting | Description |
|---------|-------------|
| **Part Name** | Select from A through G |
| **Questions to Answer** | "Answer ALL" or specify a number (e.g., "Answer any 3") |
| **Default Marks per Question** | Set a uniform mark value for all questions in this section. When set, individual question marks are locked to this value. |

### Deleting a Section

In the Section Configuration modal, click **"Delete Section"** (red, bottom-left). You cannot delete the last remaining section.

### Active Section

The currently active (selected) section is highlighted with a **green border and light green background**. Click on any section card to make it active — new questions will be added to the active section.

---

## 6. Adding & Editing Questions

### Adding a Question

1. Click the **"+ Add Question"** button on the section where you want to add the question.
2. A modal will open with the **Question Form**.
3. Fill in the fields (see below) and click **"Add Question"**.

### Editing a Question

1. Click the **✏ Pencil** icon next to the question you want to edit.
2. The same modal opens, pre-filled with the question's current data.
3. Make your changes and click **"Update Question"**.

### Question Form Fields

| Field | Description |
|-------|-------------|
| **Question Text** | The main question text. Supports multi-line input. |
| **Marks** | Point value for this question. Disabled if the section has default marks set. |
| **Type** | Short Answer, Long Answer, or Multiple Choice (MCQ). |
| **BL** | Bloom's Level (1–6). Only visible when BL/CO/PO is enabled. |
| **CO** | Course Outcome (1–5). Only visible when BL/CO/PO is enabled. |
| **PO** | Programme Outcome (1–12). Only visible when BL/CO/PO is enabled. |

---

## 7. Question Types

### Short Answer
Standard question expecting a brief response. This is the default type.

### Long Answer
Same as short answer in the editor, but can be used to semantically distinguish essay-type questions.

### Multiple Choice (MCQ)
When you select "Multiple Choice" as the type, **four option fields** (a, b, c, d) appear below. Fill in each option text. Empty options are automatically removed from the preview.

---

## 8. Advanced Question Features

### OR Questions (Either/Or)

To create a question with an alternative choice:

1. In the Question Form, check the **"Add OR Question"** checkbox.
2. An additional section appears where you can type the alternative question text.
3. You can also set separate BL/CO/PO values for the OR question.
4. In the preview, the two choices appear as **A.** and **B.** separated by **(OR)**.

### Sub-questions (i, ii, iii…)

To add sub-parts to a question:

1. Check the **"Add Sub-questions"** checkbox in the Question Form.
2. A sub-question form appears. The first sub-question is added automatically.
3. For each sub-question, you can set:
   - **Text** — The sub-question content
   - **Marks** — Optional individual marks
   - **BL / CO / PO** — Individual taxonomy values (if enabled)
4. Click **"+ Add Sub-question"** to add more sub-parts.
5. Use the **🗑 trash** icon to remove a sub-question.

Sub-questions are labeled with Roman numerals: i), ii), iii), iv).

---

## 9. Reordering & Deleting Questions

### Reordering via Arrows

Each question in the question list has **▲ (up)** and **▼ (down)** arrow buttons on the left. Click these to move a question up or down within its section.

### Reordering via Drag & Drop

Questions are **draggable**. Simply click and drag a question to a new position within the same section.

### Inserting Page Breaks

Click the **"BR Break"** button on any section to insert a manual page break at the current position. Page breaks appear as a dashed line labeled "--- Page Break ---" in the question list.

Page breaks force the preview to start content on a new A4 page from that point onward.

### Deleting a Question

Click the **🗑 trash** icon on the right side of any question to delete it. Page break entries can also be deleted the same way.

---

## 10. Page Setup

Click the **"Page Setup"** button in the top toolbar to open the Page Setup modal. It contains two sections:

### Display Options

| Toggle | Description |
|--------|-------------|
| **Show BL / CO / PO columns** | Toggle the Bloom's Level, Course Outcome, and Programme Outcome columns on/off in the preview. |
| **Show Institution Logo** | Display the institution logo at the top-left of the first page. |
| **Logo Size** | Slider (30–120px) to adjust the logo size. Only visible when logo is enabled. |
| **Logo Watermark on Pages** | Overlay a faint, centered watermark of the logo on every page. |
| **Watermark Opacity** | Slider (1–15%) to control watermark transparency. Only visible when watermark is enabled. |
| **Watermark Size** | Slider (80–400px) to control watermark dimensions. Only visible when watermark is enabled. |

### Layout Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Line Spacing** | Controls the line height of all text (1.0–3.0) | 1.5 |
| **Font Size** | Text size in points (8–24pt) | 12pt |
| **Margins** | Top, Bottom, Left, Right margins in millimeters | 15mm each |

### Reset Defaults

Click **"Reset Defaults"** at the bottom-left of the modal to restore all layout settings to their original values.

---

## 11. Preview Panel

The right half of the screen displays a **live A4 preview** of your question paper.

### What You'll See

- **Page Header** — Institution name, college, department, exam name, course code, subject, class, semester, date, registration number boxes, duration, and total marks.
- **Section Headers** — Part name, answering instructions, and marks calculation (e.g., "10 x 2 = 20 Marks").
- **Numbered Questions** — Questions are automatically numbered **continuously across all parts** (1, 2, 3, …). They do not reset per section.
- **BL/CO/PO Columns** — Shown as right-aligned columns next to each question (if enabled).
- **MCQ Options** — Displayed in a 2-column grid labeled (a), (b), (c), (d).
- **OR Questions** — Shown with A./B. labels separated by "(OR)".
- **Sub-questions** — Displayed with Roman numeral labels (i, ii, iii, iv).
- **Page Numbers** — Shown at the bottom-right of each page (not printed in PDF).

### Automatic Pagination

The preview automatically detects when content exceeds an A4 page and flows it to the next page. Combined with manual page breaks, you get complete control over pagination.

### Zoom Control

A **zoom slider** is located at the bottom-right corner of the preview panel:

- Drag the slider to zoom in (up to 150%) or zoom out (down to 40%).
- Click **"Reset"** to return to the default 75% zoom level.
- The current zoom percentage is displayed next to the slider.

---

## 12. Saving as PDF

### How to Generate a PDF

1. Ensure your question paper is complete and looks correct in the preview.
2. Click the green **"Save as PDF"** button in the top toolbar.
3. The button will show **"Generating…"** while the PDF is being created.
4. The PDF will automatically download once ready.

### PDF Format

- **Orientation:** Landscape A4
- **Layout:** Two question paper pages per sheet (side by side), optimized for double-sided printing.
- **File Name:** Uses the subject name (e.g., `Data Structures.pdf`). Falls back to `question-paper.pdf` if no subject is specified.
- **Font:** Times New Roman (serif), matching the preview.

### Tips for Best PDF Quality

- Set your zoom to any level — the PDF always captures at full resolution regardless of zoom.
- Ensure all content fits properly on pages before exporting.
- The watermark and logo will be included in the PDF as shown in the preview.

---

## 13. Keyboard & UI Tips

| Tip | Description |
|-----|-------------|
| **Tab through fields** | Use the Tab key to quickly move between input fields in the header and question forms. |
| **Collapse the header** | Collapse the Header Details section to see more sections at once. |
| **Use default marks** | Set "Default Marks per Question" in section settings to avoid entering marks for every question individually. |
| **Check the mark total** | The preview shows the calculated marks for each section (e.g., "10 x 2 = 20 Marks"). |
| **Preview zoom** | Zoom out to see more pages at once, zoom in to check fine details. |

---

## 14. FAQ & Troubleshooting

### Q: The preview shows blank pages or content is cut off.
**A:** Check your margin settings in Page Setup. Very large margins reduce usable space. Try resetting to defaults (15mm each).

### Q: My questions are not numbered correctly.
**A:** QPaper uses **continuous numbering** across all sections. Question 1 starts in Part A, and numbering continues through Part B, C, etc. Page break entries are not counted.

### Q: The logo doesn't appear in the preview.
**A:** Make sure "Show Institution Logo" is enabled in Page Setup. If you uploaded a custom logo, verify the file is a valid image (PNG, JPG, etc.).

### Q: I can't change the marks for a question.
**A:** If the section has "Default Marks per Question" configured, individual question marks are locked to that value. Remove the default marks in section settings to unlock individual mark editing.

### Q: The PDF generation failed.
**A:** This can happen if the preview contains very large images or many pages. Try:
- Reducing watermark/logo size
- Ensuring the browser tab has enough memory (close other tabs)
- Trying again after a few seconds

### Q: How do I create a new question paper from scratch?
**A:** Currently, the app loads with pre-filled institution defaults. Simply clear the fields you want to change. A full "New Paper" / "Reset" feature may be added in future versions.

---

> **Need help?** Reach out to Chan's Team for support and feature requests.

---

*QPaper Editor v0.1.0 — Making question paper creation simple, beautiful, and stress-free.*

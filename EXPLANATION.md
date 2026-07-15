# QEdit — Technical Explanation & Architecture Guide

This document provides a comprehensive technical overview of **QEdit**, explaining its architecture, how the core features (live preview and PDF generation) work under the hood, how you would write this code manually, and answers to questions a client is likely to ask.

---

## 1. Executive Summary & Purpose

**QEdit** is a specialized web application designed for academic institutions to create, format, collaborate on, and export university exam question papers. 

### The Problem It Solves
Historically, professors format question papers manually in Microsoft Word or LaTeX. This leads to:
*   **Inconsistent formatting**: Margins, fonts, alignment, and spacing differ across departments.
*   **Page-budget overflows**: A paper designed for 2 pages runs into 3 pages due to a single long line, causing paper waste.
*   **Tedious calculations**: Marks per section, question numbering, and Bloom's Level (BL) / Course Outcome (CO) / Program Outcome (PO) tables must be counted and aligned manually.
*   **Security risks**: Sharing draft papers via email or flash drives is insecure.

### The Solution
QEdit provides a **split-pane, browser-based editor**:
1.  **Form-based input on the left**: Simplifies entry of headers, sections, questions, sub-questions, and OR-choices.
2.  **Live, pixel-accurate A4 preview on the right**: Automatically paginates content in real-time, matching standard university layouts.
3.  **One-click PDF generation**: Assembles the paper into print-ready A4 vertical pages or paper-saving 2-up landscape booklets (common for short tests).

---

## 2. Technical Stack

| Component | Technology | Rationale / Why We Used It |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Provides server-side rendering (SSR) for fast initial loads, a file-system router, and built-in API routes (Route Handlers) so we don't need a separate Express.js server. |
| **Language** | **TypeScript 5** | Restricts variables to specific types (e.g., `Question`, `Section`). This prevents runtime errors like undefined properties, which is crucial when handling complex nested structures like question parts and options. |
| **Core UI Library** | **React 19** | Powers the component architecture. States like `paperData` flow reactively. When you type in a question on the left, the A4 page on the right updates instantly. |
| **Styling Engine** | **TailwindCSS 4** | Allows rapid styling with utility classes. Built-in modern variables support smooth layouts and glassmorphism. |
| **Database & Auth** | **Supabase (PostgreSQL)** | Combines a relational database with built-in user authentication (Google OAuth & Email/Password) and Row-Level Security (RLS). This saves hundreds of hours of backend setup. |
| **Email Delivery** | **Nodemailer (SMTP)** | Sends email notifications for access requests, approvals, and password resets using a secure SMTP configuration. |
| **PDF Generation** | **html2canvas + jsPDF** | Generates the PDF on the client's device, bypassing server load and protecting privacy. |

---

## 3. How the Live A4 Preview Works

The live preview is the most complex frontend feature. It mirrors exactly what will appear on paper.

### The Auto-Pagination Mechanism
Standard A4 dimensions are **210mm in width** and **297mm in height**. 

In `components/Preview.tsx`, we handle pagination through the following programmatic steps:

1.  **Double Rendering**:
    *   We render a **hidden measuring container** (`measureRef`) off-screen with visibility set to `hidden`. This container holds the raw, continuous list of elements (headers, sections, questions) in a single stream.
    *   We render the **actual pages** visible on-screen, grouped by page indexes.
2.  **Converting Dimensions**:
    *   We retrieve the width of the hidden container in pixels using `getBoundingClientRect()`.
    *   We determine the pixels-per-millimeter ratio:  
        $$\text{pxPerMm} = \frac{\text{containerWidth}}{210}$$
3.  **Usable Height Calculation**:
    *   We get the top/bottom margins in millimeters from the paper's settings (default: 15mm).
    *   We calculate the exact height in pixels available for content on a single A4 page:  
        $$\text{usableHeight} = (297 - \text{marginTop} - \text{marginBottom} - \text{safetyBuffer}) \times \text{pxPerMm}$$
    *   A $0.5\text{mm}$ safety buffer prevents content from rubbing against the page margin.
4.  **Measuring Elements**:
    *   A `useEffect` hook runs after the DOM updates (debounced by 50ms).
    *   It loops through the child nodes of the hidden measuring container and records the top and bottom offsets of each element.
5.  **Page Splitting Logic**:
    *   We iterate through the elements:
        *   If the current element is a **manual page break** (user inserted a break card), we force a new page group.
        *   If the element's cumulative bottom edge exceeds the `usableHeight` relative to the top of the current page, it overflows. We automatically create a new page group and start laying out subsequent elements on this new page.
6.  **Zoom Scaling**:
    *   To fit the A4 page on standard laptop screens alongside the form editor, we apply a CSS transformation: `transform: scale(scaleValue)`. A slider at the bottom-right allows the user to scale from 40% up to 150%.

---

## 4. How the PDF Download Works

The PDF generation logic resides in `components/Editor.tsx` within the `handlePrint()` function.

### The Generation Pipeline
1.  **Scale Reset**:
    *   Because the live preview container might be zoomed out (e.g., scaled to $0.75$), capturing it directly would result in low-resolution, shrunken canvases.
    *   The function temporarily overrides the scale: `scaledWrapper.style.transform = 'none'`. This forces the browser to render the pages at full size ($100\%$) for the duration of the capture.
2.  **Tailwind CSS v4 Color Compatibility Hack**:
    *   TailwindCSS v4 uses modern CSS color spaces like `oklch()` and `lab()` (e.g., `oklch(0.6 0.15 120)`).
    *   The `html2canvas` library does not support these modern CSS color spaces and renders them as invisible/white.
    *   **Our Solution**: The code inspects the computed styles of every element. If a color uses `lab(` or `oklch(`, it dynamically overrides the style to standard black (`#000`) or transparent for backgrounds before capturing.
3.  **Dynamic Library Loading**:
    *   `html2canvas` and `jsPDF` are large libraries. To improve the initial page load time, we import them dynamically only when the user clicks the "Download PDF" button:
        ```typescript
        const html2canvasModule = await import('html2canvas');
        const { jsPDF } = await import('jspdf');
        ```
4.  **Canvas Capture**:
    *   We select all elements with the attribute `[data-page-index]`.
    *   For each page, we run `html2canvas` with a `scale: 2` setting. This captures the DOM node at double resolution (high DPI), making text crisp when printed.
5.  **Booklet Compilation (2-Up Layout for Cycle Tests)**:
    *   The client uses a landscape layout to print short tests (Cycle Tests) side-by-side to save paper.
    *   **The Logic**: If the exam title contains words like "cycle", "cyclic", or "cylic":
        *   We create a landscape A4 sheet in `jsPDF` ($297\text{mm} \times 210\text{mm}$).
        *   We divide the sheet into a left half and a right half.
        *   For each pair of pages (e.g., page 0 and page 1), we render them side-by-side on one landscape sheet using `pdf.addImage()`, applying aspect ratio logic so the pages fit the slots.
        *   If there is only 1 page, it duplicates it on the right side so two copies of the same test can be cut out of a single printed sheet.
6.  **Standard Layout (Portrait for Model/Semester Exams)**:
    *   If the exam is a standard test (like a Model Exam), we instantiate a standard portrait A4 canvas ($210\text{mm} \times 297\text{mm}$) and append one page per PDF sheet.
7.  **Restoring Editor State**:
    *   We restore the zoom transformation back to what the user had selected and save the file with the format `${subject-name}.pdf`.

---

## 5. How to Build This Manually (Step-by-Step)

If you had to write the code for QEdit completely by hand, this is the step-by-step roadmap you would follow:

### Step 1: Initial Framework Setup
1.  Initialize a Next.js application using TypeScript:
    ```bash
    npx create-next-app@latest qpaper-editor --typescript --tailwind --app
    ```
2.  Install dependencies:
    *   Supabase: `@supabase/supabase-js`, `@supabase/ssr` (for managing cookies and auth session states).
    *   PDF utilities: `html2canvas`, `jspdf`.
    *   Icons and effects: `lucide-react`, `canvas-confetti`.

### Step 2: Establish the Database Schema
In Supabase, create the following PostgreSQL tables:
1.  `authorized_users`: To store registration requests and roles (`admin`, `user`), set up with a default state of `pending`.
2.  `question_papers`: To store the JSON payload of the papers. The column `paper_data` is configured as a `JSONB` type.
3.  `collaborations`: Stores foreign keys (`paper_id` and `collaborator_email`) with permissions (`view` or `edit`).
4.  Enable Row-Level Security (RLS) and define policies using custom SQL functions to prevent non-owners/non-collaborators from retrieving or modifying papers.

### Step 3: Configure Authentication & Middleware
1.  Create login, registration, and password reset pages in `/app/auth/`.
2.  Set up `middleware.ts` to intercept routing. Using cookie verification, redirect unauthenticated users to `/auth` and redirect authenticated users to `/dashboard`.
3.  Create an API route `/api/auth/check-access` to verify if the logging-in email exists in `authorized_users` and is `approved`. If not, write their email to the database as `pending` and redirect them to a pending approval landing page.

### Step 4: Build the Left-Side Input Forms
1.  Create forms to gather header metadata (subject, course code, duration, max marks).
2.  Build state handlers in React using `useState` or `useReducer` to manage the list of sections. Each section contains an array of `Question` objects.
3.  Create helper components:
    *   `QuestionForm.tsx` to capture question details, Bloom's levels, MCQ options, alternative (OR) choices, and sub-questions.

### Step 5: Implement the Live Preview with Measuring
1.  Create `Preview.tsx`.
2.  Establish the hidden measuring `div` off-screen, rendering all elements contiguously using standard Times New Roman typography.
3.  Write the measurement algorithm in a React `useEffect` hook. Compare the child heights to the usable A4 height (calculated in pixels). Group children index arrays (`pageGroups`).
4.  Render the final output using a layout map that loops through the groups and places each page in a card styled with a white background and drop shadows.

### Step 6: Write the Export Functions
1.  Implement the canvas capturing script using `html2canvas` on the page cards.
2.  Write the translation script to clean up TailwindCSS colors.
3.  Write the layout assembler logic inside the export function using `jsPDF` as described in Section 4.

### Step 7: Add Collaboration & Email Alerts
1.  Create the sharing modal.
2.  Write API routes for Nodemailer to send emails when access is requested or approved.

---

## 6. Client Q&A Cheat Sheet (Anticipated Questions)

Here are answers to questions the client or technical reviewers will ask during presentations:

### Q1: Why did you choose client-side PDF generation instead of server-side (like Puppeteer or PDFKit)?
*   **Response**: 
    1.  **Cost & Performance**: Client-side rendering is serverless and free. The user's device does the heavy lifting, saving server costs.
    2.  **Instant Feedback**: There is no delay uploading data to a server and waiting for a PDF download stream.
    3.  **Privacy**: Exam papers are sensitive document drafts. Keeping the generation pipeline local on the user's browser ensures that raw paper images are never exposed to external renderers.
    4.  **Consistency**: Because we use `html2canvas` directly on the rendered DOM, what the user sees in the web preview is exactly what is generated in the PDF file.

### Q2: How does the application prevent large images (like university logos) from bloating the database?
*   **Response**: We run a cleanup step in `lib/supabase/papers.ts` called `sanitizePaperData()` before pushing paper modifications. If a user uploads a high-resolution logo, it is removed from the inline JSON payload and saved separately, keeping the database rows lightweight and fast to read.

### Q3: What happens if a question text is extremely long? Will it get cut off?
*   **Response**: No. The dynamic pagination code calculates the cumulative height of each child element. If a long question cannot fit in the remaining space of Page 1, it is cleanly pushed to Page 2. We use CSS page-break rules (`break-inside-avoid` and `break-after-page`) to ensure questions, their sub-parts, and their OR-alternatives do not split in half across page folds.

### Q4: Why did you choose Supabase over a custom Node.js/Express backend?
*   **Response**: Supabase gives us a production-grade PostgreSQL database with built-in Row-Level Security (RLS). RLS allows us to write security rules directly in the database (e.g., *"Only allow updates to a row in `question_papers` if the user's email is in the `collaborations` table for that paper"*). This eliminates the need to write custom authentication and authorization middleware in a node backend, reducing the attack surface.

### Q5: How is registration secured? Can anyone log in and view papers?
*   **Response**: No. The system has an **admin-gate**. When a new user logs in via Google or signs up, their account is marked as `pending`. They cannot access the dashboard or write papers. Only after the system administrator (whose email is hardcoded as `ADMIN_EMAIL`) logs in and marks their status as `approved` in the admin panel can the user access the system.

### Q6: Can two users edit the same paper at the exact same time?
*   **Response**: Currently, the app is built with **auto-saving collaboration**. If two users open the same paper, their changes auto-save drafts to Supabase with a 5-second debounce. To avoid merge conflicts, we track the `updated_at` timestamps, ensuring that the latest changes are saved, and we display a clear save status indicator so the users know when their changes have been written to the cloud.

### Q7: Why are Cycle Tests printed as two-column booklets?
*   **Response**: In many colleges, Cycle Tests are shorter (e.g., 50 marks, 1.5 hours) and fit on one A4 sheet of paper. To save paper and budget, the institution prints these in a landscape layout, folds the sheet in half, or cuts it. Our system automatically detects the word "cycle" in the exam header and configures the `jsPDF` canvas to place Pages 1 and 2 side-by-side, aligning with this standard printing practice.

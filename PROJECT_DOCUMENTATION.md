# QEdit — Question Paper Editor

## Complete Project Documentation

> **QEdit** is a full-stack web application for creating, formatting, collaborating on, and exporting university exam question papers. Built with **Next.js 16**, **Supabase**, and **TypeScript**, it provides a real-time editor with live A4 preview, role-based access control, admin approval workflows, collaboration features, and PDF export — all wrapped in a premium dark-green glassmorphism UI.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Folder Structure](#3-folder-structure)
4. [Architecture & Data Flow](#4-architecture--data-flow)
5. [Authentication & Authorization System](#5-authentication--authorization-system)
6. [Database Schema](#6-database-schema)
7. [Application Pages & Routes](#7-application-pages--routes)
8. [API Routes (Backend)](#8-api-routes-backend)
9. [Core Components](#9-core-components)
10. [Library / Utility Modules](#10-library--utility-modules)
11. [Type Definitions](#11-type-definitions)
12. [Collaboration & Sharing System](#12-collaboration--sharing-system)
13. [Email Notification System](#13-email-notification-system)
14. [PDF Export System](#14-pdf-export-system)
15. [Middleware & Session Management](#15-middleware--session-management)
16. [Environment Variables](#16-environment-variables)
17. [Deployment](#17-deployment)
18. [Key Features Summary](#18-key-features-summary)

---

## 1. Project Overview

**QEdit** (Question Paper Editor) is a specialized web application designed for educational institutions (primarily SRM Institute of Science and Technology) to streamline the creation and formatting of exam question papers.

### Core Capabilities

| Feature                    | Description                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **Paper Builder**          | Split-pane editor with form-based input on the left and live A4-sized preview on the right   |
| **Multi-Section Support**  | Create multiple parts (A, B, C…) with individual settings for marks, required count, etc.    |
| **Question Types**         | Short answer, long answer, MCQ, manual page breaks                                          |
| **OR Questions**           | Attach an alternative (OR) question to any question                                         |
| **Sub-questions**          | Add sub-parts (i, ii, iii…) to any question                                                 |
| **BL / CO / PO Columns**   | Bloom's Level, Course Outcome, and Program Outcome annotations per question                 |
| **Live A4 Preview**        | Pixel-accurate A4 page preview with automatic pagination                                    |
| **PDF Export**             | Generates a landscape A4 PDF with two pages per sheet (2-up layout)                         |
| **Cloud Save**             | Auto-save drafts (5-second debounce) and manual save to Supabase                            |
| **Collaboration**          | Share papers with other users (view or edit permissions)                                     |
| **Access Requests**        | Non-collaborators can request access; owners approve/deny with email notifications          |
| **Admin Panel (Sys-Ops)**  | Central admin dashboard for managing user approvals                                          |
| **Auth System**            | Google OAuth + Email/Password with admin-gated registration                                 |
| **Password Reset**         | Custom token-based password reset flow with email delivery                                  |

---

## 2. Technology Stack

| Layer          | Technology                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| **Framework**  | [Next.js 16](https://nextjs.org/) (App Router)                            |
| **Language**   | TypeScript 5                                                               |
| **UI Library** | React 19                                                                   |
| **Styling**    | TailwindCSS 4 + inline styles                                             |
| **Font**       | DM Sans (Google Fonts)                                                     |
| **Icons**      | Lucide React                                                               |
| **Backend**    | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Row Level Security)   |
| **Auth**       | Supabase Auth (Google OAuth + Email/Password)                              |
| **Email**      | Nodemailer (SMTP via Gmail)                                                |
| **PDF**        | html2canvas + jsPDF (client-side generation)                               |
| **Analytics**  | Vercel Analytics + Speed Insights                                          |
| **Deployment** | Vercel                                                                     |

---

## 3. Folder Structure

```
qpaper-editor/
├── app/                              # Next.js App Router (pages + API routes)
│   ├── layout.tsx                    # Root layout — DM Sans font, metadata, Vercel analytics
│   ├── page.tsx                      # Root page — redirects to /auth
│   ├── globals.css                   # Global CSS — custom properties, scrollbar, print styles
│   ├── favicon.ico                   # App favicon
│   │
│   ├── auth/                         # Authentication pages
│   │   ├── page.tsx                  # Login page (Google OAuth + Email/Password)
│   │   ├── register/
│   │   │   └── page.tsx              # Registration page
│   │   ├── pending/
│   │   │   └── page.tsx              # "Awaiting Admin Approval" page
│   │   ├── forgot-password/
│   │   │   └── page.tsx              # Forgot password — sends reset email
│   │   ├── reset-password/
│   │   │   └── page.tsx              # Reset password — token-based form
│   │   └── callback/
│   │       └── route.ts             # OAuth callback handler (GET)
│   │
│   ├── dashboard/                    # Main user dashboard
│   │   ├── page.tsx                  # Server component — fetches user papers
│   │   ├── DashboardClient.tsx       # Client component — paper list, rename, delete, share
│   │   ├── create/
│   │   │   └── page.tsx              # Create new paper (wraps Editor component)
│   │   └── edit/
│   │       └── [id]/
│   │           └── page.tsx          # Edit existing paper (wraps Editor component)
│   │
│   ├── paper/                        # Shared/collaboration paper view
│   │   └── [id]/
│   │       └── page.tsx              # Public paper page — access check + request access flow
│   │
│   ├── admin/                        # Admin panel (Sys-Ops)
│   │   ├── page.tsx                  # Server component — admin gate check
│   │   └── AdminClient.tsx           # Client component — user management, approve/reject
│   │
│   └── api/                          # API routes (server-side)
│       ├── admin/
│       │   └── users/
│       │       ├── route.ts          # GET: list users, POST: pre-approve email
│       │       └── [id]/
│       │           └── route.ts      # PATCH: update status, DELETE: remove user
│       ├── auth/
│       │   ├── check-access/
│       │   │   └── route.ts          # POST: check/insert user in authorized_users
│       │   ├── check-authorized/
│       │   │   └── route.ts          # POST: check if email is authorized (legacy)
│       │   ├── forgot-password/
│       │   │   └── route.ts          # POST: generate reset token, send email
│       │   └── reset-password/
│       │       └── route.ts          # POST: validate token, update password
│       └── email/
│           ├── notify-request/
│           │   └── route.ts          # POST: email owner about access request
│           └── notify-approved/
│               └── route.ts          # POST: email requester about approval/denial
│
├── components/                       # Reusable React components
│   ├── Editor.tsx                    # Main paper editor — header form, sections, questions, save/export
│   ├── Preview.tsx                   # Live A4 preview — auto-pagination, zoom, watermark
│   ├── QuestionForm.tsx              # Question input form — text, marks, type, BL/CO/PO, OR, subs
│   ├── ShareModal.tsx                # Share modal — add collaborators, copy link, manage requests
│   └── ui/
│       └── Modal.tsx                 # Generic modal wrapper component
│
├── lib/                              # Library/utility modules
│   ├── constants.ts                  # App constants (e.g. ADMIN_EMAIL)
│   ├── mailer.ts                     # Nodemailer transporter configuration
│   └── supabase/                     # Supabase client configurations
│       ├── client.ts                 # Browser-side Supabase client
│       ├── server.ts                 # Server-side Supabase client (cookie-based)
│       ├── middleware.ts             # Session refresh + auth redirect middleware
│       ├── papers.ts                 # CRUD operations for question_papers table
│       ├── collaborations.ts         # CRUD operations for collaborations table
│       └── access-requests.ts        # CRUD operations for access_requests table
│
├── types/                            # TypeScript type definitions
│   └── index.ts                      # Question, Section, PaperHeader, PaperData, etc.
│
├── public/                           # Static assets
│   ├── logo.png                      # QEdit logo (main)
│   ├── logohead.png                  # QEdit logo (favicon/head)
│   ├── srm.png                       # Default institution logo (SRM)
│   ├── file.svg                      # Icon SVG
│   ├── globe.svg                     # Icon SVG
│   ├── next.svg                      # Next.js logo
│   ├── vercel.svg                    # Vercel logo
│   └── window.svg                    # Icon SVG
│
├── middleware.ts                     # Root middleware — session refresh on all routes
│
├── supabase-schema.sql               # Main DB schema (question_papers, collaborations, RLS)
├── supabase-authorized-users.sql     # Authorized users table schema
├── supabase-access-requests.sql      # Access requests table schema
├── supabase-admin-approval.sql       # Admin approval column migration
├── supabase-password-reset.sql       # Password reset tokens table schema
│
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── next.config.ts                    # Next.js configuration
├── postcss.config.mjs                # PostCSS configuration (TailwindCSS)
├── eslint.config.mjs                 # ESLint configuration
└── .env.local                        # Environment variables (not committed)
```

---

## 4. Architecture & Data Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Client (Browser)                       │
│                                                         │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Auth    │  │  Dashboard   │  │  Editor + Preview  │  │
│  │  Pages   │  │  (Papers)    │  │  (Split Pane)      │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                    │             │
│       │    Supabase Client (Browser)       │             │
│       └───────────┬───┴────────────────────┘             │
└───────────────────┼──────────────────────────────────────┘
                    │
            ┌───────┴───────┐
            │  Next.js API   │
            │  Routes        │
            │  (Server-Side) │
            └───────┬───────┘
                    │
    ┌───────────────┼───────────────────┐
    │               │                   │
    ▼               ▼                   ▼
┌────────┐   ┌──────────────┐   ┌───────────┐
│Supabase│   │  Supabase    │   │ Nodemailer │
│  Auth  │   │  PostgreSQL  │   │  (SMTP)    │
│(OAuth) │   │  (RLS)       │   │            │
└────────┘   └──────────────┘   └───────────┘
```

### Request Flow

1. **Authentication**: User authenticates via Google OAuth or Email/Password through Supabase Auth.
2. **Session Management**: The Next.js middleware refreshes the Supabase session on every request using cookies.
3. **Access Control**: After authentication, the app checks the `authorized_users` table for the user's status (`pending`, `approved`, `rejected`). Only `approved` users reach the dashboard. The admin email (configured in `constants.ts`) bypasses this check.
4. **Paper Operations**: The `Editor` component reads/writes to the `question_papers` table via the data layer in `lib/supabase/papers.ts`. Auto-save triggers on a 5-second debounce after any change.
5. **Collaboration**: Paper owners can share via the `ShareModal` component, which writes to the `collaborations` table. Non-owners can request access, which creates entries in `access_requests`.
6. **Email Notifications**: Access request and approval/denial events trigger server-side API calls to send emails via Nodemailer (SMTP).

---

## 5. Authentication & Authorization System

QEdit implements a **multi-layer auth system** combining Supabase Auth with a custom approval workflow.

### Authentication Methods

| Method             | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| **Google OAuth**   | One-click sign in; user is auto-redirected through `/auth/callback`   |
| **Email/Password** | Standard sign-up with password (min 8 chars) + sign-in                |

### Authorization Flow 

```
User Registers / Signs In
        │
        ▼
┌─────────────────────┐
│ Is Admin Email?      │──── YES ──▶ /admin (Admin Panel)
└──────────┬──────────┘
           │ NO
           ▼
┌─────────────────────┐
│ Check authorized_   │
│ users table          │
└──────────┬──────────┘
           │
     ┌─────┴─────────────────────┐
     │                           │
     ▼                           ▼
┌──────────┐              ┌──────────┐
│ Not found │              │  Found   │
│ (New user)│              │          │
└─────┬─────┘              └────┬─────┘
      │                         │
      ▼                    ┌────┴────────┐────────────┐
 Auto-insert as            │             │            │
 "pending"                 ▼             ▼            ▼
      │               status =      status =     status =
      ▼               "approved"    "pending"    "rejected"
 /auth/pending             │             │            │
                           ▼             ▼            ▼
                      /dashboard    /auth/pending  Sign out +
                                                  Error message
```

### Admin Panel (Sys-Ops)

The admin (defined in `lib/constants.ts` as `ADMIN_EMAIL`) has access to the `/admin` panel where they can:

- **View all registered users** with their current status (pending, approved, rejected)
- **Approve or reject** user registrations
- **Pre-approve emails** — add an email address so the user gets instant access on first login
- **Delete users** from the system entirely
- **Filter users** by status (pending, approved, rejected, all)

### Password Reset Flow

1. User enters email on `/auth/forgot-password`
2. Server generates a cryptographic token, stores it in `password_reset_tokens` table with a 1-hour expiry
3. Reset link is emailed to the user
4. User clicks link → `/auth/reset-password?token=...`
5. User enters new password → server validates token, updates password via Supabase Admin API

---

## 6. Database Schema

QEdit uses four Supabase PostgreSQL tables, all with Row Level Security (RLS) enabled.

### 6.1 `question_papers`

The main table storing all question papers.

| Column         | Type         | Description                                          |
| -------------- | ------------ | ---------------------------------------------------- |
| `id`           | `UUID (PK)`  | Auto-generated unique ID                             |
| `title`        | `TEXT`        | Paper title (auto-derived from subject/exam name)    |
| `owner_email`  | `TEXT`        | Email of the paper creator                           |
| `status`       | `TEXT`        | `'draft'` or `'saved'`                               |
| `paper_data`   | `JSONB`       | Complete paper content (header, sections, settings)  |
| `created_at`   | `TIMESTAMPTZ` | Creation timestamp                                   |
| `updated_at`   | `TIMESTAMPTZ` | Last update timestamp (auto-updated via trigger)     |

**RLS Policies**: Owners can CRUD their own papers. Collaborators can SELECT and UPDATE shared papers.

### 6.2 `collaborations`

Tracks who has access to which papers.

| Column               | Type        | Description                     |
| -------------------- | ----------- | ------------------------------- |
| `id`                 | `UUID (PK)` | Auto-generated unique ID        |
| `paper_id`           | `UUID (FK)`  | References `question_papers.id` |
| `collaborator_email` | `TEXT`       | Collaborator's email            |
| `permission`         | `TEXT`       | `'edit'` or `'view'`            |
| `created_at`         | `TIMESTAMPTZ`| Creation timestamp              |

**Unique Constraint**: `(paper_id, collaborator_email)` — one entry per user per paper.

### 6.3 `authorized_users`

Controls who can use the system (admin-gated registration).

| Column        | Type         | Description                                |
| ------------- | ------------ | ------------------------------------------ |
| `id`          | `UUID (PK)`  | Auto-generated unique ID                   |
| `email`       | `TEXT`        | User's email (unique)                      |
| `status`      | `TEXT`        | `'pending'`, `'approved'`, or `'rejected'` |
| `role`        | `TEXT`        | `'user'` or `'admin'`                      |
| `approved_by` | `TEXT`        | Email of the admin who approved            |
| `created_at`  | `TIMESTAMPTZ` | Registration timestamp                     |

**RLS**: Only server-side access via SUPABASE_SERVICE_ROLE_KEY. No public access.

### 6.4 `access_requests`

Tracks paper-level access requests from non-collaborators.

| Column            | Type         | Description                                    |
| ----------------- | ------------ | ---------------------------------------------- |
| `id`              | `UUID (PK)`  | Auto-generated unique ID                       |
| `paper_id`        | `UUID (FK)`   | References `question_papers.id`                |
| `requester_email` | `TEXT`        | Email of the person requesting access          |
| `requester_name`  | `TEXT`        | Display name (optional)                        |
| `message`         | `TEXT`        | Optional message to the owner                  |
| `status`          | `TEXT`        | `'pending'`, `'approved'`, or `'denied'`       |
| `created_at`      | `TIMESTAMPTZ` | Request timestamp                              |

### RLS Security Functions

To avoid infinite recursion between cross-table RLS policies, the schema uses `SECURITY DEFINER` PostgreSQL functions:

- **`is_paper_collaborator(paper_id)`** — checks if current user is a collaborator
- **`is_paper_owner(paper_id)`** — checks if current user owns the paper
- **`is_request_paper_owner(request_id)`** — checks if current user owns the paper tied to a request

---

## 7. Application Pages & Routes

### Public / Auth Routes

| Route                    | File                                   | Description                                     |
| ------------------------ | -------------------------------------- | ----------------------------------------------- |
| `/`                      | `app/page.tsx`                         | Root — redirects to `/auth`                     |
| `/auth`                  | `app/auth/page.tsx`                    | Login page (Google + Email/Password)            |
| `/auth/register`         | `app/auth/register/page.tsx`           | Registration page                               |
| `/auth/pending`          | `app/auth/pending/page.tsx`            | Awaiting admin approval page                    |
| `/auth/forgot-password`  | `app/auth/forgot-password/page.tsx`    | Forgot password form                            |
| `/auth/reset-password`   | `app/auth/reset-password/page.tsx`     | Reset password form (token-validated)           |
| `/auth/callback`         | `app/auth/callback/route.ts`           | OAuth callback (GET route handler)              |

### Protected Routes (require authentication)

| Route                  | File                                     | Description                                    |
| ---------------------- | ---------------------------------------- | ---------------------------------------------- |
| `/dashboard`           | `app/dashboard/page.tsx`                 | Main dashboard — lists all papers              |
| `/dashboard/create`    | `app/dashboard/create/page.tsx`          | Create a new question paper                    |
| `/dashboard/edit/[id]` | `app/dashboard/edit/[id]/page.tsx`       | Edit an existing paper                         |
| `/paper/[id]`          | `app/paper/[id]/page.tsx`               | View/edit a shared paper (access-checked)      |
| `/admin`               | `app/admin/page.tsx`                     | Admin panel (ADMIN_EMAIL only)                 |

---

## 8. API Routes (Backend)

All API routes are server-side Next.js Route Handlers located under `app/api/`.

### Authentication APIs

| Endpoint                        | Method | Description                                                        |
| ------------------------------- | ------ | ------------------------------------------------------------------ |
| `/api/auth/check-access`        | POST   | Checks `authorized_users` for email status; auto-inserts new users as `pending` |
| `/api/auth/check-authorized`    | POST   | Legacy endpoint — checks if email exists in `authorized_users`     |
| `/api/auth/forgot-password`     | POST   | Generates reset token, stores in DB, sends reset email             |
| `/api/auth/reset-password`      | POST   | Validates token, updates password via Supabase Admin API           |

### Admin APIs

| Endpoint                        | Method | Description                                           |
| ------------------------------- | ------ | ----------------------------------------------------- |
| `/api/admin/users`              | GET    | Lists all users from `authorized_users`               |
| `/api/admin/users`              | POST   | Manually adds an email as pre-approved                |
| `/api/admin/users/[id]`         | PATCH  | Updates user status (approve/reject/pending)          |
| `/api/admin/users/[id]`         | DELETE | Removes a user from the system                        |

### Email APIs

| Endpoint                        | Method | Description                                           |
| ------------------------------- | ------ | ----------------------------------------------------- |
| `/api/email/notify-request`     | POST   | Notifies paper owner about a new access request       |
| `/api/email/notify-approved`    | POST   | Notifies requester about approval or denial           |

All admin API routes verify the requesting user is the admin before processing.

---

## 9. Core Components

### 9.1 `Editor.tsx` (~1,050 lines)

The **heart of the application** — a split-pane paper editor.

**Left Panel (Form):**
- **Header Details Form**: Institution name, college, department, exam name, course code, subject, class (year + course + specialization dropdowns), semester, date, duration, total marks, logo upload
- **Text Formatting Toggles**: Auto Capitalize (title case), ALL CAPS
- **Section Management**: Add/edit/delete parts (A, B, C…), configure required count and default marks
- **Question Management**: Add/edit/delete/reorder questions with drag-and-drop, insert page breaks
- **Page Setup Panel**: Configurable margins (top/bottom/left/right), font size, line height, BL/CO/PO toggle, logo toggle, watermark toggle with opacity/size sliders

**Right Panel (Preview):**
- Renders the `Preview` component with the current paper data

**Toolbar:**
- Save Draft / Save Final buttons (when `onSave` prop is provided)
- Auto-save status indicator
- Page Setup toggle
- Save as PDF button

**Key Behaviors:**
- **Auto-Save**: Triggers a 5-second debounced save after any change
- **PDF Export**: Uses html2canvas to capture each page as an image, then assembles them into a landscape A4 PDF with 2-up layout
- **Section Auto-Naming**: New sections automatically get the next available letter (A→B→C…)

### 9.2 `Preview.tsx` (~346 lines)

Real-time A4-format paper preview with automatic pagination.

**Key Features:**
- **A4 Page Sizing**: `210mm × 297mm` with configurable margins
- **Font**: Times New Roman (standard academic paper font)
- **Auto-Pagination**: Uses a hidden measuring container to calculate content heights, then splits content across pages automatically
- **Manual Page Breaks**: Respects `break` type questions to force new pages
- **Continuous Numbering**: Questions are numbered sequentially across all sections
- **Zoom Control**: Fixed bottom-right slider (40%–150%), default 75%
- **Watermark Support**: Center-positioned, grayscale, configurable opacity
- **Logo Support**: Top-left positioned, grayscale, configurable size
- **Section Headers**: Part letter, instruction text, marks calculation
- **BL/CO/PO Columns**: Optional columns displaying Bloom's Level, Course Outcome, and Program Outcome per question
- **OR Questions**: Displayed with A./B. labels and "(OR)" separator
- **Sub-questions**: Displayed with roman numeral labels (i, ii, iii…)
- **MCQ Options**: Displayed in a 2-column grid with (a), (b), (c), (d) labels
- **Register Number Boxes**: Configurable count (5–20), displayed in the header

### 9.3 `QuestionForm.tsx` (~379 lines)

Form component for adding/editing questions.

**Fields:**
- **Question Text**: Multi-line textarea
- **Marks**: Number input (disabled when section has default marks)
- **Type**: Dropdown — Short Answer, Long Answer, Multiple Choice
- **BL / CO / PO**: Dropdown selectors (shown/hidden via toggle)
- **MCQ Options**: Four text inputs (shown when type is MCQ)
- **OR Question**: Toggle + textarea + BL/CO/PO (adds an alternative question)
- **Sub-questions**: Toggle + dynamic list of sub-items with text, marks, BL/CO/PO

### 9.4 `ShareModal.tsx` (~263 lines)

Modal dialog for managing paper sharing and collaboration.

**Sections:**
- **Collaboration Link**: Read-only URL with copy button
- **Pending Requests**: (Owner only) Shows incoming access requests with approve/deny buttons
- **Add Collaborator**: Email input + view/edit permission toggle + add button
- **Collaborators List**: Shows all current collaborators with permission badges and remove button

### 9.5 `Modal.tsx` (~67 lines)

Generic reusable modal wrapper with backdrop blur, escape key handling, and scroll lock.

---

## 10. Library / Utility Modules

### 10.1 `lib/constants.ts`

```typescript
export const ADMIN_EMAIL = 'mh6651@srmist.edu.in';
```

Single source of truth for the system administrator email. This email:
- Bypasses the `authorized_users` check entirely
- Gets redirected to `/admin` instead of `/dashboard`
- Is the only email that can access admin API routes

### 10.2 `lib/mailer.ts`

Configures a Nodemailer SMTP transporter using environment variables:
- Host: `MAIL_HOST` (defaults to `smtp.gmail.com`)
- Port: `MAIL_PORT` (defaults to `587`)
- Auth: `MAIL_USER` + `MAIL_APP_PASSWORD`

### 10.3 `lib/supabase/client.ts`

Creates a **browser-side** Supabase client using `createBrowserClient` from `@supabase/ssr`. Used in all client components for auth and data operations.

### 10.4 `lib/supabase/server.ts`

Creates a **server-side** Supabase client using `createServerClient` from `@supabase/ssr`. Uses Next.js `cookies()` for session management. Used in Server Components and API Routes.

### 10.5 `lib/supabase/middleware.ts`

Implements the `updateSession()` function used by the root middleware:
- Refreshes Supabase auth session on every request
- Allows unauthenticated access to `/auth/*` routes
- Redirects unauthenticated users to `/auth`
- Redirects authenticated users away from `/auth` to `/dashboard`

### 10.6 `lib/supabase/papers.ts`

Data access layer for the `question_papers` table:

| Function           | Description                                                   |
| ------------------- | ------------------------------------------------------------- |
| `createPaper()`     | Creates a new paper; strips base64 logos before saving         |
| `updatePaper()`     | Updates paper data and optionally status                      |
| `renamePaper()`     | Updates only the title field                                  |
| `deletePaper()`     | Deletes a paper (RLS enforces owner-only)                     |
| `getUserPapers()`   | Fetches all papers owned by an email, ordered by updated_at   |
| `getSharedPapers()` | Fetches papers shared with a user via collaborations          |
| `getPaperById()`    | Fetches a single paper by ID                                  |
| `duplicatePaper()`  | Creates a copy of an existing paper with "(Copy)" suffix      |

**Note**: `sanitizePaperData()` strips base64-encoded logos from `paper_data` before saving to prevent storing large binary data in the JSON column.

### 10.7 `lib/supabase/collaborations.ts`

Data access layer for the `collaborations` table:

| Function              | Description                                               |
| ---------------------- | --------------------------------------------------------- |
| `addCollaborator()`    | Adds a collaborator with specified permission              |
| `removeCollaborator()` | Removes a collaboration entry                             |
| `getCollaborators()`   | Lists all collaborators for a paper                       |
| `checkAccess()`        | Checks if a user has access (owner or collaborator)       |

### 10.8 `lib/supabase/access-requests.ts`

Data access layer for the `access_requests` table:

| Function            | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `requestAccess()`    | Submits an access request for a paper                      |
| `getPendingRequests()`| Gets all pending requests for a paper                     |
| `approveRequest()`   | Updates a request status to approved                       |
| `denyRequest()`      | Updates a request status to denied                         |
| `getMyRequest()`     | Checks if the current user already sent a request          |

---

## 11. Type Definitions

Defined in `types/index.ts`:

### `Question`
```typescript
interface Question {
  id: string;
  text: string;
  marks: number;
  type: 'short' | 'long' | 'mcq' | 'break';
  options?: string[];         // MCQ options
  correctAnswer?: string;     // For future MCQ test grading
  bl?: string;                // Bloom's Level (1-6)
  co?: string;                // Course Outcome (1-5)
  po?: string;                // Program Outcome (1-12)
  orQuestion?: Question;      // Alternative OR question
  subQuestions?: Question[];   // Sub-parts (i, ii, iii…)
}
```

### `Section`
```typescript
interface Section {
  id: string;
  title?: string;
  part: string;              // 'A', 'B', 'C', etc.
  requiredCount: string;     // 'ALL' or a number (e.g. '5')
  questions: Question[];
  defaultMarks?: number;     // Default marks per question in this section
}
```

### `PaperHeader`
```typescript
interface PaperHeader {
  institutionName: string;
  department: string;
  examName: string;
  subject: string;
  courseCode: string;
  class: string;
  semester?: string;
  date: string;
  duration: string;
  totalMarks: number;
  registerNumber?: string;
  college?: string;
  logo?: string;             // Base64 or URL path
  regNoBoxCount?: number;    // 5-20, default 15
}
```

### `PageSettings`
```typescript
interface PageSettings {
  marginTop: number;     // mm
  marginBottom: number;  // mm
  marginLeft: number;    // mm
  marginRight: number;   // mm
  fontSize: number;      // pt
  lineHeight: number;    // unitless (e.g. 1.5)
}
```

### `PaperData`
```typescript
interface PaperData {
  header: PaperHeader;
  sections: Section[];
  settings?: PageSettings;
}
```

### `QuestionPaperRecord`
```typescript
interface QuestionPaperRecord {
  id: string;
  title: string;
  owner_email: string;
  status: 'draft' | 'saved';
  paper_data: PaperData;
  created_at: string;
  updated_at: string;
}
```

### `Collaboration`
```typescript
interface Collaboration {
  id: string;
  paper_id: string;
  collaborator_email: string;
  permission: 'edit' | 'view';
  created_at: string;
}
```

---

## 12. Collaboration & Sharing System

### How Sharing Works

1. **Paper Owner** opens the Share Modal from the dashboard
2. **Share Link**: A unique URL (`/paper/[id]`) is generated and can be copied
3. **Add Collaborator**: Owner enters an email and selects permission level (view/edit)
4. **Collaborator Notification**: An email notification is sent to the collaborator

### Access Request Flow

When a non-collaborator visits `/paper/[id]`:

```
User visits /paper/[id]
        │
        ▼
┌─────────────────┐
│  Has Access?     │
└────────┬────────┘
         │
    ┌────┴───────────────────────────────────┐
    │                │           │            │
    ▼                ▼           ▼            ▼
 Owner          Collaborator  Collaborator   No Access
 (Full Edit)    (Edit)        (View Only)    │
                                             ▼
                                    Access Restricted Screen
                                             │
                                             ▼
                                    User submits request
                                    (optional message)
                                             │
                                             ▼
                                    Owner receives email
                                             │
                                             ▼
                                    Owner opens Share Modal
                                             │
                                        ┌────┴────┐
                                        ▼         ▼
                                    Approve     Deny
                                        │         │
                                        ▼         ▼
                                    User added  Denial email
                                    as collab   sent to user
                                    + email
```

### View-Only Mode

Collaborators with `view` permission see a purple banner: "View Only — You cannot edit this paper". The `onSave` prop is not passed to the Editor, so all save/edit functionality is disabled.

---

## 13. Email Notification System

QEdit sends emails for the following scenarios:

| Trigger                    | API Route                       | Recipient     | Content                           |
| -------------------------- | ------------------------------- | ------------- | --------------------------------- |
| Access request submitted   | `/api/email/notify-request`     | Paper owner   | Requester details + review link   |
| Access approved            | `/api/email/notify-approved`    | Requester     | Confirmation + direct paper link  |
| Access denied              | `/api/email/notify-approved`    | Requester     | Denial notification               |
| Password reset requested   | `/api/auth/forgot-password`     | User          | Reset link with token             |

All emails use inline HTML styling with the QEdit design language (green accents, rounded containers).

---

## 14. PDF Export System

The PDF export (`handlePrint()` in `Editor.tsx`) uses a client-side approach:

### Process

1. **Scale Reset**: Temporarily removes the zoom transform on the preview wrapper
2. **Color Fix**: Iterates all elements to replace TailwindCSS v4 `lab()`/`oklch()` color values with standard hex values (html2canvas compatibility fix)
3. **Page Capture**: Uses `html2canvas` to render each `[data-page-index]` element as a canvas at 2x resolution
4. **PDF Assembly**: Creates a landscape A4 PDF using `jsPDF` and places two page images per sheet (2-up layout) with 3mm padding
5. **Download**: Saves the PDF with the subject name as the filename

### Output Format

- **Orientation**: Landscape A4 (297mm × 210mm)
- **Layout**: Two portrait pages side-by-side per landscape sheet
- **Quality**: JPEG at 95% quality, 2x canvas resolution
- **Filename**: `{subject-name}.pdf`

---

## 15. Middleware & Session Management

### Root Middleware (`middleware.ts`)

Runs on every request (except static files, images, and favicon):

```typescript
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}
```

### Session Logic (`lib/supabase/middleware.ts`)

1. Creates a Supabase server client using request cookies
2. Calls `supabase.auth.getUser()` to validate/refresh the session
3. **Unauthenticated users** visiting non-auth pages → redirect to `/auth`
4. **Authenticated users** visiting `/auth` → redirect to `/dashboard`
5. Auth sub-pages (register, pending, etc.) are always accessible

---

## 16. Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_APP_PASSWORD=your-gmail-app-password
MAIL_FROM="QEdit <your-email@gmail.com>"

# App URL (used in email links)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## 17. Deployment

QEdit is deployed on **Vercel** with automatic CI/CD from the Git repository.

### Deployment Checklist

1. Push code to Git repository
2. Connect repository to Vercel
3. Set all environment variables in Vercel dashboard
4. Run all `supabase-*.sql` files in Supabase SQL Editor (in order):
   - `supabase-schema.sql` (question_papers, collaborations, RLS)
   - `supabase-authorized-users.sql` (authorized_users table)
   - `supabase-admin-approval.sql` (add status/approved_by columns)
   - `supabase-access-requests.sql` (access_requests table)
   - `supabase-password-reset.sql` (password_reset_tokens table)
5. Configure Google OAuth in Supabase dashboard (Authentication → Providers → Google)
6. Set the callback URL in Google Cloud Console: `https://your-project.supabase.co/auth/v1/callback`

### Monitoring

- **Vercel Analytics**: Tracks page views and user engagement
- **Vercel Speed Insights**: Monitors Core Web Vitals and performance

---

## 18. Key Features Summary

### Editor Features

- ✅ Split-pane editor with live A4 preview
- ✅ Multi-section support (Part A, B, C…)
- ✅ Three question types: Short, Long, MCQ
- ✅ OR questions (either/or alternative)
- ✅ Sub-questions (i, ii, iii…)
- ✅ Bloom's Level / Course Outcome / Program Outcome annotations
- ✅ Manual page breaks
- ✅ Drag-and-drop question reordering
- ✅ Section-level default marks
- ✅ Auto capitalization toggle
- ✅ ALL CAPS toggle
- ✅ Collapsible header form
- ✅ Configurable page margins, font size, line height
- ✅ Institution logo upload (grayscale), watermark support
- ✅ Register number box count configuration
- ✅ Class selection (Year + Course + Specialization)
- ✅ Duration selection (Hours + Minutes dropdowns)
- ✅ Semester selection (ODD/EVEN)

### Save & Export

- ✅ Auto-save as draft (5-second debounce)
- ✅ Manual save as draft
- ✅ Save as final
- ✅ PDF export (landscape A4, 2-up layout)

### Dashboard & Management 

- ✅ Drafts section with count badge
- ✅ Saved papers section
- ✅ Shared papers section
- ✅ Inline rename (double-click)
- ✅ Duplicate paper
- ✅ Delete paper (with confirmation)
- ✅ Share paper (modal)
- ✅ Time-ago display (e.g., "5m ago", "3h ago")

### Auth & Security

- ✅ Google OAuth sign-in
- ✅ Email/Password sign-in
- ✅ Admin approval workflow
- ✅ Password reset via email
- ✅ Row Level Security (RLS) on all tables
- ✅ Service-role-only access to sensitive tables

### Collaboration

- ✅ Add collaborators by email
- ✅ View/Edit permission control
- ✅ Access request system with email notifications
- ✅ Request approval/denial by owner
- ✅ Collaboration link copying
- ✅ View-only mode for read-only collaborators

### Coming Soon (Placeholder)

- 🔜 Online MCQ Test creation (shown as "Coming Soon" card on dashboard)

---

> **Crafted with 💚 by Chan's Team**

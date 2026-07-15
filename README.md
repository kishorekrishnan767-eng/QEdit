# 📝 QEdit — Question Paper Editor

[![Next.js 16](https://img.shields.io/badge/Next.js-16%20%28App%20Router%29-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind%20CSS-v4.0-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**QEdit** is a full-stack, state-of-the-art web application designed for academic institutions to create, format, collaborate on, and export university-level examination question papers. Built with a premium, responsive dark-green glassmorphism UI, it streamlines the complex paper setting process by providing a form-based split-pane editor on the left and a pixel-accurate, dynamically paginated live A4 preview on the right.

---

## ✨ Key Features

*   **Split-Pane Editor**: Live data entry on the left side with a real-time pixel-accurate A4 page layout preview on the right.
*   **Dynamic Auto-Pagination**: Programmatic layout measurement that splits sections, questions, and alternatives cleanly across page borders without cut-offs or orphans.
*   **Comprehensive Paper Structure**: Supports multiple parts (Part A, B, C), marks allocation, question types (Short, Long, MCQs), sub-questions (i, ii, iii), and OR-choices (alternative questions).
*   **BL / CO / PO Annotations**: Tag Bloom's Level (BL), Course Outcome (CO), and Program Outcome (PO) mapping per question.
*   **Dual-Layout PDF Export**:
    *   *Standard Layout*: Clean portrait A4 pages for Model/Semester Exams.
    *   *Booklet Layout*: Auto-detects Cycle/Cyclic tests to output two-column side-by-side landscape pages (2-up layout) to save paper.
*   **Admin-Gated Authentication**: Custom authorization layer on top of Supabase Auth (Google OAuth & Email/Password). Users registering are flagged as `pending` until approved by the system admin.
*   **Real-time Collaboration**: Securely share papers with colleagues with granular permissions (`view` or `edit`).
*   **Access Request Workflows**: Request access to locked papers, generating real-time email notifications for approval/rejection via Nodemailer (SMTP).
*   **Cloud Auto-Save**: Seamlessly saves draft progress automatically with a 5-second debounce.

---

## 🛠️ Tech Stack

| Layer | Technology | Key Role |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16 (App Router)** | SSR, serverless API Route Handlers, cookie session management. |
| **Language** | **TypeScript 5** | Strict type safety for nested schemas like questions, sections, and headers. |
| **UI Core** | **React 19** | Modern state management, rendering lifecycle, and reactive DOM manipulation. |
| **Styling** | **Tailwind CSS 4** | Theme design, dark-green glassmorphism system, and print layouts. |
| **Database** | **Supabase (PostgreSQL)** | Persistent storage for papers, collaborations, auth settings, and reset tokens. |
| **Security** | **PostgreSQL RLS** | Row-Level Security policies to protect private exam data in the database. |
| **Emails** | **Nodemailer (SMTP)** | Delivers notifications for forgot-password links and access request status updates. |
| **PDF Engine** | **html2canvas + jsPDF** | Client-side DOM capturing and double-resolution PDF compilation. |

---

## 📁 Repository Structure

```text
qpaper-editor/
├── app/                              # Next.js App Router & Server API Routes
│   ├── auth/                         # Sign in, Sign up, Pending, Reset Password pages
│   ├── dashboard/                    # User dashboard, folders, create/edit router
│   ├── paper/[id]/                   # Shared/public access request pages
│   ├── admin/                        # System Administrator dashboard (Sys-Ops)
│   └── api/                          # Backend routes (admin, email, custom auth)
├── components/                       # Client React Components
│   ├── Editor.tsx                    # Main split editor logic
│   ├── Preview.tsx                   # Live measuring & A4 pagination renderer
│   ├── QuestionForm.tsx              # Nested question configuration form
│   └── ShareModal.tsx                # Collaboration share modal
├── lib/                              # Configurations & Database CRUD Helper APIs
│   ├── constants.ts                  # Hardcoded app configurations (e.g. ADMIN_EMAIL)
│   ├── mailer.ts                     # SMTP Nodemailer Transporter
│   └── supabase/                     # Supabase client/server initializers & middleware
├── types/                            # TypeScript global interface definitions
├── public/                           # Static assets, logos, and favicons
├── supabase-*.sql                    # Database migrations & table schemas
└── package.json                      # Build scripts and project dependencies
```

---

## 🚀 Getting Started

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended) and a [Supabase](https://supabase.com/) project set up.

### 2. Clone and Install Dependencies
```bash
git clone <repository-url>
cd QEdit-main
npm install
```

### 3. Setup Environment Variables
Create a file named `.env.local` in the root directory and configure the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Nodemailer / SMTP Configurations (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_gmail_address
SMTP_PASS=your_app_password
SMTP_FROM_NAME="QEdit Admin"
```

> [!NOTE]
> For standard Gmail SMTP, you must configure a Google App Password rather than your standard account password.

### 4. Database Setup
To set up the required tables and security structures in your Supabase project, execute the SQL files in the Supabase SQL Editor in the following order:

1. **`supabase-schema.sql`**: Sets up the basic `question_papers` and `collaborations` tables, establishes Row Level Security (RLS), and defines access policies.
2. **`supabase-authorized-users.sql`**: Creates the `authorized_users` table that gates new signups.
3. **`supabase-access-requests.sql`**: Configures the `access_requests` table to support sharing workflows.
4. **`supabase-password-reset.sql`**: Configures custom token-based forgot-password storage.
5. **`supabase-admin-approval.sql`**: Updates policies to support admin approvals.
6. **`supabase-syllabus.sql`**: Schema and reference data for syllabus content.
7. **`supabase-system-settings.sql`**: Storage for institutional headers and logos.
8. **`supabase-promote-admin.sql`**: Promotes your first admin email to system administrator status.

### 5. Configure Admin Email
Open [lib/constants.ts](file:///c:/Users/Kishore/Desktop/Qedit/QEdit-main/lib/constants.ts) and modify `ADMIN_EMAIL` to match your administrative email address:
```typescript
export const ADMIN_EMAIL = 'your-email@example.com';
```

### 6. Run the Application
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the app.

---

## 🎨 Architecture & Layout Mechanics

### Client-Side Double Rendering (Auto-Pagination)
To render A4 pages perfectly, QEdit uses a hidden container in `Preview.tsx` to dynamically measure the heights of each element:
1. An off-screen element renders all questions, headers, and section details sequentially at scale `1`.
2. The code calculates the pixels-per-millimeter scale using the viewport and determines a target page budget height.
3. If the combined height of items exceeds the budget or encounters a manual page break, it divides them into a new page block.
4. What you see is a fluid, zoom-scalable visual layout using CSS transforms, avoiding low-res overlaps during edit sessions.

### Booklet (2-Up Layout) Generation
*   If the header metadata includes keywords such as `cycle` or `cyclic`, QEdit's download engine adjusts the layout.
*   Instead of standard Portrait A4 sheets, it initiates a landscape orientation.
*   Pages are rendered 2-up (side-by-side) on a single sheet, automatically aligning with standard booklet printing styles used by universities.

---

## 📄 License
This project is proprietary and intended for institutional use. All rights reserved.

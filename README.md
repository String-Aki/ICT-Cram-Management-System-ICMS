# ICT Cram Management System (ICMS)

<div align="center">

<img width="128" height="128" alt="4" src="https://github.com/user-attachments/assets/12c1d56d-93e4-4852-9519-7b8df3675203" />

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://icms-admin-portal.vercel.app/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge&logo=googlechrome&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![GitHub Repo](https://img.shields.io/badge/GitHub-String--Aki%2FICMS-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/String-Aki/ICT-Cram-Management-System-ICMS)

### **The all-in-one command center for running a modern ICT tuition academy — built out of real-world necessity, not theory.**

*Student tracking · QR attendance · Gamified XP · Fee management · Push notifications · ID card printing — all in one place.*

</div>

---

## 🎯 The Mission: Why ICMS Exists

Running a tuition academy is chaos without the right tools. Class registers live in notebooks. Fee records exist in spreadsheets that go out of sync. Students lose track of their homework. Teachers have no visibility into attendance patterns. And nobody can tell who the star performer is until exam results come back weeks later.

**ICMS was built to kill that chaos.**

This system was designed from the ground up after experiencing firsthand how much administrative overhead consumes the actual teaching time at a cram school. Every minute spent chasing down a fee record, manually marking a register, or printing a student ID by hand is a minute not spent educating. ICMS automates all of it.

The result is a dual-surface platform:

- **The Admin Terminal (`icms-v1`)** — A powerful, authenticated dashboard that gives administrators real-time visibility over every dimension of the academy: attendance, finances, curriculum, exam grading, and gamification — all from a single browser tab.
- **The Student Portal (`icms-student-portal`)** — A polished, mobile-first PWA where students log in with their unique QR-linked ID and see their XP, ranks, homework quests, payment receipts, class schedule, and achievements. No app store required. Just "Add to Home Screen."

ICMS isn't another generic school management system. It was purpose-built for the specific rhythm and pressure of a cram school environment — fast enrollment, frequent attendance events, cycle-based fee billing, and the motivational psychology needed to keep students engaged between sessions.

---

## 📸 Visual Preview

> Screenshots are coming soon. Planned coverage:
>
> | View | Description |
> |---|---|
> | **Admin Dashboard** | Real-time KPI cards — attendance turnout, pending fees, monthly revenue, exam queue |
> | **QR Attendance Kiosk** | Camera scan interface with smart session matching and live XP feedback |
> | **Student Portal Home** | XP display, rank card, cycle progress bar, and quest hub |
> | **Exam Grading Engine** | Bulk score entry with proportional XP preview per student |
> | **Payment Ledger** | Fee history with downloadable PDF receipt generation |
> | **Trophy Room** | Unlocked rank badges and achievement stickers with locked mystery silhouettes |
>
> *To contribute screenshots: deploy the project, capture the views above, and open a PR adding them to `docs/screenshots/`.*

---

## ✨ Core Features

### 🏫 For Administrators

| Feature | What It Does For You |
|---|---|
| **📊 Live Dashboard** | See today's attendance turnout, pending fees, monthly revenue, and exam queue at a glance — every time you open the app. No manual counting. |
| **📷 QR Attendance Kiosk** | Students scan their physical ID card at the door. The system records presence, awards XP, and detects duplicates — all in under a second. Works offline and syncs when reconnected. |
| **👥 Student Roster** | Full CRUD for student records. Promote students to new grades with one click, triggering a random "Gacha" card-back re-roll and automatic print queue entry. |
| **💳 Cycle-Based Fee Billing** | Fees are tied to 8-class attendance cycles, not calendar months. The system flags overdue students automatically and lets you collect and receipt payments in seconds. |
| **📚 Curriculum Hub** | Upload study materials (notes, PDFs, video links) and create homework quests with XP rewards, deadlines, and per-student targeting. Close quests to freeze XP awards once the deadline passes. |
| **📝 Exam & Grading Engine** | Create exam events, enter bulk scores per-student, and publish grades. The system auto-calculates proportional XP awards and locks the exam once marked complete. |
| **🖨️ ID Card Print Hub** | Newly enrolled and promoted students are auto-queued for batch printing. Export an A4-ready PDF with duplex-ready front/back card layouts — two cards per row, eight per sheet. |
| **📅 Master Schedule Manager** | Create recurring weekly classes or one-time events, target them to specific grades or individual students, and fire emergency overrides (cancel or reschedule) with a single form. Overrides automatically notify affected students via push. |
| **⭐ Hall of Fame** | Browse every student's unlocked rank badges and special achievement stickers. Queue any combination for print and export a sticker sheet in one click. |
| **🔔 Push Notifications** | Fire web push notifications to any audience segment (all students, a grade batch, or specific individuals) on any event: new homework, exam results, schedule changes, payment receipts. |
| **🤖 Cron Automation** | A Vercel-compatible cron endpoint automatically checks for payment-due cycles and sends reminder notifications — no manual triggering required. |

---

### 🎮 For Students (via the PWA Portal)

| Feature | What It Means for a Student |
|---|---|
| **🆔 QR-Linked Identity** | Every student gets a unique alphanumeric ID embedded in their physical card. That single scan is their identity across the entire system. |
| **⚡ XP & Rank Progression** | Attendance, homework completion, and exam performance all award XP. XP unlocks ranks from *Pixel Pioneer* all the way to *Digital Legend*. Progress is always visible on the home screen. |
| **🎯 Quest Board** | Homework isn't just "submitted" — it's a quest with an XP bounty. Students can see active quests, deadlines, descriptions, and resource links. Deep-linkable via push notification. |
| **📅 Personal Timeline** | A 14-day ahead schedule view, personalized to the student's grade and individual targeting. Cancelled or rescheduled classes appear with clear visual indicators. |
| **🏆 Trophy Room** | A visual gallery of every unlocked progression rank and special achievement badge. Locked items are shown as mystery silhouettes — a deliberate motivational design choice. |
| **💰 Payment Ledger & Receipts** | Students can view every fee payment and download a branded PDF receipt directly from the portal. Deep-linkable from payment push notifications. |
| **📜 XP Ledger** | A chronological timeline of every XP transaction with reasons — so students always know exactly why their score changed. |
| **🏟️ The Arena (Leaderboard)** | A batch-scoped competitive leaderboard with a visual podium for the top 3 students. Students only compete within their own grade batch. |
| **🔒 PIN Security + Settings** | Students log in with their QR ID and a 4-digit PIN. They can change their PIN anytime from the settings page. Multiple accounts can be saved for quick switching. |
| **📲 Installable PWA** | The student portal installs as a native-feeling app on iOS and Android via "Add to Home Screen." No App Store submission required. Push notifications are supported on both platforms. |

---

## 🗂️ Architecture & File Structure

The repository contains **two independent Next.js applications** that share the same Supabase backend:

```
icms/
│
├── icms-v1/                          # 🖥️  ADMIN TERMINAL
│   ├── public/
│   │   ├── icon.png                  # App icon (used in ID cards too)
│   │   ├── id-front.jpg              # ID card front template image
│   │   ├── id-back-1.jpg             # ID card back variant 1
│   │   ├── id-back-2.jpg             # ... up to id-back-6.jpg (gacha variants)
│   │   ├── manifest.json             # PWA manifest
│   │   └── sw.js                     # Compiled service worker (Serwist output)
│   │
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Admin login page (Supabase Auth)
│       │   ├── layout.tsx            # Root layout with Sidebar
│       │   ├── dashboard/page.tsx    # KPI overview dashboard
│       │   ├── students/page.tsx     # Roster management + promotions
│       │   ├── enroll/page.tsx       # New student admission form
│       │   ├── attendance/page.tsx   # Ledger view + manual check-in
│       │   ├── check-in/page.tsx     # QR scanner kiosk (public, no auth)
│       │   ├── payments/page.tsx     # Fee collection + ledger
│       │   ├── materials/page.tsx    # Curriculum & homework quest manager
│       │   ├── exams/page.tsx        # Exam creation + bulk grading
│       │   ├── schedule/page.tsx     # Master schedule + overrides
│       │   ├── leaderboard/page.tsx  # Admin-side XP leaderboard
│       │   ├── achievements/page.tsx # Hall of Fame + sticker print queue
│       │   ├── print-hub/page.tsx    # ID card batch print engine
│       │   ├── sandbox/page.tsx      # ID card design sandbox/preview tool
│       │   └── api/
│       │       └── cron/
│       │           └── notifications/route.ts  # Vercel Cron handler
│       │
│       ├── components/
│       │   ├── Sidebar.tsx           # Collapsible admin navigation
│       │   ├── AttendanceScanner.tsx # QR scanner + smart session matching
│       │   ├── EnrollStudentForm.tsx # Student enrollment with ID card preview
│       │   └── StudentNameTransformer.tsx  # Name abbreviation utility
│       │
│       └── lib/
│           ├── supabase.ts           # Supabase client instance
│           ├── gamification.ts       # RANKS & ACHIEVEMENTS dictionaries
│           ├── push.ts               # Web Push dispatch engine (server action)
│           ├── localdb.ts            # Dexie.js offline scan buffer
│           └── sw.ts                 # Serwist service worker source
│
│
└── icms-student-portal/              # 📱  STUDENT PWA PORTAL
    ├── public/
    │   ├── icon.png
    │   ├── manifest.json
    │   └── sw.js                     # Manually managed service worker
    │
    └── src/
        ├── app/
        │   ├── page.tsx              # Student login (QR ID + PIN, multi-account)
        │   ├── layout.tsx            # Root layout with PWA meta tags
        │   ├── globals.css           # Global styles + animation keyframes
        │   └── dashboard/
        │       ├── page.tsx          # Main student dashboard
        │       ├── attendance/       # Personal attendance history
        │       ├── achievements/     # Trophy room (ranks + badges)
        │       ├── exams/            # Exam result vault
        │       ├── leaderboard/      # Batch-scoped arena leaderboard
        │       ├── ledger/           # XP transaction history
        │       ├── payments/         # Fee history + PDF receipt download
        │       ├── quests/           # Homework quest board
        │       ├── schedule/         # 14-day personal timeline
        │       └── settings/         # PIN change
        │
        ├── components/
        │   ├── PwaRegister.tsx       # Service worker registration
        │   ├── dashboard/
        │   │   ├── TopNav.tsx        # Header with student name + lock button
        │   │   ├── HeroStats.tsx     # XP display + rank card + progress bar
        │   │   ├── QuestHub.tsx      # Active quests preview widget
        │   │   ├── ClassCycle.tsx    # Cycle progress bar widget
        │   │   ├── PushSubscriber.tsx # Push permission request banner
        │   │   └── *Button.tsx       # Navigation button components (×8)
        │
        └── lib/
            ├── supabase.ts           # Supabase client instance
            └── gamification.ts       # Shared RANKS/ACHIEVEMENTS + calculateRank()
```

---

## 🔧 Tech Stack Deep Dive

### Core Technologies

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js | 16 | App Router, SSR, API Routes, Cron endpoints |
| **Language** | TypeScript | 5 | End-to-end type safety |
| **UI** | React | 19 | Component model for both portals |
| **Styling** | Tailwind CSS | 4 | Utility-first, zero-runtime styling |
| **Database** | Supabase (PostgreSQL) | Latest | Relational data, Row Level Security |
| **Auth** | Supabase Auth | Latest | Admin email/password auth |
| **Realtime** | Supabase Client | 2.x | Direct client-side queries |
| **Push Notifications** | web-push + VAPID | 3.x | Native Web Push API via service worker |
| **Offline Support** | Dexie.js | 4.x | IndexedDB wrapper for offline scan buffering |
| **Service Worker (Admin)** | Serwist | 9.x | Precaching, runtime caching, push handling |
| **QR Scanning** | @yudiel/react-qr-scanner | 2.x | Camera-based QR code detection |
| **QR Generation** | qrcode | 1.5 | Student ID QR code generation |
| **PDF Export** | jsPDF + html-to-image | Latest | Receipt PDF generation in the browser |
| **Animation** | tailwindcss-animate | 1.x | Slide-in, fade-in transitions |
| **Deployment** | Vercel | — | Edge hosting, cron jobs, environment secrets |

---

### 💡 Why Vercel + Supabase?

> This combination wasn't chosen by accident — it was chosen because it eliminates entire categories of infrastructure problems.

**Vercel** handles deployment, CDN distribution, edge functions, and cron scheduling with zero DevOps overhead. Deploying a new version is a single `git push`. Cron jobs for payment reminders are configured in `vercel.json` — no separate worker processes, no cloud scheduler to manage.

**Supabase** provides a full PostgreSQL database, a PostgREST API layer, Row Level Security, and a real-time client — all accessible via a single JavaScript SDK. There is no ORM to configure, no migration runner to wire up manually for quick iterations, and no separate authentication service to integrate. The student portal and admin terminal both connect to the same Supabase project, ensuring data consistency with zero duplication.

The combination means a single developer can build, deploy, and operate a full production system — including auth, database, file queries, real-time updates, and background jobs — without managing any servers.

---

## 🚀 Quick Start

### For End Users (Admins)

1. Request access credentials from your system administrator.
2. Navigate to the **Admin Terminal**: [icms-admin-portal.vercel.app](https://icms-admin-portal.vercel.app/)
3. Log in with your admin email and password.
4. For the student kiosk, navigate to `/check-in` — this page requires no authentication and is designed to run on a shared tablet at the classroom entrance.

### For Students

1. Receive your physical student ID card from your instructor.
2. Navigate to the **Student Portal**: [icms-student-access-node.vercel.app](https://icms-student-access-node.vercel.app/)
3. Enter your Student ID (printed on your card) and your 4-digit PIN.
4. Tap the browser prompt to **"Add to Home Screen"** for the native app experience.
5. Allow push notifications when prompted to receive real-time alerts for homework, schedules, and exam results.

---

### For Developers

#### Prerequisites

- **Node.js** v18+ (v20 LTS recommended)
- **npm**, **yarn**, or **pnpm**
- A **Supabase** project ([create one free at supabase.com](https://supabase.com))
- A **Vercel** account for deployment (optional for local dev)
- **VAPID keys** for push notifications — generate with:
  ```bash
  npx web-push generate-vapid-keys
  ```

---

#### 1. Clone the Repository

```bash
git clone https://github.com/String-Aki/ICT-Cram-Management-System-ICMS.git
cd ICT-Cram-Management-System-ICMS
```

---

#### 2. Set Up the Admin Terminal (`icms-v1`)

```bash
cd icms-v1
npm install        # or: yarn install / pnpm install
```

Create a `.env.local` file in `icms-v1/`:

```env
# Supabase — found in your Supabase project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key

# Web Push — VAPID keys generated above
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Cron Security (optional — add to vercel.json cron config)
CRON_SECRET=your-random-secret-string
```

Start the development server:

```bash
npm run dev
# Admin terminal available at http://localhost:3000
```

---

#### 3. Set Up the Student Portal (`icms-student-portal`)

```bash
cd ../icms-student-portal
npm install
```

Create a `.env.local` file in `icms-student-portal/`:

```env
# Same Supabase project as the admin terminal
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-anon-key

# Same VAPID public key (private key NOT needed here — push is sent server-side)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
```

Start the development server on a different port:

```bash
npm run dev -- -p 3001
# Student portal available at http://localhost:3001
```

---

#### 4. Supabase Database Setup

The following tables are required in your Supabase project. Create them via the Supabase SQL editor or Table Editor:

| Table | Key Columns | Description |
|---|---|---|
| `students` | `id`, `full_name`, `grade_batch`, `qr_code`, `pin_code`, `total_xp`, `cycle_classes`, `card_variant`, `is_active`, `enrollment_date` | Core student records |
| `attendance_logs` | `id`, `student_id`, `scanned_at`, `status`, `schedule_id` | Every attendance event (present, manual, absent) |
| `xp_transactions` | `id`, `student_id`, `amount`, `reason`, `created_at` | XP ledger — every credit and debit |
| `payments` | `id`, `student_id`, `amount`, `payment_month`, `paid_at`, `notes` | Fee payment records |
| `class_materials` | `id`, `title`, `type`, `grade_batch`, `xp_reward`, `deadline`, `resource_url`, `target_students`, `is_active` | Library items and homework quests |
| `homework_submissions` | `id`, `material_id`, `student_id`, `submitted_at` | Quest completion tracking |
| `exams` | `id`, `title`, `grade_batch`, `total_marks`, `max_xp`, `is_completed` | Exam event definitions |
| `exam_results` | `id`, `exam_id`, `student_id`, `score`, `xp_awarded`, `awarded_at` | Per-student exam scores |
| `schedules` | `id`, `title`, `schedule_type`, `day_of_week`, `specific_date`, `start_time`, `end_time`, `parent_schedule_id`, `override_action`, `target_grades`, `target_students`, `is_active` | Class schedule and overrides |
| `push_subscriptions` | `id`, `student_id`, `endpoint`, `p256dh`, `auth`, `user_agent` | Web Push subscription tokens |
| `student_achievements` | `id`, `student_id`, `achievement_id`, `awarded_at` | Unlocked achievement badges |
| `card_print_queue` | `id`, `student_id`, `status`, `added_at` | ID card printing pipeline |

> **Tip:** Enable Row Level Security (RLS) on all tables. The student portal uses the anon key and relies on RLS policies to prevent students from reading each other's sensitive data.

---

#### 5. Deploy to Vercel

```bash
# From the project root, deploy each app separately
cd icms-v1
vercel --prod

cd ../icms-student-portal
vercel --prod
```

Add all `.env.local` variables as **Environment Variables** in each Vercel project's settings dashboard.

To enable the payment reminder cron job, add to `icms-v1/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/notifications",
      "schedule": "0 8 * * *"
    }
  ]
}
```

> This fires the cron daily at 8 AM UTC. Adjust the schedule to match your local timezone offset.

---

## 🗺️ Future Roadmap

Based on the current architecture, these are the highest-impact features that would take ICMS to the next level:

### 1. 📊 Analytics & Reporting Dashboard
The data is all there — attendance logs, XP transactions, payment records, exam scores. The next logical step is a dedicated analytics view with charts: attendance rate over time per grade, revenue trends, XP distribution curves, and at-risk student flags (students whose attendance or XP trajectory is dropping). Recharts is already a dependency in the student portal, making this a natural addition.

### 2. 🤖 Automated Achievement Engine
Currently, achievements like "Player One" (first check-in of the day) and "Warp Speed" (early check-in 5 classes in a row) are defined in the gamification dictionary but are awarded manually. A Supabase Edge Function or expanded cron job could evaluate achievement conditions automatically on every scan event — fully closing the loop on the gamification system.

### 3. 💬 In-App Messaging / Announcement Feed
Rather than relying solely on push notifications (which require opt-in), a lightweight announcement feed visible on the student dashboard would ensure all students see critical updates — class cancellations, exam schedule changes, new materials — even if they denied notification permissions.

### 4. 📱 Offline-First Student Portal
The admin terminal already has offline scan buffering via Dexie.js. Extending this capability to the student portal — caching the schedule, quest board, and XP data locally and syncing on reconnect — would make the app fully functional in low-connectivity environments, which is common in mobile data scenarios.

---

## 🤝 Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change, especially for anything touching the database schema or the gamification logic.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

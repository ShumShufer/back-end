# ShumShufer (ሹም ሹፌር) — Driving School Management & Learning Platform (Backend)

[![Production Status](https://img.shields.io/badge/Production-Ready-brightgreen)](https://github.com/ShumShufer)
[![Tests](https://img.shields.io/badge/Tests-15%2F15%20Passing-success)](https://github.com/ShumShufer)
[![License](https://img.shields.io/badge/License-ISC-blue)](https://github.com/ShumShufer)

A full-stack, enterprise-grade driving school management and digital learning platform specifically tailored for Ethiopia. It integrates national identity verification (**Fayda**), online payments (**Chapa**), dynamic multi-role workspaces, automated background jobs, and hierarchical scheduling.

---

## 🚀 Quick Start (Production via Docker Compose)

The entire platform (PostgreSQL database, Express TypeScript API, and Nginx-powered React SPA) can be launched with a single command:

```bash
docker compose up --build -d
```

- **Frontend Application**: [http://localhost:5173](http://localhost:5173) or [http://localhost](http://localhost)
- **Backend API**: [http://localhost:3005/api/v1](http://localhost:3005/api/v1)
- **Health Check**: [http://localhost:3005/health](http://localhost:3005/health)

---

## 🔑 Demo & Evaluation Credentials

All seeded accounts share the default password: **`password123`**

| Role | Email | Scope / School | Key Capabilities to Test |
|---|---|---|---|
| **SUPER_ADMIN** | `superadmin@shumshufer.com` | Platform-wide | Platform KPIs, school approvals, cross-school commission overview, system broadcast announcements, Fayda audits |
| **ADMIN** | `admin@addisdriving.com` | Addis Driving Academy | School profile & branches, dynamic application form builder, student enrollment inbox, staff hiring, revenue reporting |
| **ADMIN** | `admin@boledriving.com` | Bole Driving School | Multi-branch operations, inter-school agreement proposals & practice request approvals |
| **EDUCATION_HEAD** | `edhead@addisdriving.com` | Addis Driving Academy | Master scheduling (locks against lower ranks), curriculum oversight, quiz builder |
| **MENTOR** | `mentor1@addisdriving.com` | Addis Driving Academy | Classroom hub, daily attendance marking, task creation & grading, course final exam result publishing |
| **STUDENT** | `student1@gmail.com` | Addis Driving Academy | Video course player, daily practice quizzes, task submissions, progress report, practice-elsewhere requests |

---

## 🏗️ Architecture & Technology Stack

### Backend (`/back-end`)
- **Runtime & Language**: Node.js 22 LTS, TypeScript (ESM)
- **Framework**: Express 5.x
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Security**: JWT token rotation, bcrypt password hashing, Helmet security headers, Express rate limiting, strict Zod schema validation
- **Scheduler**: Autonomous background workers (`ScheduleReminderJob`, `ApplicationDeadlineJob`, `PriceRecalculationJob`)
- **Third-Party Integrations**:
  - **Fayda (National ID)**: Age & identity verification client with mock sandbox fallback
  - **Chapa Payment Gateway**: Transaction initialization, verification, and HMAC-SHA256 signed webhook processing

### Frontend (`/front-end`)
- **Library & Framework**: React 19, Vite 8, React Router v7
- **Styling**: Tailwind CSS v4 with unified design tokens (`tokens.css`) and responsive layout
- **State Architecture**: Decoupled domain service layer (`src/services`) backed by React Context & `useReducer`
- **Mapping**: Interactive Leaflet maps for school & branch locations across Addis Ababa
- **Production Server**: Multi-stage Nginx container with gzip compression, security headers, and client-side history fallback

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- Node.js v18+ (Node.js 20 or 22 recommended)
- PostgreSQL running locally (default database: `shumshufer-db`)

### 2. Backend Setup
```bash
cd back-end
npm install
cp .env.example .env
# Edit .env to set your PostgreSQL DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm run prisma:seed    # Seeds 4 schools, 24 students, classrooms, courses & quizzes
npm run build          # Builds production TypeScript bundle
npm test               # Runs unit and integration tests (15/15 passing)
npm run dev            # Starts hot-reloading dev server on http://localhost:3005
```

---

## 🧪 Testing & Verification

The backend includes automated unit and integration tests:

```bash
cd back-end
npm test
```

### Covered Test Suites:
1. **Auth & Identity**: Password hashing with bcrypt, Fayda ID validation & Ethiopian phone number verification.
2. **RBAC & Priority Engine**: Role hierarchy check (`SUPER_ADMIN > ADMIN > EDUCATION_HEAD > MENTOR > STUDENT`) and schedule priority rules (`SCHEDULE_LOCKED` on unauthorized override).
3. **Chapa Payments**: Transaction initialization payload, mock verification, and cryptographic HMAC-SHA256 webhook signature validation.
4. **Price Recommendation Engine**: Mean, standard deviation, and 5% market positioning premium calculations with sample-size confidence tiers.
5. **Health & Middleware**: Global `/health`, `/api/v1/health`, and standard JSON error envelope 404 handler.

---

## 👥 The Team

- **Zeamanuel Mebit** (ID: CTC-3498-26) — Lead, Code Reviewer, Architecture
- **Yonnas kelem** (ID: CTC-3303-26) — Backend Developer (APIs, Prisma, Security & Scheduling)
- **Yeabsra** (ID: CTC-2878-26) — Frontend Developer (Workspaces, Services & Responsive Layouts)
- **Yohannes** (ID: CTC-7823-26) — UI/UX Designer & Frontend Developer

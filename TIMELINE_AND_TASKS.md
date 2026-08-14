# 10-Day Delivery Plan

Team: Zeaman (lead/full-stack), Yonas (backend), Yeabsra (frontend), Yohannes (frontend + UI/UX)

## MVP Scope Decision

The full spec in the design docs is a multi-month product. To ship something real in 10 days, we cut to **one clean end-to-end loop** and mark everything else as stretch. This is what gets built:

**In scope (MVP):**
- Auth (register/login/JWT) — Fayda verification **stubbed** (a mock "verified" flag, real integration later)
- School browsing (public) + School profile
- Student enrollment application (submit → admin accept/reject)
- School/Branch/Classroom/Course/Topic CRUD (Admin, Education Head, Mentor)
- Classroom hub: announcements, resources, schedule, what's new
- Tasks/assignments: create, submit, grade, feedback
- Student progress view (per course/topic)
- Basic notifications (in-app list, no sockets)
- Role-based dashboards (Student, Mentor, Admin, Super Admin) — Education Head folded into Admin views for MVP
- Attendance (simple mark present/absent)
- Reviews/ratings (basic)

**Explicitly cut / stretch (only if time remains at the end):**
- Chapa payments (stub the button, no live transaction)
- Inter-school agreements / practice-elsewhere
- Staff job applications
- Price recommendation algorithm (hardcode a placeholder)
- Driver public directory

---

## Timeline Overview

| Day | Theme |
|---|---|
| 1 | Project setup, schema, design system, branching |
| 2 | Auth (backend + frontend) |
| 3 | Schools/Branches/Classrooms core CRUD |
| 4 | Enrollment applications flow |
| 5 | Courses/Topics content structure |
| 6 | Tasks, submissions, grading |
| 7 | Schedules, announcements, resources, attendance |
| 8 | Notifications, reviews, dashboards |
| 9 | Integration, responsiveness, bug bash |
| 10 | Final QA, deploy, demo prep |

---

## Daily Task Allocation

### Day 1 — Setup
- **Zeaman**: Create both GitHub orgs/repos, branch protection rules, CI skeleton (lint+build on PR), issue templates, project board with all 10 days as milestones, `.env.example` for both repos, Docker compose for local Postgres.
- **Yonas**: Write `schema.prisma` for all MVP entities, run first migration, seed script with dummy schools/users, set up Express app skeleton (`app.ts`, `server.ts`, error handler, logger, config/env).
- **Yeabsra**: Scaffold frontend repo (Vite+React+TS+Tailwind), router skeleton with route config + `ProtectedRoute`, `AppShell` layout, folder structure per design doc (`services/`, `context/`, `features/`).
- **Yohannes**: Build `theme/tokens.css` design tokens (colors, spacing, typography, radius, shadow), Tailwind config mapped to tokens, base component kit (Button, Input, Card, Badge) with Storybook-less visual sanity check page, mobile breakpoints defined.

### Day 2 — Auth
- **Zeaman**: Review Day 1 PRs, merge to dev branches, pair with Yonas on JWT middleware, set up `authenticate`/`authorize` middleware.
- **Yonas**: `auth.routes/controller/service`: register, login, refresh, logout, `/auth/me`; password hashing; Fayda verification stub endpoint.
- **Yeabsra**: `IAuthService` interface + mock + remote implementations, `AuthContext`/`AuthProvider`, Login/Register screens, token storage + httpClient interceptor.
- **Yohannes**: Design & build Login, Register, Fayda-verification-pending screens (responsive), Notifications bell UI shell, Toast/Modal components in `UIContext`.

### Day 3 — Schools/Branches/Classrooms core
- **Zeaman**: Code review + merges, pair on `scopeToSchool` middleware, unblock integration issues.
- **Yonas**: Schools, Branches, Classrooms CRUD endpoints + RBAC; role-assignment endpoint (SUPER_ADMIN→ADMIN, ADMIN→EDUCATION_HEAD/MENTOR).
- **Yeabsra**: `ISchoolService`/`IClassroomService` (mock+remote), `SchoolContext`/`ClassroomContext`, School browse + School profile (public) screens wired to mock data.
- **Yohannes**: Design School Browse, School Profile, Admin School-Editor, Branch management screens; Sidebar/Topbar per role.

### Day 4 — Enrollment applications
- **Zeaman**: Review/merge; pair on application-accept logic (auto-creates Enrollment + assigns classroom).
- **Yonas**: `ApplicationFormTemplate`, Enrollment endpoints (submit/list/accept/reject), notification trigger on status change.
- **Yeabsra**: `IEnrollmentService`, `EnrollmentContext`, Application form screen (dynamic fields), My Applications (student), Applications Inbox (admin).
- **Yohannes**: Design application form UX (online/in-person toggle), status tracker UI, Admin inbox review UI with accept/reject actions + feedback states.

### Day 5 — Courses/Topics
- **Zeaman**: Review/merge; pair on Course/Topic ordering + mandatory-course logic.
- **Yonas**: Course, Topic, Quiz endpoints; attach-course-to-classroom endpoint; resource upload endpoint (`/uploads` abstraction, local/S3-compatible storage stub).
- **Yeabsra**: `ICourseService`, Course list/detail, Topic player screen (video/content/resources/quiz), Course creation form (mentor/admin).
- **Yohannes**: Design Topic player, Course progress stepper component, Quiz-taking UI, mobile layout pass on all Day 3-5 screens.

### Day 6 — Tasks, submissions, grading
- **Zeaman**: Review/merge; pair on grading + feedback flow; start writing integration tests for critical paths (auth, enrollment, task submission).
- **Yonas**: Task, Submission endpoints; grading endpoint; `students/:id/submissions` history endpoint; `students/:id/progress` endpoint.
- **Yeabsra**: `ITaskService`, `TaskContext` (or extend `ClassroomContext`), Task list, Task detail+submit screen, Mentor grading screen.
- **Yohannes**: Design Task/Assignment cards, submission history + feedback thread UI, deadline countdown component, grading UX for mentor.

### Day 7 — Schedules, announcements, resources, attendance
- **Zeaman**: Review/merge; implement schedule priority-lock rule end-to-end with Yonas; sanity-check RBAC across all endpoints so far.
- **Yonas**: Schedule endpoints (priority rank check), Announcement endpoints, Attendance session+records endpoints.
- **Yeabsra**: Schedule/Calendar screen, Announcements feed ("What's New"), Attendance marking screen (mentor) + history (student).
- **Yohannes**: Design Calendar component, Announcement cards, Attendance UI, continue responsiveness pass.

### Day 8 — Notifications, reviews, dashboards
- **Zeaman**: Review/merge; wire notification dispatcher to all trigger points from prior days (announcement, application status, task graded, schedule change).
- **Yonas**: Notifications endpoints (list/read/read-all), Reviews endpoints, dashboard summary endpoints (per role).
- **Yeabsra**: `INotificationService`, `NotificationContext` with polling, Notifications Center screen, wire dashboards to real aggregated data.
- **Yohannes**: Design/polish all 4 role dashboards (cards, charts if time permits), Reviews UI (leave + display), final visual QA pass across the app.

### Day 9 — Integration & bug bash
- **Zeaman**: Full run-through of every user flow end-to-end (student signup → apply → get accepted → take course → submit task → get graded); triage bugs into GitHub issues and assign.
- **Yonas**: Fix backend bugs from triage; add remaining input validation gaps; tighten security headers/rate limiting; write/finish integration tests.
- **Yeabsra**: Fix frontend logic/service-layer bugs; verify mock↔remote swap works cleanly; loading/error states audit on every screen.
- **Yohannes**: Fix UI/responsive bugs across breakpoints; consistency pass on spacing/typography/colors against tokens; empty-state and error-state visuals.

### Day 10 — Final QA & demo prep
- **Zeaman**: Merge dev → main for both repos after final approval, deploy (staging/production), write final README + setup docs, prepare demo script.
- **Yonas**: Final backend smoke test on deployed environment, seed demo data, monitor logs during demo rehearsal.
- **Yeabsra**: Final frontend smoke test on deployed environment, cross-browser check.
- **Yohannes**: Final visual polish, prepare demo walkthrough slides/screens, record backup demo video in case of live issues.

---

## GitHub Issue Labeling Suggestion

When creating issues from this plan, tag each with:
- `area:frontend` / `area:backend`
- `role:student` / `role:mentor` / `role:admin` / `role:super-admin` (when relevant)
- `day-1` … `day-10` milestone
- `priority:mvp` / `priority:stretch`

This lets you filter the board by person, day, or area at standup.

# Project plan

Team: Zeaman (lead/backend + code reviewer), Yonas (backend), Yeabsra (frontend), Yohannes (frontend + UI/UX designer)

## Overview & Scope
We have 6 days to deliver the full production scope of the platform, with zero features cut initially. We will minimize development environment assumptions and aim to implement the full feature set as described in the design documents. 
Every feature is assigned to one Frontend (FE) developer and one Backend (BE) developer. Integration happens immediately after the feature is built.

---

## Daily Task Allocation

### Day 1 — Identity & Foundation
#### Feature 1: Auth, Profiles & Identity Verification (Fayda)
**Frontend (John):** 
- **Pages**: Register, Login, Forgot/Reset Password, Fayda Verification Pending, Onboarding/Role Selection, User Profile.
- **Context/Services**: `AuthContext`, `IAuthService` (register, login, verify-fayda, me).
- **Business Logic & Edge Cases**: Handle auto-logout on 401. Ensure forms have strict validation. Show loading state during Fayda verification. 
- **Prerequisites**: Zod form validation, JWT interceptor setup.

**Backend (Yoni):**
- **Routes/Controllers**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-fayda`, `/users/:id`.
- **Services**: `auth.service.ts` (password hashing, JWT generation, calling `faydaClient.ts` for verification), `users.service.ts`.
- **Business Logic & Edge Cases**: Handle expired refresh tokens gracefully. Prevent login if `verificationStatus === REJECTED`. Handle duplicate email/phone numbers (Prisma `P2002`).

#### Feature 2: School, Branch & Classroom Core
**Frontend (Yeab):**
- **Pages**: Browse Schools (public), School Profile (public), Admin School Profile Editor, Branch Management, Classrooms Directory, Classroom detail hub shell.
- **Context/Services**: `SchoolContext`, `ISchoolService`, `IClassroomService`.
- **Business Logic & Edge Cases**: Filter/sort on school list. Handle empty states if a school has no branches or courses. 
- **Prerequisites**: Role-based access control in React Router (`ProtectedRoute`).

**Backend (Zeaman):**
- **Routes/Controllers**: `/schools`, `/schools/:id`, `/schools/:id/branches`, `/classrooms`.
- **Services**: `schools.service.ts`, `branches.service.ts`, `classrooms.service.ts`.
- **Business Logic & Edge Cases**: Implement `scopeToSchool` middleware strictly. Handle geographic queries (latitude/longitude) if filtering by distance.

---

### Day 2 — Applications & Content Catalog
#### Feature 3: Enrollment & Staff Applications
**Frontend (John):**
- **Pages**: School Application Form (dynamic fields), My Applications (student), Enrollment Inbox (admin), Post Staff Job Opening, Staff Applications Inbox.
- **Context/Services**: `EnrollmentContext`, `IEnrollmentService`, `IStaffApplicationService`.
- **Business Logic & Edge Cases**: Dynamic form rendering based on `ApplicationFormTemplate`. Handling state changes (pending -> accepted -> assigned to classroom).
- **Prerequisites**: Dynamic form builders in React.

**Backend (Yoni):**
- **Routes/Controllers**: `/schools/:id/application-form`, `/schools/:id/applications`, `/applications/:id/accept`, `/staff-posts`, `/schools/:id/staff-applications`.
- **Services**: `enrollments.service.ts`, `staffApplications.service.ts`.
- **Business Logic & Edge Cases**: Auto-create `Enrollment` record and assign to classroom when an application is accepted. Trigger notifications to the applicant.

#### Feature 4: Course Catalog & Topics
**Frontend (Yeab):**
- **Pages**: Course Catalog (browse), Course Detail / Topic Player (video/content), Admin Course & Pricing Editor, Create/Edit Topic (mentor view).
- **Context/Services**: `CourseContext`, `ICourseService`.
- **Business Logic & Edge Cases**: Prevent accessing topic content if not enrolled (unless `isFree`). Video player state tracking. Displaying AI price recommendations.
- **Prerequisites**: Media player integration.

**Backend (Zeaman):**
- **Routes/Controllers**: `/courses`, `/courses/:id/topics`, `/courses/:id/price-recommendation`.
- **Services**: `courses.service.ts`, `priceRecommendation.ts` algorithm.
- **Business Logic & Edge Cases**: Calculate and return a suggested price based on market data. Validate topic ordering logic.

---

### Day 3 — Tasks & Grading
#### Feature 5: Task Management & Quizzes
**Frontend (John):**
- **Pages**: Classroom Tasks List, Task Detail & Submission, Quiz/Test Builder (mentor), Daily Practice Quizzes (standalone).
- **Context/Services**: `TaskContext`, `ITaskService`, `IQuizService`.
- **Business Logic & Edge Cases**: Quiz countdown timers. Handling multiple attachments in submissions. Drag-and-drop file uploads.
- **Prerequisites**: FormData handling for file uploads.

**Backend (Yoni):**
- **Routes/Controllers**: `/tasks`, `/tasks/:id/submissions`, `/quizzes`, `/uploads`.
- **Services**: `tasks.service.ts`, `uploads.service.ts` (S3/local storage abstraction).
- **Business Logic & Edge Cases**: Enforce deadlines (reject late submissions unless allowed). Ensure students only see tasks for their enrolled classrooms.

#### Feature 6: Grading, Feedback & Course Results
**Frontend (Yeab):**
- **Pages**: Mentor Grading Screen (submission history, rubric), My Results / Performance Report (student).
- **Context/Services**: `ITaskService` (grading), `ICourseResultService`.
- **Business Logic & Edge Cases**: Displaying rich-text feedback. Calculating overall progress percentages.
- **Prerequisites**: Chart/progress bar rendering.

**Backend (Zeaman):**
- **Routes/Controllers**: `/submissions/:id/grade`, `/course-results/:courseId/publish`, `/students/:id/progress`.
- **Services**: `tasks.service.ts` (grading), `courses.service.ts` (results).
- **Business Logic & Edge Cases**: Auto-evaluate pass/fail status when final exam is graded. Trigger notifications on grade publish.

---

### Day 4 — Logistics & Networking
#### Feature 7: Schedules (Priority-aware) & Attendance
**Frontend (John):**
- **Pages**: Classroom Schedule/Calendar, Global Education Schedule Builder (education head), Attendance Marking Screen (mentor), Attendance History.
- **Context/Services**: `IScheduleService`, `IAttendanceService`.
- **Business Logic & Edge Cases**: Handle blocked-out dates. Show conflicts visually. Mentor bulk attendance marking.
- **Prerequisites**: Complex calendar component integration (e.g., FullCalendar).

**Backend (Yoni):**
- **Routes/Controllers**: `/schedules`, `/attendance-sessions`.
- **Services**: `schedules.service.ts`, `attendance.service.ts`.
- **Business Logic & Edge Cases**: **Priority Rule Enforcement**: Prevent lower roles (Mentor) from overriding higher roles (Education Head/Admin) in schedules. Send 403 `SCHEDULE_LOCKED`.

#### Feature 8: Inter-School Agreements & Practice-Elsewhere
**Frontend (Yeab):**
- **Pages**: Inter-School Agreements (propose/accept), Practice-Elsewhere Requests (student request form, admin inbox).
- **Context/Services**: `IAgreementService`, `IPracticeRequestService`.
- **Business Logic & Edge Cases**: Show fee splitting terms clearly. Status tracking for cross-school approvals.
- **Prerequisites**: Multi-tenant data concepts.

**Backend (Zeaman):**
- **Routes/Controllers**: `/agreements`, `/practice-requests`.
- **Services**: `agreements.service.ts`.
- **Business Logic & Edge Cases**: Verify both schools exist and agree on fee splits. Auto-trigger payment requirements upon approval.

---

### Day 5 — Commerce & Engagement
#### Feature 9: Payments (Chapa) & Revenue
**Frontend (John):**
- **Pages**: Payments / Billing History, Checkout Flow (redirect to Chapa), Admin Revenue & Commission Report.
- **Context/Services**: `PaymentContext`, `IPaymentService`.
- **Business Logic & Edge Cases**: Handle payment failure redirects. Show pending payment statuses.
- **Prerequisites**: Chapa payment gateway docs.

**Backend (Yoni):**
- **Routes/Controllers**: `/payments/initiate`, `/payments/webhook`, `/schools/:id/revenue`.
- **Services**: `payments.service.ts` (Chapa integration), `chapaClient.ts`.
- **Business Logic & Edge Cases**: Webhook signature verification is CRITICAL. Idempotency for webhook processing. Deduct platform commission accurately.

#### Feature 10: Notifications, Reviews & Student Reports
**Frontend (Yeab):**
- **Pages**: Notifications Center, Leave Review (student), View Reviews (public), Report Student (mentor).
- **Context/Services**: `NotificationContext`, `IReviewService`, `IReportService`.
- **Business Logic & Edge Cases**: Polling for unread notifications. Aggregating star ratings.
- **Prerequisites**: Notification bell polling/websockets.

**Backend (Zeaman):**
- **Routes/Controllers**: `/notifications`, `/schools/:id/reviews`, `/classrooms/:id/reports`.
- **Services**: `notifications.service.ts` (dispatcher), `reviews.service.ts`, `reports.service.ts`.
- **Business Logic & Edge Cases**: `notificationDispatcher.ts` must fan-out correctly to multiple recipients based on topic subscriptions.

---

### Day 6 — Polish & Production
#### Feature 11: Dashboards & Reporting
**Frontend (John):**
- **Pages**: Super Admin Dashboard (platform metrics), Admin Dashboard (school KPIs), Mentor Dashboard, Education Head Dashboard.
- **Context/Services**: Analytics services for each role.
- **Business Logic & Edge Cases**: Rendering charts for student count, revenue, graduation rates.
- **Prerequisites**: Data visualization libraries (e.g., Chart.js or Recharts).

**Backend (Yoni):**
- **Routes/Controllers**: `/admin/dashboard`, `/schools/:id/dashboard`, `/education-head/:id/dashboard`, `/mentor/:id/dashboard`.
- **Services**: `admin.service.ts` and others for aggregating data.
- **Business Logic & Edge Cases**: Efficient Prisma aggregations (`groupBy`, `count`, `sum`) to prevent slow load times.

#### Feature 12: End-to-End Bug Bash & Final QA
**Frontend (Yeab) & Backend (Zeaman):**
- Full end-to-end user flow testing (register -> pay -> enroll -> learn -> submit task -> get graded -> graduate -> practice elsewhere).
- Mobile responsiveness audit on all screens.
- Security audit (headers, rate limiting, JWT rotation).
- Production deployment and demo preparation.

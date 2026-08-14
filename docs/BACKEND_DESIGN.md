# Driving School Platform — Backend Design Document

Repo: `driving-platform-backend`
Stack: Express.js + TypeScript, PostgreSQL + Prisma ORM, JWT, Zod, Chapa (payments)

---

## 1. Guiding Principles

- Strict layering: **routes → middlewares → controllers → services → Prisma**. Controllers never touch Prisma directly.
- Every mutation is validated (Zod) before it reaches a service.
- Every route is authorized (JWT + RBAC middleware) before it reaches a controller.
- Uploaded files/assets are never stored as DB blobs — stored in object storage, DB holds references only.
- All list endpoints are paginated, filterable, and return a consistent envelope.

---

## 2. Repository Structure

```
driving-platform-backend/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── src/
│   ├── server.ts                     # entrypoint, starts HTTP server
│   ├── app.ts                        # express app, global middleware wiring
│   ├── config/
│   │   ├── env.ts                    # validated env vars (Zod)
│   │   ├── db.ts                     # Prisma client singleton
│   │   ├── logger.ts
│   │   └── constants.ts              # role hierarchy, pagination defaults
│   │
│   ├── middlewares/
│   │   ├── authenticate.ts           # verifies JWT, attaches req.user
│   │   ├── authorize.ts              # RBAC: authorize(['ADMIN','SUPER_ADMIN'])
│   │   ├── validate.ts               # generic Zod-schema validator (body/query/params)
│   │   ├── errorHandler.ts           # centralized error → HTTP response
│   │   ├── notFound.ts
│   │   ├── rateLimiter.ts
│   │   ├── securityHeaders.ts        # helmet config
│   │   ├── requestLogger.ts
│   │   └── scopeToSchool.ts          # ensures admin/mentor actions stay within their own school
│   │
│   ├── routes/
│   │   ├── index.ts                  # mounts all sub-routers under /api/v1
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── schools.routes.ts
│   │   ├── branches.routes.ts
│   │   ├── agreements.routes.ts
│   │   ├── classrooms.routes.ts
│   │   ├── courses.routes.ts
│   │   ├── topics.routes.ts
│   │   ├── quizzes.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── submissions.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── schedules.routes.ts
│   │   ├── announcements.routes.ts
│   │   ├── enrollments.routes.ts     # school applications
│   │   ├── staffApplications.routes.ts
│   │   ├── resources.routes.ts
│   │   ├── uploads.routes.ts
│   │   ├── payments.routes.ts
│   │   ├── notifications.routes.ts
│   │   ├── reviews.routes.ts
│   │   ├── reports.routes.ts         # student issue reports, performance reports
│   │   └── admin.routes.ts           # super-admin: platform-wide ops
│   │
│   ├── controllers/                  # one file per resource, thin: parse req -> call service -> send res
│   │   └── (mirrors routes/, e.g. classrooms.controller.ts)
│   │
│   ├── services/                     # business logic, orchestrates Prisma + other services
│   │   └── (mirrors routes/, e.g. classrooms.service.ts)
│   │

│   ├── validators/                   # Zod schemas per resource (createX, updateX, queryX)
│   │   └── (e.g. classroom.schema.ts)
│   │
│   ├── helpers/
│   │   ├── pagination.ts
│   │   ├── apiResponse.ts            # success()/error() envelope builders
│   │   ├── priceRecommendation.ts    # course-price suggestion algorithm
│   │   ├── faydaClient.ts            # Fayda National ID verification integration
│   │   ├── chapaClient.ts            # Chapa payment integration
│   │   ├── notificationDispatcher.ts # fan-out to subscribed users/topics
│   │   └── fileStorage.ts            # abstraction over object storage (S3-compatible)
│   │
│   ├── types/                        # shared TS types (Role enum, JwtPayload, ApiResponse<T>)
│   ├── jobs/                         # scheduled/background tasks
│   │   ├── scheduleReminderJob.ts
│   │   ├── applicationDeadlineJob.ts
│   │   └── priceRecalculationJob.ts
│   └── sockets/ (optional, future)   # real-time notifications
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── tsconfig.json
├── package.json
└── docker-compose.yml                # postgres + api for local dev
```

---

## 3. Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **routes** | Declare path + method + middleware chain (`authenticate → authorize → validate → controller`). No logic. |
| **middlewares** | Cross-cutting concerns: auth, RBAC, validation, error normalization, security headers, rate limiting. |
| **controllers** | Extract `req.params/query/body/user`, call exactly one service method, shape the HTTP response via `apiResponse`. No business logic, no Prisma calls. |
| **services** | All business rules: priority-based schedule overrides, price recommendation, agreement fee splitting, notification fan-out, commission calculation. Call `prisma` directly. |
| **validators** | Zod schemas — one per input shape; reused by `validate` middleware and shared conceptually with frontend Zod schemas. |

---

## 4. Auth & RBAC Design

### 4.1 Identity verification
- Signup requires **Fayda (Ethiopian National ID)** verification and age check via `helpers/faydaClient.ts` before a user account is activated.
- `User.verificationStatus`: `PENDING | VERIFIED | REJECTED`.

### 4.2 JWT
- Access token (short-lived, ~15 min) + refresh token (httpOnly cookie or long-lived, rotated).
- Payload: `{ sub: userId, role: Role, schoolId?: string, tokenVersion }`.
- `authenticate` middleware verifies signature/expiry, loads minimal user context onto `req.user`.

### 4.3 RBAC / Role hierarchy
```
SUPER_ADMIN > ADMIN > EDUCATION_HEAD > MENTOR > STUDENT
```
- `authorize([...roles])` middleware checks `req.user.role` is in the allowed set.
- `scopeToSchool` middleware additionally checks that `ADMIN/EDUCATION_HEAD/MENTOR` are acting only within `req.user.schoolId`, using the `:schoolId`/derived resource's school as comparison.
- **Priority rule enforcement** (schedules): `schedules.service.ts` checks the `createdByRole` rank of any existing schedule item before allowing an update/delete from a lower-ranked role; lower ranks get `403 SCHEDULE_LOCKED`.

---

## 5. Data Model (Prisma schema — entities & relations)

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  EDUCATION_HEAD
  MENTOR
  STUDENT
}

enum VerificationStatus { PENDING VERIFIED REJECTED }
enum ApplicationStatus  { PENDING ACCEPTED REJECTED WITHDRAWN }
enum ApplicationMode    { ONLINE IN_PERSON }
enum ScheduleScope       { SCHOOL CLASSROOM }
enum TaskType            { ASSIGNMENT QUIZ EXAM }
enum CoursePassStatus    { NOT_STARTED IN_PROGRESS PASSED FAILED RETAKE_REQUIRED }
enum PaymentType         { ENROLLMENT COURSE_PURCHASE PRACTICE_ELSEWHERE_FEE }
enum PaymentStatus       { PENDING SUCCESS FAILED REFUNDED }
enum NotificationTopic   { SCHOOL_ANNOUNCEMENT STAFF_POST CLASSROOM APPLICATION TASK RESULT PAYMENT SYSTEM }

model User {
  id                 String   @id @default(uuid())
  email              String   @unique
  phone              String?  @unique
  passwordHash       String
  firstName          String
  lastName           String
  role               Role
  faydaId            String?  @unique
  verificationStatus VerificationStatus @default(PENDING)
  dateOfBirth        DateTime
  avatarUrl          String?
  schoolId           String?             # null for STUDENT-at-large or SUPER_ADMIN
  school             School? @relation(fields: [schoolId], references: [id])
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  enrollments        Enrollment[]
  mentorClassrooms   ClassroomMentor[]
  submissions        Submission[]
  attendanceRecords  AttendanceRecord[]
  notifications      NotificationRecipient[]
  payments           Payment[]
  reviews            Review[]
  reportsFiled       StudentReport[] @relation("ReportedBy")
  reportsReceived    StudentReport[] @relation("ReportedStudent")
}

model School {
  id           String   @id @default(uuid())
  name         String
  description  String?
  rating       Float    @default(0)
  status       String   @default("ACTIVE")   # ACTIVE | SUSPENDED | PENDING_APPROVAL
  createdAt    DateTime @default(now())

  branches       Branch[]
  users          User[]
  courses        Course[]
  classrooms     Classroom[]
  applications   Enrollment[]
  staffPosts     StaffApplicationPost[]
  agreementsA    SchoolAgreement[] @relation("SchoolA")
  agreementsB    SchoolAgreement[] @relation("SchoolB")
  reviews        Review[]
  schedules      ScheduleEvent[]
  announcements  Announcement[]
}

model Branch {
  id        String  @id @default(uuid())
  schoolId  String
  school    School  @relation(fields: [schoolId], references: [id])
  name      String
  address   String
  latitude  Float
  longitude Float
}

model SchoolAgreement {
  id          String   @id @default(uuid())
  schoolAId   String
  schoolBId   String
  schoolA     School   @relation("SchoolA", fields: [schoolAId], references: [id])
  schoolB     School   @relation("SchoolB", fields: [schoolBId], references: [id])
  status      String   @default("PENDING")   # PENDING | ACTIVE | TERMINATED
  feeSplit    Json?    # commission/fee split terms
  createdAt   DateTime @default(now())
}

model PracticeElsewhereRequest {
  id             String   @id @default(uuid())
  studentId      String
  homeSchoolId   String
  hostSchoolId   String
  status         String   @default("PENDING") # PENDING | APPROVED | REJECTED | COMPLETED
  fee            Decimal
  createdAt      DateTime @default(now())
}

model Classroom {
  id           String   @id @default(uuid())
  schoolId     String
  school       School   @relation(fields: [schoolId], references: [id])
  name         String
  createdAt    DateTime @default(now())

  mentors        ClassroomMentor[]
  students       Enrollment[]
  courses        ClassroomCourse[]
  announcements  Announcement[]
  resources      Resource[]
  tasks          Task[]
  schedules      ScheduleEvent[]
  attendanceSessions AttendanceSession[]
}

model ClassroomMentor {
  classroomId String
  mentorId    String
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  mentor      User      @relation(fields: [mentorId], references: [id])
  @@id([classroomId, mentorId])
}

model Course {
  id          String   @id @default(uuid())
  schoolId    String?  # null = independent/our own course
  school      School?  @relation(fields: [schoolId], references: [id])
  title       String
  description String?
  price       Decimal
  isFree      Boolean  @default(false)
  createdAt   DateTime @default(now())

  topics          Topic[]
  classroomLinks  ClassroomCourse[]
}

model ClassroomCourse {
  classroomId String
  courseId    String
  order       Int
  mandatory   Boolean @default(true)
  classroom   Classroom @relation(fields: [classroomId], references: [id])
  course      Course    @relation(fields: [courseId], references: [id])
  @@id([classroomId, courseId])
}

model Topic {
  id           String  @id @default(uuid())
  courseId     String
  course       Course  @relation(fields: [courseId], references: [id])
  title        String
  order        Int
  videoUrl     String?
  content      String?     # rich text explanation/instructions
  resources    Resource[]
  quizzes      Quiz[]
}

model Quiz {
  id        String  @id @default(uuid())
  topicId   String? 
  topic     Topic?  @relation(fields: [topicId], references: [id])
  title     String
  questions Json      # array of {question, options, correctAnswer, points}
  passScore Int
}

model Task {
  id           String   @id @default(uuid())
  classroomId  String
  classroom    Classroom @relation(fields: [classroomId], references: [id])
  createdById  String    # mentor
  type         TaskType
  title        String
  description  String?
  attachments  String[]  # asset references
  deadline     DateTime
  createdAt    DateTime @default(now())

  submissions  Submission[]
}

model Submission {
  id          String   @id @default(uuid())
  taskId      String
  studentId   String
  task        Task     @relation(fields: [taskId], references: [id])
  student     User     @relation(fields: [studentId], references: [id])
  attachments String[]
  submittedAt DateTime @default(now())
  grade       Float?
  feedback    String?
  gradedAt    DateTime?
}

model CourseResult {
  id          String   @id @default(uuid())
  studentId   String
  courseId    String
  classroomId String
  status      CoursePassStatus @default(NOT_STARTED)
  finalExamScore Float?
  publishedAt DateTime?
}

model Resource {
  id          String   @id @default(uuid())
  classroomId String?
  topicId     String?
  title       String
  type        String    # PDF | PPT | VIDEO | LINK
  url         String
  mandatory   Boolean  @default(false)
  uploadedAt  DateTime @default(now())
}

model AttendanceSession {
  id           String   @id @default(uuid())
  classroomId  String
  classroom    Classroom @relation(fields: [classroomId], references: [id])
  date         DateTime
  records      AttendanceRecord[]
}

model AttendanceRecord {
  id         String   @id @default(uuid())
  sessionId  String
  studentId  String
  session    AttendanceSession @relation(fields: [sessionId], references: [id])
  student    User @relation(fields: [studentId], references: [id])
  status     String   # PRESENT | ABSENT | LATE | EXCUSED
}

model StudentReport {
  id             String   @id @default(uuid())
  classroomId    String
  reportedById   String
  reportedStudentId String
  reportedBy     User @relation("ReportedBy", fields: [reportedById], references: [id])
  reportedStudent User @relation("ReportedStudent", fields: [reportedStudentId], references: [id])
  note           String
  createdAt      DateTime @default(now())
}

model ScheduleEvent {
  id           String   @id @default(uuid())
  schoolId     String?
  classroomId  String?
  scope        ScheduleScope
  createdByRole Role         # used to enforce the "no override by lower role" rule
  title        String
  startTime    DateTime
  endTime      DateTime
  location     String?
}

model Announcement {
  id          String   @id @default(uuid())
  schoolId    String?
  classroomId String?
  authorId    String
  title       String
  body        String
  audience    String   # ALL_STUDENTS | ALL_STAFF | SPECIFIC_ROLE...
  createdAt   DateTime @default(now())
}

model Enrollment {
  id            String   @id @default(uuid())
  studentId     String
  schoolId      String
  classroomId   String?
  mode          ApplicationMode
  status        ApplicationStatus @default(PENDING)
  formResponses Json              # dynamic form answers per school's ApplicationFormTemplate
  submittedAt   DateTime @default(now())
  reviewedAt    DateTime?
  reviewedById  String?
}

model ApplicationFormTemplate {
  id        String  @id @default(uuid())
  schoolId  String
  fields    Json     # [{key, label, type, required}]
}

model StaffApplicationPost {
  id          String   @id @default(uuid())
  schoolId    String
  role        Role
  description String
  status      String   @default("OPEN")   # OPEN | CLOSED
  createdAt   DateTime @default(now())
  applications StaffApplication[]
}

model StaffApplication {
  id         String  @id @default(uuid())
  postId     String
  applicantId String
  post       StaffApplicationPost @relation(fields: [postId], references: [id])
  status     ApplicationStatus @default(PENDING)
  resumeUrl  String?
  submittedAt DateTime @default(now())
}

model Payment {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        PaymentType
  amount      Decimal
  commission  Decimal   # platform's cut
  status      PaymentStatus @default(PENDING)
  chapaTxRef  String?  @unique
  relatedEntityId String?  # enrollmentId / courseId / practiceRequestId
  createdAt   DateTime @default(now())
}

model Review {
  id        String   @id @default(uuid())
  schoolId  String
  studentId String
  school    School  @relation(fields: [schoolId], references: [id])
  rating    Int      # 1-5
  comment   String?
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  topic     NotificationTopic
  title     String
  body      String
  relatedEntityId String?
  createdAt DateTime @default(now())
  recipients NotificationRecipient[]
}

model NotificationRecipient {
  id             String   @id @default(uuid())
  notificationId String
  userId         String
  notification   Notification @relation(fields: [notificationId], references: [id])
  user           User @relation(fields: [userId], references: [id])
  read           Boolean @default(false)
}
```

---

## 6. API Endpoints

Base path: `/api/v1`. Every response uses envelope:
```json
{ "success": true, "data": { }, "meta": { "page": 1, "pageSize": 20, "total": 100 } }
```
Errors: `{ "success": false, "error": { "code": "STRING_CODE", "message": "..." } }`

### 6.1 Auth
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account (STUDENT default) |
| POST | `/auth/register/school-rep` | Public | Register + create pending School |
| POST | `/auth/verify-fayda` | Authenticated (self) | Submit Fayda ID for verification |
| POST | `/auth/login` | Public | Returns access + refresh token |
| POST | `/auth/refresh` | Public (valid refresh token) | Rotate tokens |
| POST | `/auth/logout` | Authenticated | Revoke refresh token |
| POST | `/auth/forgot-password` | Public | Send reset link |
| POST | `/auth/reset-password` | Public | Consume reset token |
| GET | `/auth/me` | Authenticated | Current user profile |

### 6.2 Users
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/users` | SUPER_ADMIN | List/search all users |
| GET | `/users/:id` | Self, ADMIN(same school), SUPER_ADMIN | User detail |
| PATCH | `/users/:id` | Self, SUPER_ADMIN | Update profile |
| PATCH | `/users/:id/status` | SUPER_ADMIN | Suspend/activate |
| POST | `/users/:id/assign-role` | SUPER_ADMIN (admins), ADMIN (education-head/mentor) | Assign/revoke roles |

### 6.3 Schools
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/schools` | Public | Browse/search/filter schools |
| GET | `/schools/:id` | Public | School public profile |
| POST | `/schools` | SUPER_ADMIN | Create school |
| PATCH | `/schools/:id` | ADMIN(own), SUPER_ADMIN | Edit profile |
| PATCH | `/schools/:id/status` | SUPER_ADMIN | Approve/suspend |
| GET | `/schools/:id/stats` | ADMIN(own), SUPER_ADMIN | Students count, graduation rate, rating |
| GET | `/schools/:id/branches` | Public | List branches |
| POST | `/schools/:id/branches` | ADMIN(own) | Add branch |
| PATCH | `/branches/:id` | ADMIN(own) | Edit branch |
| DELETE | `/branches/:id` | ADMIN(own) | Remove branch |

### 6.4 Inter-school Agreements
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/agreements` | ADMIN(own school) | List own agreements |
| POST | `/agreements` | ADMIN | Propose agreement to another school |
| PATCH | `/agreements/:id/accept` | ADMIN(target school) | Accept |
| PATCH | `/agreements/:id/terminate` | ADMIN(either side) | Terminate |
| POST | `/practice-requests` | STUDENT | Request practice at partner school |
| GET | `/practice-requests` | STUDENT(own), ADMIN(host/home school) | List |
| PATCH | `/practice-requests/:id/approve` | ADMIN(host school) | Approve + trigger fee payment |
| PATCH | `/practice-requests/:id/reject` | ADMIN(host school) | Reject |

### 6.5 Courses & Pricing
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/courses` | Public | Browse courses (school + independent) |
| GET | `/courses/:id` | Public | Course detail with topics (locked if not enrolled) |
| POST | `/courses` | ADMIN(school), MENTOR, SUPER_ADMIN(independent) | Create course |
| PATCH | `/courses/:id` | Owner ADMIN/MENTOR, SUPER_ADMIN | Edit |
| DELETE | `/courses/:id` | Owner ADMIN, SUPER_ADMIN | Remove |
| GET | `/courses/:id/price-recommendation` | ADMIN | Suggested price based on market data |
| POST | `/courses/:id/topics` | MENTOR/ADMIN | Add topic |
| PATCH | `/topics/:id` | MENTOR/ADMIN | Edit topic |
| DELETE | `/topics/:id` | MENTOR/ADMIN | Remove topic |
| POST | `/topics/:id/quiz` | MENTOR | Create/replace topic quiz |
| POST | `/courses/:id/final-exam` | MENTOR | Configure final exam |
| POST | `/courses/:id/final-exam/submit` | STUDENT | Submit final exam attempt |

### 6.6 Classrooms
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/classrooms` | MENTOR(own), STUDENT(own), ADMIN/EDUCATION_HEAD(school) | List |
| POST | `/classrooms` | ADMIN, EDUCATION_HEAD | Create |
| GET | `/classrooms/:id` | Members + school staff | Detail incl. tabs summary |
| PATCH | `/classrooms/:id` | ADMIN, EDUCATION_HEAD | Edit |
| POST | `/classrooms/:id/mentors` | EDUCATION_HEAD | Assign mentor |
| DELETE | `/classrooms/:id/mentors/:mentorId` | EDUCATION_HEAD | Remove mentor |
| POST | `/classrooms/:id/courses` | MENTOR, EDUCATION_HEAD | Attach course + order/mandatory flag |
| GET | `/classrooms/:id/students` | MENTOR, ADMIN | Roster |
| POST | `/classrooms/:id/announcements` | MENTOR, ADMIN, EDUCATION_HEAD | Post announcement |
| GET | `/classrooms/:id/whats-new` | Members | Aggregated feed |
| GET | `/classrooms/:id/resources` | Members | All resources |
| POST | `/classrooms/:id/resources` | MENTOR | Upload resource |

### 6.7 Schedules (priority-aware)
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/schedules?scope=SCHOOL\|CLASSROOM&refId=` | Members | Get schedule |
| POST | `/schedules` | ADMIN/EDUCATION_HEAD(school-scope), MENTOR(classroom-scope) | Create event — service checks role rank |
| PATCH | `/schedules/:id` | Creator role or higher | 403 `SCHEDULE_LOCKED` if requester rank < creator rank |
| DELETE | `/schedules/:id` | Creator role or higher | same rule |

### 6.8 Tasks & Submissions
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/classrooms/:id/tasks` | Members | List tasks |
| POST | `/classrooms/:id/tasks` | MENTOR | Create task/assignment/quiz/exam |
| PATCH | `/tasks/:id` | MENTOR(owner) | Edit |
| DELETE | `/tasks/:id` | MENTOR(owner) | Remove |
| POST | `/tasks/:id/submissions` | STUDENT | Submit |
| GET | `/tasks/:id/submissions` | MENTOR(owner) | List all submissions |
| GET | `/students/:id/submissions` | Self, MENTOR, ADMIN | Submission history |
| PATCH | `/submissions/:id/grade` | MENTOR | Grade + feedback |

### 6.9 Course Results / Progress
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/students/:id/progress` | Self, MENTOR, ADMIN | Per-course/topic progress |
| POST | `/course-results/:courseId/publish` | MENTOR | Publish pass/fail/retake for classroom |
| GET | `/students/:id/performance-report` | Self, ADMIN, Public(if shared) | Final performance measure |

### 6.10 Attendance
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/classrooms/:id/attendance-sessions` | MENTOR | Open session for a date |
| POST | `/attendance-sessions/:id/records` | MENTOR | Bulk mark attendance |
| GET | `/classrooms/:id/attendance` | MENTOR, ADMIN, STUDENT(own) | History |

### 6.11 Student Reports (issues)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/classrooms/:id/reports` | MENTOR | Report a student |
| GET | `/classrooms/:id/reports` | MENTOR, ADMIN, EDUCATION_HEAD | List |

### 6.12 Enrollment Applications
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/schools/:id/application-form` | Public | Get dynamic form schema |
| PUT | `/schools/:id/application-form` | ADMIN | Define required fields |
| POST | `/schools/:id/applications` | STUDENT | Submit application (online/in-person) |
| GET | `/students/:id/applications` | Self | My applications |
| GET | `/schools/:id/applications` | ADMIN | Inbox, filter by status |
| PATCH | `/applications/:id/accept` | ADMIN | Accept → auto-create Enrollment/assign classroom |
| PATCH | `/applications/:id/reject` | ADMIN | Reject |

### 6.13 Staff Applications
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/schools/:id/staff-posts` | ADMIN | Post opening (mentor/education-head) |
| GET | `/staff-posts` | Public/Authenticated | Browse openings |
| POST | `/staff-posts/:id/apply` | Authenticated user | Apply |
| GET | `/schools/:id/staff-applications` | ADMIN | Review inbox |
| PATCH | `/staff-applications/:id/accept` | ADMIN | Accept → role assignment |
| PATCH | `/staff-applications/:id/reject` | ADMIN | Reject |

### 6.14 Payments
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/payments/initiate` | STUDENT | Start Chapa checkout (enrollment/course/practice-fee) |
| POST | `/payments/webhook` | Chapa (signed) | Confirm transaction, update status |
| GET | `/payments/:id` | Owner, ADMIN, SUPER_ADMIN | Detail |
| GET | `/users/:id/payments` | Self, SUPER_ADMIN | History |
| GET | `/schools/:id/revenue` | ADMIN(own), SUPER_ADMIN | Revenue + commission report |
| GET | `/admin/commission-overview` | SUPER_ADMIN | Platform-wide payments |

### 6.15 Notifications
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/notifications` | Authenticated | My notifications (paginated, unread filter) |
| PATCH | `/notifications/:id/read` | Authenticated | Mark read |
| PATCH | `/notifications/read-all` | Authenticated | Mark all read |

### 6.16 Reviews / Ratings
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/schools/:id/reviews` | STUDENT(enrolled/graduated) | Leave rating/comment |
| GET | `/schools/:id/reviews` | Public | List reviews |

### 6.17 Uploads
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/uploads` | Authenticated | Get signed upload URL / direct upload, returns asset reference |

### 6.18 Reports & Analytics
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/admin/dashboard` | SUPER_ADMIN | Platform metrics |
| GET | `/schools/:id/dashboard` | ADMIN(own) | School metrics |
| GET | `/education-head/:id/dashboard` | EDUCATION_HEAD | Classrooms overview |
| GET | `/mentor/:id/dashboard` | MENTOR | Grading queue, schedule |

---

## 7. Middleware Chain Example

```ts
router.post(
  "/classrooms/:id/tasks",
  authenticate,
  authorize(["MENTOR"]),
  scopeToSchool,
  validate(createTaskSchema),
  tasksController.create
);
```

`errorHandler` is the last middleware in `app.ts`; every thrown `AppError(code, message, httpStatus)` from any layer is caught there and mapped to the standard error envelope — no raw stack traces leak in production.

---

## 8. Security Checklist

- `helmet` for security headers (CSP, HSTS, X-Frame-Options, etc.)
- `express-rate-limit` on auth and payment-webhook routes
- All input validated with Zod at the edge (`validate` middleware) — never trust `req.body` past this point
- Passwords hashed with bcrypt/argon2, never logged
- JWT secrets rotated via `tokenVersion` invalidation on password change
- File uploads: type/size whitelist, virus-scan hook point, served from separate storage domain (never same-origin execution)
- Prisma parameterized queries only — no raw SQL string concatenation
- RBAC + `scopeToSchool` enforced on every resource that has a `schoolId`
- Chapa webhook signature verification before trusting payment status updates
- Audit log table (or `Notification`/`StudentReport`-style append-only tables) for Fayda verification and role changes

---

## 9. Business Logic Highlights

- **Price recommendation** (`helpers/priceRecommendation.ts`): aggregates `Course.price` across schools for comparable course titles/categories, returns a suggested range (e.g. percentile-based) to the ADMIN when creating/editing a course.
- **Commission**: `Payment.commission` computed at `payments.service.ts` initiation time based on `PaymentType` (enrollment %, course sale %, practice-fee %), stored alongside `amount` for reporting.
- **Schedule priority rule**: `schedules.service.ts` maps `Role` to a numeric rank; update/delete compares `req.user`'s rank to `ScheduleEvent.createdByRole`'s rank and rejects if lower.
- **Notification fan-out**: `notificationDispatcher.ts` resolves the recipient set per `NotificationTopic` (e.g. `SCHOOL_ANNOUNCEMENT` → all students+staff of that school; `TASK` → classroom roster) and bulk-inserts `NotificationRecipient` rows.

# Driving School Platform — Frontend Design Document

Repo: `driving-platform-frontend`
Stack: React 18 + TypeScript, Vite, Tailwind CSS, react-router-dom, React Context

---

## 1. Guiding Principles

- The UI never knows where data comes from. Every screen talks to a **service interface**, never to `fetch`/`axios` directly.
- Swapping mock data for the real API means replacing the `services/` implementations and the `context` data-fetching calls only — **zero UI changes**.
- All design tokens (color, spacing, radius, font, shadow) are CSS variables. No hard-coded hex codes or pixel values in components.
- Each component owns its own CSS Module — styles never leak.
- Screens are organized by **role**, but many share the same underlying components (tables, cards, calendars, forms).

---

## 2. Repository Structure

```
driving-platform-frontend/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   ├── ProtectedRoute.tsx          # role/permission gate
│   │   └── routes.config.ts            # path constants + role map
│   │
│   ├── theme/
│   │   ├── tokens.css                  # all CSS variables (colors, spacing, typography)
│   │   ├── globals.css
│   │   └── tailwind.config.ts          # maps Tailwind theme to CSS vars
│   │
│   ├── types/                          # shared TS types/interfaces (mirrors backend data shapes)
│   │   ├── user.types.ts
│   │   ├── school.types.ts
│   │   ├── classroom.types.ts
│   │   ├── course.types.ts
│   │   ├── task.types.ts
│   │   ├── quiz.types.ts
│   │   ├── enrollment.types.ts
│   │   ├── payment.types.ts
│   │   ├── notification.types.ts
│   │   └── common.types.ts             # Pagination, ApiResponse<T>, Role enum, etc.
│   │
│   ├── services/                       # THE ONLY layer allowed to fetch data
│   │   ├── api/
│   │   │   ├── httpClient.ts           # axios/fetch wrapper, interceptors, auth header
│   │   │   └── endpoints.ts            # path constants matching backend routes
│   │   ├── interfaces/                 # service contracts (what the UI depends on)
│   │   │   ├── IAuthService.ts
│   │   │   ├── ISchoolService.ts
│   │   │   ├── IClassroomService.ts
│   │   │   ├── ICourseService.ts
│   │   │   ├── ITaskService.ts
│   │   │   ├── IQuizService.ts
│   │   │   ├── IEnrollmentService.ts
│   │   │   ├── IUserService.ts
│   │   │   ├── IPaymentService.ts
│   │   │   ├── INotificationService.ts
│   │   │   └── IAttendanceService.ts
│   │   ├── mock/                       # mock implementations (in-memory / localStorage-free, JS objects)
│   │   │   ├── mockAuthService.ts
│   │   │   ├── mockSchoolService.ts
│   │   │   ├── mockClassroomService.ts
│   │   │   ├── ...
│   │   │   └── mockData/               # seed data: schools.json, users.json, courses.json...
│   │   ├── remote/                     # real implementations, hit httpClient
│   │   │   ├── authService.ts
│   │   │   ├── schoolService.ts
│   │   │   ├── classroomService.ts
│   │   │   ├── ...
│   │   └── index.ts                    # exports the ACTIVE implementation set (env-flag driven)
│   │
│   ├── context/                        # global + domain state, one folder per domain
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── AuthProvider.tsx
│   │   │   └── useAuth.ts
│   │   ├── school/
│   │   │   ├── SchoolContext.tsx
│   │   │   ├── SchoolProvider.tsx
│   │   │   └── useSchool.ts
│   │   ├── classroom/
│   │   ├── notification/
│   │   │   ├── NotificationContext.tsx  # holds unread notifications, polling/socket hook
│   │   │   └── useNotifications.ts
│   │   ├── ui/
│   │   │   ├── UIContext.tsx            # toasts, modals, global loading, theme
│   │   │   └── useUI.ts
│   │   └── AppProviders.tsx             # composes all providers
│   │
│   ├── hooks/                           # reusable, non-context hooks
│   │   ├── useFetch.ts
│   │   ├── usePagination.ts
│   │   ├── useForm.ts
│   │   ├── useDebounce.ts
│   │   └── usePermission.ts
│   │
│   ├── components/                      # shared/dumb UI components, one folder each
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── Button.module.css
│   │   ├── Card/
│   │   ├── Table/
│   │   ├── Modal/
│   │   ├── Form/ (Input, Select, DatePicker, FileUpload, FormField)
│   │   ├── Calendar/
│   │   ├── Badge/
│   │   ├── Rating/
│   │   ├── Avatar/
│   │   ├── Tabs/
│   │   ├── Stepper/                     # for TOPIC -> COURSE progress
│   │   ├── NotificationBell/
│   │   ├── EmptyState/
│   │   ├── Skeletons/
│   │   └── Layout/
│   │       ├── AppShell.tsx             # sidebar + topbar wrapper per role
│   │       ├── Sidebar.tsx
│   │       ├── Topbar.tsx
│   │       └── PublicLayout.tsx
│   │
│   ├── features/                        # screen-level, role-organized "smart" components
│   │   ├── public/
│   │   ├── auth/
│   │   ├── student/
│   │   ├── mentor/
│   │   ├── educationHead/
│   │   ├── admin/
│   │   ├── superAdmin/
│   │   └── shared/                      # e.g. classroom detail used by mentor+student
│   │
│   ├── pages/                           # thin route-level components, compose features/
│   │   └── (mirrors the screens list in section 4, one file per screen)
│   │
│   ├── utils/
│   │   ├── validators.ts                # Zod schemas mirrored from backend
│   │   ├── formatters.ts                # dates, currency (ETB)
│   │   ├── permissions.ts               # role hierarchy constants
│   │   └── constants.ts
│   │
│   └── assets/
│
├── .env.example                         # VITE_USE_MOCK=true|false, VITE_API_BASE_URL
├── index.html
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 3. Routing Map

Routes are declared once in `routes.config.ts` with an associated `allowedRoles` array. `ProtectedRoute` reads the current user's role from `AuthContext` and redirects to `/403` or `/login` as needed.

| Path prefix | Layout | Access |
|---|---|---|
| `/` , `/schools`, `/courses`, `/mentors` (browse) | PublicLayout | Everyone (guest included) |
| `/auth/*` | PublicLayout | Guest only |
| `/app/student/*` | AppShell (student nav) | STUDENT |
| `/app/mentor/*` | AppShell (mentor nav) | MENTOR |
| `/app/education-head/*` | AppShell | EDUCATION_HEAD |
| `/app/admin/*` | AppShell | ADMIN |
| `/app/super-admin/*` | AppShell | SUPER_ADMIN |

---

## 4. Full Screen List

### 4.1 Public / Guest (no login required)
1. **Landing Page** — value proposition, search bar for schools/courses
2. **Browse Schools** — filter/sort by location, rating, price, courses offered
3. **School Profile (public)** — locations, branches, courses, prices, rating/reviews, "Apply" CTA
4. **Browse Independent Courses** (our own paid/free prep courses)
5. **Independent Course Detail** — syllabus, price, preview
6. **Browse Mentors** (public profile search, if exposed)
7. **Driver Lookup / Public Directory** (optional feature from the notes — search graduated drivers)
8. **About / How it works**
9. **Pricing / Commission info (for schools)**

### 4.2 Auth
10. **Register** (role: prospective student or school representative)
11. **Fayda (National ID) Verification** — step in signup, age verification
12. **Login**
13. **Forgot / Reset Password**
14. **OTP / ID Verification Pending screen**
15. **Onboarding / Role Selection** (student vs. school-registration path)

### 4.3 Student
16. **Student Dashboard** — enrolled school/classroom summary, upcoming tasks, notifications, progress
17. **School Discovery & Application** — apply online, upload documents, choose in-person/online
18. **My Applications** — status tracker (pending/accepted/rejected)
19. **My Classroom** — hub screen (tabs: What's New / Courses / Resources / Tasks / Attendance / Schedule)
20. **Classroom → What's New Feed**
21. **Classroom → Course List & Progress** (per-course completion %, TOPIC checklist)
22. **Course Detail / Topic Player** — video, explanation, resources, quiz per topic
23. **Course Final Exam screen**
24. **Classroom → All Resources**
25. **Classroom → Tasks List**
26. **Task Detail & Submission** (with past submissions/feedback history)
27. **Classroom → Schedule / Calendar**
28. **Classroom → Attendance History**
29. **Daily/Periodic Practice Quizzes** (standalone, prep)
30. **Practice-Elsewhere Request** (inter-school resource-sharing request + fee payment)
31. **My Results / Performance Report** (per-course, final performance measure)
32. **My Profile** (with public performance badge/certificate)
33. **Payments / Billing History**
34. **Notifications Center**
35. **Comments/Feedback on course** (leave review)

### 4.4 Mentor
36. **Mentor Dashboard** — assigned classrooms, pending grading, today's schedule
37. **Classroom Management (list of my classrooms)**
38. **Classroom Detail (mentor view)** — same tabs as student but editable
39. **Create/Edit Announcement**
40. **Create/Edit Course** (define TOPICs, order, mandatory flag)
41. **Create/Edit Topic** (video upload, explanation, resources, quiz builder)
42. **Quiz/Test Builder**
43. **Create/Edit Task/Assignment** (deadline, attachments, rubric)
44. **Grade Submissions / Give Feedback**
45. **Publish Course Results** (pass/fail/retake per student)
46. **Classroom Calendar Management**
47. **Attendance Tracking (mark attendance)**
48. **Report a Student (issue flag)**
49. **Resource Library Management** (upload/organize PDFs, PPTs, videos)
50. **Mentor Profile**

### 4.5 Education Head
51. **Education Head Dashboard**
52. **Mentor Management** (assign/remove mentors to classrooms)
53. **Global Education Schedule Builder** (school-wide calendar, higher priority than classroom schedule)
54. **Classrooms Overview** (all classrooms, mentors, student counts)
55. **Course Catalog Oversight** (approve/monitor courses across classrooms)

### 4.6 Admin (per school)
56. **Admin Dashboard** — school KPIs: student count, graduation rate, rating, revenue
57. **School Profile Editor** (locations, branches, description, media)
58. **Branch Management**
59. **Course & Pricing Management** — set prices, see system price recommendation
60. **Enrollment Applications Inbox** — review/accept/reject, view submitted forms
61. **Application Form Builder** (define required fields for enrollment)
62. **Staff Role Applications Inbox** (hiring mentors/education heads)
63. **Post Staff Job Opening**
64. **Official School Announcements / Notices**
65. **School Schedule Management** (top-level, overrides education-head/mentor where allowed)
66. **Assign Education Heads**
67. **Inter-School Agreements** — propose/accept resource-sharing agreements with other schools
68. **Practice-Elsewhere Requests (incoming)** — approve requests from partner-school students
69. **Students Directory** (per school)
70. **Classrooms Directory** (per school, create new classroom)
71. **School Reviews / Ratings view**
72. **Revenue & Commission Report**
73. **School Settings**

### 4.7 Super Admin
74. **Super Admin Dashboard** — platform-wide metrics (all schools, students, revenue)
75. **Schools Management** — approve new schools, suspend/activate
76. **Admin Management** — assign/revoke ADMIN role per school
77. **Platform-wide Announcements**
78. **Independent Course Management** (our own courses catalog, pricing)
79. **Payments & Commission Overview** (Chapa transactions, payouts)
80. **Global Reports/Analytics**
81. **User Management (all roles, search, suspend, verify)**
82. **Fayda Verification Audit Log**
83. **System Settings / Feature Flags**

### 4.8 Shared / Cross-cutting
84. **404 Not Found**
85. **403 Forbidden**
86. **Notifications Center** (shared shell, filtered by audience)
87. **Global Search Results** (schools, mentors, courses, classrooms, tasks — scoped by role)
88. **Generic File/Media Viewer**

---

## 5. State Management Strategy

React Context + `useReducer` per domain, **no external state library** (kept light per the stack). Pattern used consistently:

```
context/<domain>/
  <Domain>Context.tsx    // createContext<DomainState & DomainActions>(null)
  <Domain>Provider.tsx    // useReducer + calls into services/, exposes actions
  use<Domain>.ts          // custom hook: throws if used outside provider
```

### 5.1 Context list & responsibility

| Context | Holds | Talks to service |
|---|---|---|
| `AuthContext` | current user, role, token, verification status | `IAuthService` |
| `SchoolContext` | active school being viewed/managed, branches, courses, pricing | `ISchoolService` |
| `ClassroomContext` | active classroom, its courses/topics/tasks/schedule/announcements | `IClassroomService`, `ICourseService`, `ITaskService` |
| `EnrollmentContext` | applications (student's own, or school's inbox) | `IEnrollmentService` |
| `NotificationContext` | unread list, polling interval / future websocket hook | `INotificationService` |
| `PaymentContext` | transaction history, pending payment state | `IPaymentService` |
| `UIContext` | toasts, global modals, page loading, theme (light only for MVP) | — |

### 5.2 Provider composition

`AppProviders.tsx` wraps `App` in nested order: `UIProvider > AuthProvider > NotificationProvider > (feature providers mounted lazily per route)`. Domain-scoped providers like `SchoolContext`/`ClassroomContext` are mounted **inside the relevant route subtree only** (e.g. wrapping `/app/*/school/:id/*`), not globally — this avoids stale/irrelevant state and keeps memory light.

### 5.3 Data flow rule

Components never call services directly. Flow is always:
`Page component → feature component → context action → service interface → (mock or remote impl)`

This is the seam that lets the whole mock layer be swapped for the real API with a one-line change in `services/index.ts`:

```ts
// services/index.ts
const useMock = import.meta.env.VITE_USE_MOCK === "true";
export const authService: IAuthService = useMock ? mockAuthService : authServiceRemote;
export const schoolService: ISchoolService = useMock ? mockSchoolService : schoolServiceRemote;
// ...etc
```

---

## 6. Service Layer

Every service is defined as a TypeScript interface first, so mock and remote implementations are interchangeable and type-checked against the same contract.

```ts
// services/interfaces/IClassroomService.ts
export interface IClassroomService {
  getById(id: string): Promise<Classroom>;
  listForMentor(mentorId: string): Promise<Classroom[]>;
  listForStudent(studentId: string): Promise<Classroom[]>;
  createAnnouncement(classroomId: string, data: AnnouncementInput): Promise<Announcement>;
  getSchedule(classroomId: string): Promise<ScheduleEvent[]>;
  markAttendance(classroomId: string, sessionId: string, records: AttendanceRecord[]): Promise<void>;
  reportStudent(classroomId: string, studentId: string, note: string): Promise<void>;
}
```

```ts
// services/remote/classroomService.ts
export const classroomServiceRemote: IClassroomService = {
  getById: (id) => httpClient.get(`/classrooms/${id}`),
  listForMentor: (mentorId) => httpClient.get(`/classrooms?mentorId=${mentorId}`),
  // ...
};
```

```ts
// services/mock/mockClassroomService.ts
export const mockClassroomService: IClassroomService = {
  getById: async (id) => delay(mockClassrooms.find(c => c.id === id)),
  // ...
};
```

`httpClient.ts` centralizes: base URL, JWT bearer header injection (from `AuthContext`/localStorage token), request/response interceptors, 401 → auto-logout, typed error normalization to a common `ApiError` shape.

---

## 7. Styling System

- `theme/tokens.css` defines all CSS custom properties: `--color-primary`, `--color-bg`, `--color-surface`, `--color-danger`, `--font-sans`, `--radius-md`, `--space-1..8`, `--shadow-card`, etc.
- `tailwind.config.ts` maps Tailwind's theme keys to these CSS variables so both raw CSS Modules and Tailwind utility classes stay in sync and themeable (future dark mode / school-branding white-label is a stretch goal this unlocks).
- Every component folder: `ComponentName.tsx` + `ComponentName.module.css`. No global class names outside `theme/globals.css` (resets, base typography).
- No inline hex/px values permitted in components — enforced via lint rule (stylelint custom rule or PR checklist) referencing tokens only.

---

## 8. Cross-cutting Concerns

- **Permissions**: `usePermission(action, resourceContext)` hook centralizes the priority rule ("a schedule set by a higher role can't be overridden by a lower role") by comparing role rank constants from `utils/permissions.ts`.
- **Notifications**: `NotificationContext` polls `GET /notifications` (or upgrades to WebSocket later) and drives the `NotificationBell` badge + `Notifications Center` screen; subscriptions are topic-based (school, classroom, staff-post) matching backend notification topics.
- **Forms**: shared `useForm` hook + Zod schemas mirrored client-side for instant validation feedback, with the same schemas re-validated server-side.
- **File uploads**: `FileUpload` component posts directly to a signed-upload endpoint/service abstraction (`IUploadService`), decoupled from the record-creation call.

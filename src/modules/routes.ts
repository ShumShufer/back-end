import { Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import usersRoutes from "./users/users.routes.js";
import schoolsRoutes from "./schools/schools.routes.js";
import branchesRoutes, { schoolBranchRouter } from "./branches/branches.routes.js";
import classroomsRoutes from "./classrooms/classrooms.routes.js";
import enrollmentsRoutes, { schoolEnrollmentRouter } from "./enrollments/enrollments.routes.js";
import staffPostsRoutes, {
  staffApplicationActionsRouter,
  schoolStaffRouter,
} from "./staffApplications/staffApplications.routes.js";
import coursesRoutes from "./courses/courses.routes.js";
import tasksRoutes from "./tasks/tasks.routes.js";
import submissionsRoutes from "./submissions/submissions.routes.js";
import quizzesRoutes from "./quizzes/quizzes.routes.js";
import uploadsRoutes from "./uploads/uploads.routes.js";
import schedulesRoutes from "./schedules/schedules.routes.js";
import attendanceRoutes from "./attendance/attendance.routes.js";
import agreementsRoutes, { practiceRequestsRouter } from "./agreements/agreements.routes.js";
import paymentsRoutes from "./payments/payments.routes.js";
import notificationsRoutes from "./notifications/notifications.routes.js";
import { schoolReviewsRouter } from "./reviews/reviews.routes.js";
import { classroomReportsRouter } from "./reports/reports.routes.js";
import adminRoutes from "./admin/admin.routes.js";
import * as adminController from "./admin/admin.controller.js";
import * as paymentsController from "./payments/payments.controller.js";
import { authenticate } from "../shared/middlewares/authenticate.js";
import { authorize } from "../shared/middlewares/authorize.js";
import * as enrollmentsController from "./enrollments/enrollments.controller.js";
import * as coursesController from "./courses/courses.controller.js";
import { Role } from "../shared/types/auth.types.js";

const router = Router();

/**
 * Auth & Users
 */
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

/**
 * Schools — standalone school routes (list, get, create, update, status, stats)
 * Nested sub-routers are mounted separately on /schools/:id so that mergeParams
 * on each sub-router resolves the parent :id param correctly.
 */
router.use("/schools", schoolsRoutes);

// Branches nested under a school: GET/POST /schools/:id/branches
router.use("/schools/:id", schoolBranchRouter);

// Enrollment form template + applications inbox nested under a school
router.use("/schools/:id", schoolEnrollmentRouter);

// Staff posts + staff applications inbox nested under a school
router.use("/schools/:id", schoolStaffRouter);

/**
 * Branches — standalone operations on a branch by its own ID
 * GET /branches/:id, PATCH /branches/:id, DELETE /branches/:id
 */
router.use("/branches", branchesRoutes);

/**
 * Classrooms — role-aware listing, detail, create, update, mentor management
 */
router.use("/classrooms", classroomsRoutes);

/**
 * Courses — public catalog, topic management, price recommendation
 * GET /courses, GET /courses/:id, POST /courses
 * GET /courses/:id/topics, POST /courses/:id/topics
 * GET /courses/:id/price-recommendation
 */
router.use("/courses", coursesRoutes);

/**
 * Tasks — assignment/quiz/exam creation, listing, deadline enforcement
 * GET /tasks, POST /tasks, POST /tasks/:id/submissions
 */
router.use("/tasks", tasksRoutes);

/**
 * Submissions & Grading
 * GET /submissions, PATCH /submissions/:id/grade
 */
router.use("/submissions", submissionsRoutes);

/**
 * Quizzes — quiz builder & auto-evaluation
 * GET /quizzes, POST /quizzes, POST /quizzes/:id/submit
 */
router.use("/quizzes", quizzesRoutes);

/**
 * File Uploads
 * POST /uploads
 */
router.use("/uploads", uploadsRoutes);

/**
 * Schedules — priority-aware calendar events
 * GET /schedules, POST /schedules, PATCH /schedules/:id, DELETE /schedules/:id
 */
router.use("/schedules", schedulesRoutes);

/**
 * Attendance — sessions and bulk attendance recording
 * GET /attendance-sessions, POST /attendance-sessions, POST /attendance-sessions/:id/records
 */
router.use("/attendance-sessions", attendanceRoutes);

/**
 * Inter-School Agreements & Practice Elsewhere
 * GET /agreements, POST /agreements, PATCH /agreements/:id/status
 * GET /practice-requests, POST /practice-requests, PATCH /practice-requests/:id/status
 */
router.use("/agreements", agreementsRoutes);
router.use("/practice-requests", practiceRequestsRouter);

/**
 * Applications (student enrollments) — standalone actions by application ID
 * GET /applications/my, PATCH /applications/:id/accept|reject, POST /applications/:id/withdraw
 */
router.use("/applications", enrollmentsRoutes);

/**
 * Students — student-scoped endpoints
 * GET /students/:id/applications — view a student's applications (self, ADMIN, SUPER_ADMIN)
 * GET /students/:id/progress — view student learning and grading progress
 */
router.get(
  "/students/:id/applications",
  authenticate,
  authorize(Role.STUDENT, Role.ADMIN, Role.SUPER_ADMIN),
  enrollmentsController.getApplicationsByStudentId,
);

router.get(
  "/students/:id/progress",
  authenticate,
  coursesController.getStudentProgress,
);

/**
 * Staff posts — public browsing, applying, and individual post management
 * GET /staff-posts, GET /staff-posts/:id, PATCH /staff-posts/:id, POST /staff-posts/:id/apply
 */
router.use("/staff-posts", staffPostsRoutes);

/**
 * Staff applications — accept/reject actions on individual applications
 * PATCH /staff-applications/:id/accept|reject
 */
router.use("/staff-applications", staffApplicationActionsRouter);

/**
 * Payments — Chapa checkout, webhook, and revenue
 * POST /payments/initiate, GET /payments/verify/:txRef
 * POST /payments/webhook, GET /payments
 * GET /schools/:id/revenue
 */
router.use("/payments", paymentsRoutes);
router.get(
  "/schools/:id/revenue",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  paymentsController.getSchoolRevenue,
);

/**
 * Notifications — inbox, read status, manual broadcast
 * GET /notifications, PATCH /notifications/:id/read, POST /notifications
 */
router.use("/notifications", notificationsRoutes);

/**
 * Reviews — school star ratings (public GET, student POST)
 * GET /schools/:id/reviews, POST /schools/:id/reviews
 */
router.use("/schools/:id", schoolReviewsRouter);

/**
 * Student Reports — mentor behavioral reports per classroom
 * GET /classrooms/:id/reports, POST /classrooms/:id/reports
 */
router.use("/classrooms/:id", classroomReportsRouter);

/**
 * Dashboards — role-based analytics aggregations
 * GET /admin/dashboard  (SUPER_ADMIN)
 * GET /schools/:id/dashboard  (ADMIN, EDUCATION_HEAD, SUPER_ADMIN)
 * GET /mentor/:id/dashboard  (MENTOR, ADMIN, EDUCATION_HEAD, SUPER_ADMIN)
 * GET /education-head/:id/dashboard  (EDUCATION_HEAD, ADMIN, SUPER_ADMIN)
 */
router.use("/admin", adminRoutes);

router.get(
  "/schools/:id/dashboard",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  adminController.getSchoolDashboard,
);

router.get(
  "/mentor/:id/dashboard",
  authenticate,
  authorize(Role.MENTOR, Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  adminController.getMentorDashboard,
);

router.get(
  "/education-head/:id/dashboard",
  authenticate,
  authorize(Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  adminController.getEducationHeadDashboard,
);

export default router;

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";
import schoolsRoutes from "./schools.routes.js";
import branchesRoutes, { schoolBranchRouter } from "./branches.routes.js";
import classroomsRoutes from "./classrooms.routes.js";
import enrollmentsRoutes, { schoolEnrollmentRouter } from "./enrollments.routes.js";
import staffPostsRoutes, {
  staffApplicationActionsRouter,
  schoolStaffRouter,
} from "./staffApplications.routes.js";

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
 * Applications (student enrollments) — standalone actions by application ID
 * GET /applications/my, POST /applications/:id/accept|reject|withdraw
 */
router.use("/applications", enrollmentsRoutes);

/**
 * Staff posts — public browsing, applying, and individual post management
 * GET /staff-posts, GET /staff-posts/:id, PATCH /staff-posts/:id, POST /staff-posts/:id/apply
 */
router.use("/staff-posts", staffPostsRoutes);

/**
 * Staff applications — accept/reject actions on individual applications
 * POST /staff-applications/:id/accept|reject
 */
router.use("/staff-applications", staffApplicationActionsRouter);

export default router;

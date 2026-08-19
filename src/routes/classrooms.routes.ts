import { Router } from "express";
import * as classroomsController from "../controllers/classrooms.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { scopeToSchool } from "../middlewares/scopeToSchool.js";
import { validate } from "../middlewares/validate.js";
import {
  createClassroomSchema,
  updateClassroomSchema,
  assignMentorSchema,
} from "../validators/classroom.schema.js";
import { Role } from "../types/auth.types.js";

const router = Router();

/**
 * GET /classrooms
 * Role-aware listing: SUPER_ADMIN sees all, ADMIN/EDUCATION_HEAD see their school's,
 * MENTOR sees assigned classrooms, STUDENT sees enrolled classrooms.
 * Service applies the correct filter based on req.user.
 */
router.get("/", authenticate, classroomsController.getClassrooms);

// GET /classrooms/:id — full classroom detail; any authenticated user
router.get("/:id", authenticate, classroomsController.getClassroomById);

/**
 * POST /classrooms — create a new classroom
 * ADMIN or EDUCATION_HEAD only; scopeToSchool prevents cross-school creation.
 * Controller derives schoolId from req.user.schoolId for non-SUPER_ADMIN callers.
 */
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD),
  scopeToSchool,
  validate(createClassroomSchema),
  classroomsController.createClassroom,
);

// PATCH /classrooms/:id — rename a classroom; ADMIN or EDUCATION_HEAD, same-school only
router.patch(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD),
  scopeToSchool,
  validate(updateClassroomSchema),
  classroomsController.updateClassroom,
);

/**
 * POST /classrooms/:id/mentors — assign a mentor to a classroom
 * EDUCATION_HEAD manages mentor assignments; scopeToSchool prevents cross-school ops.
 */
router.post(
  "/:id/mentors",
  authenticate,
  authorize(Role.EDUCATION_HEAD, Role.ADMIN),
  scopeToSchool,
  validate(assignMentorSchema),
  classroomsController.assignMentor,
);

/**
 * DELETE /classrooms/:id/mentors/:mentorId — remove a mentor from a classroom
 * No body needed; mentorId comes from URL params.
 */
router.delete(
  "/:id/mentors/:mentorId",
  authenticate,
  authorize(Role.EDUCATION_HEAD, Role.ADMIN),
  scopeToSchool,
  classroomsController.removeMentor,
);

export default router;

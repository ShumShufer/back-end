import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createUserSchema,
  queryUsersSchema,
  updateUserSchema,
  setUserStatusSchema,
  assignUserRoleSchema,
} from "./users.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * GET /users — paginated directory (SUPER_ADMIN sees all, ADMIN sees own school)
 */
router.get(
  "/",
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  validate(queryUsersSchema, "query"),
  usersController.getUsers,
);

/**
 * POST /users — create a user (school scoping enforced in service)
 */
router.post(
  "/",
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  validate(createUserSchema),
  usersController.createUser,
);

/**
 * PATCH /users/:id — profile / access updates (self or admins)
 */
router.patch(
  "/:id",
  authenticate,
  validate(updateUserSchema),
  usersController.updateUser,
);

/**
 * PATCH /users/:id/status — verification status shortcut
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  validate(setUserStatusSchema),
  usersController.updateUserStatus,
);

/**
 * PATCH /users/:id/assign-role — role shortcut
 */
router.patch(
  "/:id/assign-role",
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(assignUserRoleSchema),
  usersController.assignUserRole,
);

export default router;

import type { Request, Response, NextFunction } from "express";
import * as classroomsService from "./classrooms.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type {
  CreateClassroomInput,
  UpdateClassroomInput,
  AssignMentorInput,
} from "./classroom.schema.js";

/**
 * Get classrooms (role-aware listing)
 * GET /classrooms
 */
export function getClassrooms(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const user = req.user!;
    const schoolId = req.query.schoolId as string | undefined;
    const filters = schoolId ? { schoolId } : {};
    const result = await classroomsService.getClassrooms(user, filters);
    res
      .status(200)
      .json(apiResponse(result, "Classrooms retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get single classroom detail by ID
 * GET /classrooms/:id
 */
export function getClassroomById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await classroomsService.getClassroomById(id as string);
    res
      .status(200)
      .json(
        apiResponse(result, "Classroom details retrieved successfully", 200),
      );
  })().catch(next);
}

/**
 * Create a new classroom (ADMIN, EDUCATION_HEAD)
 * POST /classrooms
 */
export function createClassroom(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const user = req.user!;
    const input = req.body as CreateClassroomInput;
    // Use schoolId from input body (SUPER_ADMIN) or from authenticated user's school
    const schoolId = input.schoolId ?? (user.schoolId as string);
    const result = await classroomsService.createClassroom(schoolId, input);
    res
      .status(201)
      .json(apiResponse(result, "Classroom created successfully", 201));
  })().catch(next);
}

/**
 * Update an existing classroom (ADMIN, EDUCATION_HEAD)
 * PATCH /classrooms/:id
 */
export function updateClassroom(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpdateClassroomInput;
    const result = await classroomsService.updateClassroom(
      id as string,
      input,
    );
    res
      .status(200)
      .json(apiResponse(result, "Classroom updated successfully", 200));
  })().catch(next);
}

/**
 * Assign a mentor to a classroom (EDUCATION_HEAD)
 * POST /classrooms/:id/mentors
 */
export function assignMentor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as AssignMentorInput;
    const result = await classroomsService.assignMentor(
      id as string,
      input.mentorId,
    );
    res
      .status(201)
      .json(apiResponse(result, "Mentor assigned to classroom successfully", 201));
  })().catch(next);
}

/**
 * Remove a mentor from a classroom (EDUCATION_HEAD)
 * DELETE /classrooms/:id/mentors/:mentorId
 */
export function removeMentor(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id, mentorId } = req.params;
    const result = await classroomsService.removeMentor(
      id as string,
      mentorId as string,
    );
    res
      .status(200)
      .json(apiResponse(result, "Mentor removed from classroom successfully", 200));
  })().catch(next);
}

/**
 * GET /classrooms/:id/students — students accepted into the classroom
 */
export async function getClassroomStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const students = await classroomsService.getClassroomStudents(id as string);
    res.json(apiResponse(students, "Classroom students retrieved"));
  } catch (err) {
    next(err);
  }
}

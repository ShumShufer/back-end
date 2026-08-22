import type { Request, Response, NextFunction } from "express";
import * as agreementsService from "./agreements.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateAgreementInput,
  UpdateAgreementStatusInput,
  CreatePracticeRequestInput,
  UpdatePracticeRequestStatusInput,
} from "./agreements.schema.js";

/**
 * GET /agreements
 */
export async function getSchoolAgreements(req: Request, res: Response, next: NextFunction) {
  try {
    const agreements = await agreementsService.getSchoolAgreements(req.user as AuthUser);
    res.json(agreements);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /agreements
 */
export async function createSchoolAgreement(req: Request, res: Response, next: NextFunction) {
  try {
    const agreement = await agreementsService.createSchoolAgreement(
      req.body as CreateAgreementInput,
      req.user as AuthUser,
    );
    res.status(201).json(agreement);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /agreements/:id/status
 */
export async function updateAgreementStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const agreement = await agreementsService.updateAgreementStatus(
      id as string,
      req.body as UpdateAgreementStatusInput,
      req.user as AuthUser,
    );
    res.json(agreement);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /practice-requests
 */
export async function getPracticeRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const requests = await agreementsService.getPracticeRequests(req.user as AuthUser);
    res.json(requests);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /practice-requests
 */
export async function createPracticeRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await agreementsService.createPracticeRequest(
      req.body as CreatePracticeRequestInput,
      req.user as AuthUser,
    );
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /practice-requests/:id/status
 */
export async function updatePracticeRequestStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const request = await agreementsService.updatePracticeRequestStatus(
      id as string,
      req.body as UpdatePracticeRequestStatusInput,
      req.user as AuthUser,
    );
    res.json(request);
  } catch (err) {
    next(err);
  }
}

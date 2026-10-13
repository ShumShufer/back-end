import type { Request, Response, NextFunction } from "express";
import * as agreementsService from "./agreements.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
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
    res.json(apiResponse(agreements, "School agreements retrieved successfully"));
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
    res.status(201).json(apiResponse(agreement, "School agreement proposed successfully", 201));
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
    res.json(apiResponse(agreement, "School agreement status updated successfully"));
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
    res.json(apiResponse(requests, "Practice requests retrieved successfully"));
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
    res.status(201).json(apiResponse(request, "Practice request created successfully", 201));
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
    res.json(apiResponse(request, "Practice request status updated successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /agreements/:id/accept
 */
export async function acceptAgreement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const agreement = await agreementsService.updateAgreementStatus(
      id as string,
      { status: "ACTIVE" },
      req.user as AuthUser,
    );
    res.json(apiResponse(agreement, "Agreement accepted successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /agreements/:id/terminate
 */
export async function terminateAgreement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const agreement = await agreementsService.updateAgreementStatus(
      id as string,
      { status: "TERMINATED" },
      req.user as AuthUser,
    );
    res.json(apiResponse(agreement, "Agreement terminated successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /practice-requests/:id/approve
 */
export async function approvePracticeRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const request = await agreementsService.updatePracticeRequestStatus(
      id as string,
      { status: "APPROVED" },
      req.user as AuthUser,
    );
    res.json(apiResponse(request, "Practice request approved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /practice-requests/:id/reject
 */
export async function rejectPracticeRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const request = await agreementsService.updatePracticeRequestStatus(
      id as string,
      { status: "REJECTED" },
      req.user as AuthUser,
    );
    res.json(apiResponse(request, "Practice request rejected successfully"));
  } catch (err) {
    next(err);
  }
}

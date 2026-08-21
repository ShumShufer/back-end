import { z } from "zod";

export const createAgreementSchema = z.object({
  partnerSchoolId: z.string().uuid(),
  feeSplit: z.object({
    homeSchoolPercent: z.number().min(0).max(100),
    hostSchoolPercent: z.number().min(0).max(100),
  }).refine((data) => data.homeSchoolPercent + data.hostSchoolPercent === 100, {
    message: "Total fee split percentages must equal 100%",
  }),
});

export const updateAgreementStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const createPracticeRequestSchema = z.object({
  homeSchoolId: z.string().uuid(),
  hostSchoolId: z.string().uuid(),
  fee: z.number().min(0),
});

export const updatePracticeRequestStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementStatusInput = z.infer<typeof updateAgreementStatusSchema>;
export type CreatePracticeRequestInput = z.infer<typeof createPracticeRequestSchema>;
export type UpdatePracticeRequestStatusInput = z.infer<typeof updatePracticeRequestStatusSchema>;

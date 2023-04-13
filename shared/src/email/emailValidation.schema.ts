import { z } from "zod";
import {
  emailValidationReason,
  EmailValidationStatus,
} from "./emailValidation";
import { WithEmailInput } from "./emailValidation.dto";

export const emailValidationInputSchema: z.Schema<WithEmailInput> = z.object({
  email: z.string(),
});

export const emailValidationResponseSchema: z.Schema<EmailValidationStatus> =
  z.object({
    isValid: z.boolean(),
    proposal: z.string().nullable(),
    isFree: z.boolean(),
    reason: z.enum(emailValidationReason),
  });

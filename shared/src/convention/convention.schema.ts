import { z } from "zod";
import { agencyIdSchema } from "../agency/agency.schema";

import { peConnectPrefixSchema } from "../federatedIdentities/federatedIdentity.schema";
import { appellationDtoSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { scheduleSchema } from "../schedule/Schedule.schema";
import { siretSchema } from "../siret/siret";
import { allRoles } from "../tokens/MagicLinkPayload";
import { phoneRegExp, stringOfNumbers } from "../utils";
import { dateRegExp } from "../utils/date";
import { addressWithPostalCodeSchema } from "../utils/postalCode";
import {
  zBoolean,
  zEmail,
  zString,
  zStringPossiblyEmpty,
  zTrimmedString,
} from "../zodUtils";
import { getConventionFieldName } from "./convention";
import {
  allConventionStatuses,
  Beneficiary,
  BeneficiaryCurrentEmployer,
  BeneficiaryRepresentative,
  ConventionDto,
  ConventionDtoWithoutExternalId,
  ConventionExternalId,
  ConventionId,
  conventionObjectiveOptions,
  ConventionReadDto,
  EstablishmentRepresentative,
  EstablishmentTutor,
  GenerateMagicLinkRequestDto,
  GenerateMagicLinkResponseDto,
  ListConventionsRequestDto,
  RenewMagicLinkRequestDto,
  Signatories,
  UpdateConventionRequestDto,
  UpdateConventionStatusRequestDto,
  WithConventionId,
} from "./convention.dto";
import {
  getConventionTooLongMessageAndPath,
  isTutorEmailDifferentThanBeneficiaryRelatedEmails,
  mustBeSignedByEveryone,
  startDateIsBeforeEndDate,
  underMaxCalendarDuration,
} from "./conventionRefinements";

export const conventionIdSchema: z.ZodSchema<ConventionId> = zTrimmedString;
export const externalConventionIdSchema: z.ZodSchema<ConventionExternalId> =
  zTrimmedString;

const roleSchema = z.enum(allRoles);
const phoneSchema = zString.regex(phoneRegExp, "Numéro de téléphone incorrect");

const signatorySchema = z.object({
  role: roleSchema,
  email: zEmail,
  phone: phoneSchema,
  firstName: zTrimmedString,
  lastName: zTrimmedString,
  signedAt: zString.regex(dateRegExp).optional(),
});

const beneficiarySchema: z.Schema<Beneficiary> = signatorySchema.merge(
  z.object({
    role: z.enum(["beneficiary"]),
    emergencyContact: zStringPossiblyEmpty,
    emergencyContactPhone: phoneSchema.optional().or(z.literal("")),
    federatedIdentity: peConnectPrefixSchema.optional(),
  }),
);

const establishmentTutorSchema: z.Schema<EstablishmentTutor> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["establishment-tutor", "establishment"]),
      job: zStringPossiblyEmpty,
    }),
  );

const establishmentRepresentativeSchema: z.Schema<EstablishmentRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["establishment-representative", "establishment"]),
      job: zStringPossiblyEmpty,
    }),
  );

const beneficiaryRepresentativeSchema: z.Schema<BeneficiaryRepresentative> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["legal-representative", "beneficiary-representative"]),
      job: zStringPossiblyEmpty,
    }),
  );

const beneficiaryCurrentEmployerSchema: z.Schema<BeneficiaryCurrentEmployer> =
  signatorySchema.merge(
    z.object({
      role: z.enum(["beneficiary-current-employer"]),
      job: zStringPossiblyEmpty,
      businessSiret: siretSchema,
      businessName: zTrimmedString,
    }),
  );

const conventionWithoutExternalIdZObject = z.object({
  id: conventionIdSchema,
  externalId: externalConventionIdSchema.optional(),
  status: z.enum(allConventionStatuses),
  rejectionJustification: z.string().optional(),
  postalCode: z
    .string()
    .regex(stringOfNumbers)
    .length(5, "5 chiffres sont nécessaires pour le code postal")
    .optional(),
  agencyId: agencyIdSchema,
  dateSubmission: zString.regex(dateRegExp, "La date de saisie est invalide."),
  dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
  dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),
  dateValidation: zString
    .regex(dateRegExp, "La date de validation invalide.")
    .optional(),
  siret: siretSchema,
  businessName: zTrimmedString,
  schedule: scheduleSchema,
  workConditions: z.string().optional(),
  individualProtection: zBoolean,
  sanitaryPrevention: zBoolean,
  sanitaryPreventionDescription: zStringPossiblyEmpty,
  immersionAddress: addressWithPostalCodeSchema,
  immersionObjective: z.enum(conventionObjectiveOptions),
  immersionAppellation: appellationDtoSchema,
  immersionActivities: zTrimmedString,
  immersionSkills: zStringPossiblyEmpty,
  internshipKind: z.enum(["immersion", "mini-stage-cci"]),
  signatories: z.object({
    beneficiary: beneficiarySchema,
    establishmentRepresentative: establishmentRepresentativeSchema,
    beneficiaryRepresentative: beneficiaryRepresentativeSchema.optional(),
    beneficiaryCurrentEmployer: beneficiaryCurrentEmployerSchema.optional(),
  }),
  establishmentTutor: establishmentTutorSchema,
});

export const conventionWithoutExternalIdSchema: z.Schema<ConventionDtoWithoutExternalId> =
  conventionWithoutExternalIdZObject
    .refine(startDateIsBeforeEndDate, {
      message: "La date de fin doit être après la date de début.",
      path: [getConventionFieldName("dateEnd")],
    })
    .refine(underMaxCalendarDuration, getConventionTooLongMessageAndPath)
    .superRefine((convention, issueMaker) => {
      const addIssue = (message: string, path: string) => {
        issueMaker.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: [path],
        });
      };

      const signatoriesWithEmail = Object.entries(convention.signatories)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => ({
          key: key as keyof Signatories,
          email: value.email,
        }));
      signatoriesWithEmail.forEach((signatory) => {
        if (
          signatoriesWithEmail
            .filter((otherSignatory) => otherSignatory.key !== signatory.key)
            .some((otherSignatory) => otherSignatory.email === signatory.email)
        )
          addIssue(
            "Les emails des signataires doivent être différents.",
            getConventionFieldName(`signatories.${signatory.key}.email`),
          );
      });

      if (
        !isTutorEmailDifferentThanBeneficiaryRelatedEmails(
          convention.signatories,
          convention.establishmentTutor,
        )
      )
        addIssue(
          "Le mail du tuteur doit être différent des mails du bénéficiaire, de son représentant légal et de son employeur actuel.",
          getConventionFieldName("establishmentTutor.email"),
        );
    })
    .refine(mustBeSignedByEveryone, {
      message: "La confirmation de votre accord est obligatoire.",
      path: [getConventionFieldName("status")],
    });

export const conventionSchema: z.Schema<ConventionDto> =
  conventionWithoutExternalIdSchema.and(
    z.object({ externalId: externalConventionIdSchema }),
  );

export const conventionReadSchema: z.Schema<ConventionReadDto> =
  conventionSchema.and(
    z.object({
      agencyName: z.string(),
    }),
  );

export const conventionReadsSchema: z.Schema<Array<ConventionReadDto>> =
  z.array(conventionReadSchema);

export const conventionUkraineSchema: z.Schema<ConventionDto> =
  conventionSchema;

export const withConventionIdSchema: z.Schema<WithConventionId> = z.object({
  id: conventionIdSchema,
});

export const updateConventionRequestSchema: z.Schema<UpdateConventionRequestDto> =
  z
    .object({
      convention: conventionSchema,
      id: conventionIdSchema,
    })
    .refine(
      ({ convention, id }) => id === convention.id,
      "The ID in the URL path must match the ID in the request body.",
    );

export const listConventionsRequestSchema: z.Schema<ListConventionsRequestDto> =
  z.object({
    agencyId: agencyIdSchema.optional(),
    status: z.enum(allConventionStatuses).optional(),
  });

export const updateConventionStatusRequestSchema: z.Schema<UpdateConventionStatusRequestDto> =
  z.object({
    status: z.enum(allConventionStatuses),
    justification: z.string().optional(),
  });

export const generateMagicLinkRequestSchema: z.Schema<GenerateMagicLinkRequestDto> =
  z.object({
    applicationId: conventionIdSchema,
    role: z.enum(allRoles),
    expired: z.boolean(), //< defaults to false
  });

export const generateMagicLinkResponseSchema: z.Schema<GenerateMagicLinkResponseDto> =
  z.object({
    jwt: z.string(),
  });

export const renewMagicLinkRequestSchema: z.Schema<RenewMagicLinkRequestDto> =
  z.object({
    linkFormat: z.string(),
    expiredJwt: z.string(),
  });

import { z } from "../../node_modules/zod";
import { AgencyId, agencyIdSchema } from "./agencies";
import {
  emailAndMentorEmailAreDifferent,
  enoughWorkedDaysToReviewFromSubmitDate,
  mustBeSignedByBeneficiaryBeforeReview,
  mustBeSignedByEstablishmentBeforeReview,
  startDateIsBeforeEndDate,
  submissionAndStartDatesConstraints,
  underMaxDuration,
} from "./immersionApplicationRefinement";
import {
  LegacyScheduleDto,
  reasonableSchedule,
  ScheduleDto,
} from "./ScheduleSchema";
import { SiretDto, siretSchema } from "./siret";
import { allRoles, Role } from "./tokens/MagicLinkPayload";
import { Flavor } from "./typeFlavors";
import {
  addressWithPostalCodeSchema,
  NotEmptyArray,
  phoneRegExp,
  stringOfNumbers,
} from "./utils";
import { zBoolean, zEmail, zString, zTrimmedString } from "./zodUtils";

// Matches valid dates of the format 'yyyy-mm-dd'.
const dateRegExp = /\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/;

export type ApplicationStatus =
  | "DRAFT"
  | "READY_TO_SIGN"
  | "PARTIALLY_SIGNED"
  | "IN_REVIEW"
  | "ACCEPTED_BY_COUNSELLOR"
  | "ACCEPTED_BY_VALIDATOR"
  | "VALIDATED"
  | "REJECTED";
export const validApplicationStatus: NotEmptyArray<ApplicationStatus> = [
  "DRAFT",
  "READY_TO_SIGN",
  "PARTIALLY_SIGNED",
  "IN_REVIEW",
  "ACCEPTED_BY_COUNSELLOR",
  "ACCEPTED_BY_VALIDATOR",
  "VALIDATED",
  "REJECTED",
];

const scheduleSchema: z.ZodSchema<ScheduleDto> = z.any();
const legacyScheduleSchema: z.ZodSchema<LegacyScheduleDto> = z.any();

export type ImmersionApplicationId = Flavor<string, "ImmersionApplicationId">;
export const immersionApplicationIdSchema: z.ZodSchema<ImmersionApplicationId> =
  zTrimmedString;

export type ImmersionApplicationDto = {
  id: ImmersionApplicationId;
  status: ApplicationStatus;
  rejectionJustification?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  postalCode?: string;
  agencyId: AgencyId;
  dateSubmission: string; // Date iso string
  dateStart: string; // Date iso string
  dateEnd: string; // Date iso string
  siret: SiretDto;
  businessName: string;
  mentor: string;
  mentorPhone: string;
  mentorEmail: string;
  schedule: ScheduleDto;
  legacySchedule?: LegacyScheduleDto;
  workConditions?: string;
  individualProtection: boolean;
  sanitaryPrevention: boolean;
  sanitaryPreventionDescription?: string;
  immersionAddress?: string;
  immersionObjective?: string;
  immersionProfession: string;
  immersionActivities: string;
  immersionSkills?: string;
  beneficiaryAccepted: boolean;
  enterpriseAccepted: boolean;
  peExternalId?: string;
};

export const immersionApplicationSchema: z.Schema<ImmersionApplicationDto> = z
  .object({
    id: immersionApplicationIdSchema,
    status: z.enum(validApplicationStatus),
    rejectionJustification: z.string().optional(),
    email: zEmail,
    firstName: zTrimmedString,
    lastName: zTrimmedString,
    phone: z
      .string()
      .regex(phoneRegExp, "Numero de téléphone incorrect")
      .optional(),
    postalCode: z
      .string()
      .regex(stringOfNumbers)
      .length(5, "5 chiffres sont nécessaires pour le code postal")
      .optional(),
    agencyId: agencyIdSchema,
    dateSubmission: zString.regex(
      dateRegExp,
      "La date de saisie est invalide.",
    ),
    dateStart: zString.regex(dateRegExp, "La date de démarrage est invalide."),
    dateEnd: zString.regex(dateRegExp, "La date de fin invalide."),

    siret: siretSchema,
    businessName: zTrimmedString,
    mentor: zTrimmedString,
    mentorPhone: zString.regex(
      phoneRegExp,
      "Numero de téléphone de tuteur incorrect",
    ),
    mentorEmail: zEmail,
    schedule: scheduleSchema,
    legacySchedule: legacyScheduleSchema.optional(),
    workConditions: z.string().optional(),
    individualProtection: zBoolean,
    sanitaryPrevention: zBoolean,
    sanitaryPreventionDescription: z.string().optional(),
    immersionAddress: addressWithPostalCodeSchema.optional(),
    immersionObjective: z.string().optional(),
    immersionProfession: zTrimmedString,
    immersionActivities: zTrimmedString,
    immersionSkills: z.string().optional(),
    beneficiaryAccepted: zBoolean,
    enterpriseAccepted: zBoolean,
    peExternalId: z.string().optional(),
  })
  .refine(submissionAndStartDatesConstraints, {
    message:
      "Il n'est pas possible de faire une demande moins de 48h avant la date de démarrage souhaitée. Veuillez proposez une nouvelle date",
    path: ["dateStart"],
  })
  .refine(enoughWorkedDaysToReviewFromSubmitDate, {
    message:
      "Veuillez saisir une date de démarrage permettant au moins 24h pour sa validation par un conseiller",
    path: ["dateStart"],
  })
  .refine(startDateIsBeforeEndDate, {
    message: "La date de fin doit être après la date de début.",
    path: ["dateEnd"],
  })
  .refine(underMaxDuration, {
    message: "La durée maximale d'immersion est de 28 jours.",
    path: ["dateEnd"],
  })
  .refine(emailAndMentorEmailAreDifferent, {
    message: "Votre adresse e-mail doit être différente de celle du tuteur",
    path: ["mentorEmail"],
  })
  .refine(mustBeSignedByBeneficiaryBeforeReview, {
    message: "La confirmation de votre accord est obligatoire.",
    path: ["beneficiaryAccepted"],
  })
  .refine(mustBeSignedByEstablishmentBeforeReview, {
    message: "La confirmation de votre accord est obligatoire.",
    path: ["enterpriseAccepted"],
  });

export const immersionApplicationArraySchema = z.array(
  immersionApplicationSchema,
);

export type WithImmersionApplicationId = {
  id: ImmersionApplicationId;
};
export const withImmersionApplicationIdSchema: z.Schema<WithImmersionApplicationId> =
  z.object({
    id: immersionApplicationIdSchema,
  });

// prettier-ignore
export type UpdateImmersionApplicationRequestDto = z.infer<typeof updateImmersionApplicationRequestDtoSchema>;
export const updateImmersionApplicationRequestDtoSchema = z
  .object({
    immersionApplication: immersionApplicationSchema,
    id: immersionApplicationIdSchema,
  })
  .refine(
    ({ immersionApplication, id }) => id === immersionApplication.id,
    "The ID in the URL path must match the ID in the request body.",
  );

// prettier-ignore
export type ListImmersionApplicationRequestDto = z.infer<typeof listImmersionApplicationRequestDtoSchema>;
export const listImmersionApplicationRequestDtoSchema = z.object({
  agencyId: agencyIdSchema.optional(),
  status: z.enum(validApplicationStatus).optional(),
});

// prettier-ignore
export type UpdateImmersionApplicationStatusRequestDto = z.infer<typeof updateImmersionApplicationStatusRequestSchema>;
export const updateImmersionApplicationStatusRequestSchema = z.object({
  status: z.enum(validApplicationStatus),
  justification: z.string().optional(),
});

// prettier-ignore
export type GenerateMagicLinkRequestDto = z.infer<typeof generateMagicLinkRequestSchema>;
export const generateMagicLinkRequestSchema = z.object({
  applicationId: immersionApplicationIdSchema,
  role: z.enum(allRoles),
  expired: z.boolean(), //< defaults to false
});

// prettier-ignore
export type GenerateMagicLinkResponseDto = z.infer<typeof generateMagicLinkResponseSchema>;
export const generateMagicLinkResponseSchema = z.object({
  jwt: z.string(),
});

// prettier-ignore
export type RenewMagicLinkRequestDto = z.infer<typeof renewMagicLinkRequestSchema>;
export const renewMagicLinkRequestSchema = z.object({
  linkFormat: z.string(),
  expiredJwt: z.string(),
});

export const IMMERSION_APPLICATION_TEMPLATE: ImmersionApplicationDto = {
  id: "fake-test-id",
  status: "DRAFT",
  email: "esteban@ocon.fr",
  phone: "+33012345678",
  firstName: "Esteban",
  lastName: "Ocon",
  postalCode: "75000",
  agencyId: "fake-agency-id",
  dateSubmission: "2021-07-01",
  dateStart: "2021-08-01",
  dateEnd: "2021-08-31",
  businessName: "Beta.gouv.fr",
  siret: "12345678901234",
  mentor: "Alain Prost",
  mentorPhone: "0601010101",
  mentorEmail: "alain@prost.fr",
  schedule: reasonableSchedule,
  legacySchedule: undefined,
  workConditions: undefined,
  immersionAddress: "75001 Centre du monde",
  individualProtection: true,
  sanitaryPrevention: true,
  sanitaryPreventionDescription: "fourniture de gel",
  immersionObjective: "Confirmer un projet professionnel",
  immersionProfession: "Pilote d'automobile",
  immersionActivities: "Piloter un automobile",
  immersionSkills: "Utilisation des pneus optimale, gestion de carburant",
  beneficiaryAccepted: true,
  enterpriseAccepted: true,
  peExternalId: undefined,
};

const getNewStatus = (
  enterpriseAccepted: boolean,
  beneficiaryAccepted: boolean,
): ApplicationStatus => {
  if (enterpriseAccepted && beneficiaryAccepted) return "IN_REVIEW";
  if (
    (enterpriseAccepted && !beneficiaryAccepted) ||
    (!enterpriseAccepted && beneficiaryAccepted)
  )
    return "PARTIALLY_SIGNED";
  return "READY_TO_SIGN";
};

// Returns an application signed by provided roles.
export const signApplicationDtoWithRole = (
  application: ImmersionApplicationDto,
  role: Role,
): ImmersionApplicationDto => {
  if (
    !["DRAFT", "READY_TO_SIGN", "PARTIALLY_SIGNED"].includes(application.status)
  ) {
    throw new Error(
      "Incorrect initial application status: " + application.status,
    );
  }

  const enterpriseAccepted =
    role === "establishment" ? true : application.enterpriseAccepted;
  const beneficiaryAccepted =
    role === "beneficiary" ? true : application.beneficiaryAccepted;

  const status = getNewStatus(enterpriseAccepted, beneficiaryAccepted);

  return {
    ...application,
    beneficiaryAccepted,
    enterpriseAccepted,
    status,
  };
};

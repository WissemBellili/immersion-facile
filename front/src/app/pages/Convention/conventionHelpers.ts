import { addDays, startOfToday } from "date-fns";
import {
  ConventionDto,
  ConventionId,
  ConventionStatus,
  ImmersionObjective,
  InternshipKind,
  Signatories,
} from "shared";
import { FederatedIdentity } from "shared";
import { reasonableSchedule } from "shared";
import { OmitFromExistingKeys } from "shared";
import { toDateString } from "shared";
import { mergeObjectsExceptFalsyValues } from "shared";
import {
  conventionGateway,
  deviceRepository,
} from "src/app/config/dependencies";
import { ConventionImmersionPageRoute } from "src/app/pages/Convention/ConventionImmersionPage";
import { ConventionMiniStagePageRoute } from "src/app/pages/Convention/ConventionMiniStagePage";
import { ConventionUkrainePageRoute } from "src/app/pages/Convention/ConventionPageForUkraine";
import { ConventionInUrl } from "src/app/routing/route-params";
import { ENV } from "src/environmentVariables";
import { v4 as uuidV4 } from "uuid";

const { frontEnvType } = ENV;

export const createOrUpdateConvention = async (
  properties: { jwt?: string; demandeId?: string },
  convention: ConventionDto,
): Promise<void> => {
  const currentJWT = properties.jwt ?? "";

  currentJWT.length > 0
    ? await conventionGateway.updateMagicLink(convention, currentJWT)
    : await conventionGateway.add(convention);
};

export const isConventionFrozen = (
  convention: Partial<ConventionDto>,
): boolean => !convention.status || convention.status !== "DRAFT";

export const undefinedIfEmptyString = (text?: string): string | undefined =>
  text || undefined;

type WithSignatures = {
  signatories: {
    [K in keyof Signatories]: Partial<Signatories[K]>;
  };
};

type WithIntershipKind = {
  internshipKind: InternshipKind;
};

export type ConventionPresentation = OmitFromExistingKeys<
  Partial<ConventionDto>,
  "id" | "rejectionJustification"
> &
  WithSignatures &
  WithIntershipKind;

export const conventionInitialValuesFromUrl = ({
  route,
  internshipKind,
}: {
  route:
    | ConventionMiniStagePageRoute
    | ConventionImmersionPageRoute
    | ConventionUkrainePageRoute;
  internshipKind: InternshipKind;
}): ConventionPresentation => {
  const dataFromDevice = deviceRepository.get("partialConventionInUrl") ?? {};

  const params = mergeObjectsExceptFalsyValues(
    dataFromDevice,
    route.params as Partial<ConventionInUrl>,
  );

  const dateStart =
    params.dateStart ?? toDateString(addDays(startOfToday(), 2));
  const dateEnd = params.dateEnd ?? toDateString(addDays(startOfToday(), 3));

  const areLegalRepresentativeFieldPresent = !!(
    params.lrEmail ||
    params.lrPhone ||
    params.lrFirstName ||
    params.lrLastName
  );

  const initialFormWithStoredAndUrlParams: ConventionPresentation & {
    id: ConventionId;
  } = {
    id: uuidV4(),
    status: "DRAFT" as ConventionStatus,
    dateSubmission: toDateString(startOfToday()),

    signatories: {
      beneficiary: {
        role: "beneficiary",
        firstName: params.firstName ?? "",
        lastName: params.lastName ?? "",
        email: params.email ?? "",
        phone: params.phone ?? "",
        emergencyContact: params.emergencyContact ?? "",
        emergencyContactPhone: params.emergencyContactPhone ?? "",
        federatedIdentity: params.federatedIdentity as
          | FederatedIdentity
          | undefined,
      },
      mentor: {
        role: "establishment",
        firstName: params.mentorFirstName ?? "",
        lastName: params.mentorLastName ?? "",
        email: params.mentorEmail ?? "",
        phone: params.mentorPhone ?? "",
        job: params.mentorJob ?? "",
      },
      legalRepresentative: areLegalRepresentativeFieldPresent
        ? {
            role: "legal-representative",
            firstName: params.lrFirstName ?? "",
            lastName: params.lrLastName ?? "",
            email: params.lrEmail ?? "",
            phone: params.lrPhone ?? "",
          }
        : undefined,
    },

    postalCode: params.postalCode ?? "",

    dateStart,
    dateEnd,

    // Enterprise
    siret: params.siret ?? "",
    businessName: params.businessName ?? "",
    schedule:
      params.schedule ??
      reasonableSchedule({
        start: new Date(dateStart),
        end: new Date(dateEnd),
      }),
    immersionAddress: params.immersionAddress ?? "",
    agencyId: params.agencyId ?? undefined,
    workConditions: params.workConditions ?? "",

    // Covid
    individualProtection: params.individualProtection ?? undefined,
    sanitaryPrevention: params.sanitaryPrevention ?? undefined,
    sanitaryPreventionDescription: params.sanitaryPreventionDescription ?? "",

    // Immersion
    immersionObjective: params.immersionObjective as
      | ImmersionObjective
      | undefined,
    immersionAppellation: params.immersionAppellation,
    immersionActivities: params.immersionActivities ?? "",
    immersionSkills: params.immersionSkills ?? "",

    // Kind
    internshipKind,
  };

  if (frontEnvType === "DEV" && ENV.PREFILLED_FORMS)
    return devPrefilledValues(initialFormWithStoredAndUrlParams);

  return initialFormWithStoredAndUrlParams;
};

const devPrefilledValues = (
  emptyForm: ConventionPresentation,
): ConventionPresentation => {
  const { beneficiary, mentor, legalRepresentative } = emptyForm.signatories;

  return {
    ...emptyForm,

    signatories: {
      beneficiary: {
        role: "beneficiary",
        firstName: beneficiary.firstName || "Sylvanie",
        lastName: beneficiary.lastName || "Durand",
        email: beneficiary.email || "sylvanie@monemail.fr",
        phone: beneficiary.phone || "0612345678",
        emergencyContact: beneficiary.emergencyContact || "Éric Durand",
        emergencyContactPhone:
          beneficiary.emergencyContactPhone || "0662552607",
        federatedIdentity: beneficiary.federatedIdentity,
      },
      mentor: {
        role: "establishment",
        firstName: mentor.firstName || "Joe",
        lastName: mentor.lastName || "Le mentor",
        phone: mentor.phone || "0101100110",
        email: mentor.email || "mentor@supermentor.fr",
        job: mentor.job,
      },
      legalRepresentative,
    },

    // Participant
    postalCode: emptyForm.postalCode || "75001",

    // Enterprise
    siret: emptyForm.siret || "1234567890123",
    businessName: emptyForm.businessName || "Futuroscope",
    immersionAddress:
      emptyForm.immersionAddress ||
      "Societe Du Parc Du Futuroscope PARC DU FUTUROSCOPE 86130 JAUNAY-MARIGNY",
    agencyId: emptyForm.agencyId || "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",

    // Covid
    individualProtection: emptyForm.individualProtection ?? true,
    sanitaryPrevention: emptyForm.sanitaryPrevention ?? true,
    sanitaryPreventionDescription:
      emptyForm.sanitaryPreventionDescription || "Aucunes",

    // Immersion
    immersionObjective: emptyForm.immersionObjective,
    immersionAppellation: emptyForm.immersionAppellation || {
      romeLabel: "Boulanger / Boulangère",
      appellationLabel: "Boulangerie",
      romeCode: "D1502",
      appellationCode: "12278",
    },
    immersionActivities: emptyForm.immersionActivities || "Superviser",
    immersionSkills: emptyForm.immersionSkills || "Attention au détail",
  };
};

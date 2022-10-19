import { parseISO } from "date-fns";
import {
  AgencyDto,
  calculateTotalImmersionHoursBetweenDate,
  ConventionDto,
  conventionSchema,
  prettyPrintSchedule,
  ValidatedConventionFinalConfirmationEmail,
} from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";

import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { ConventionPoleEmploiUserAdvisorEntity } from "../../../peConnect/dto/PeConnect.dto";
import { EmailGateway } from "../../ports/EmailGateway";

export class NotifyAllActorsOfFinalConventionValidation extends TransactionalUseCase<ConventionDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly emailGateway: EmailGateway,
  ) {
    super(uowPerformer);
  }

  inputSchema = conventionSchema;

  public async _execute(
    convention: ConventionDto,
    uow: UnitOfWork,
  ): Promise<void> {
    const agency = await uow.agencyRepository.getById(convention.agencyId);

    if (!agency)
      throw new NotFoundError(
        `Unable to send mail. No agency config found for ${convention.agencyId}`,
      );

    const peUserAdvisorOrUndefined =
      await uow.conventionPoleEmploiAdvisorRepository.getByConventionId(
        convention.id,
      );

    const recipients = [
      convention.signatories.beneficiary.email,
      convention.signatories.establishmentRepresentative.email,
      ...(convention.signatories.beneficiaryRepresentative
        ? [convention.signatories.beneficiaryRepresentative.email]
        : []),
      ...agency.counsellorEmails,
      ...agency.validatorEmails,
      ...getPeAdvisorEmailIfExist(peUserAdvisorOrUndefined),
    ];
    if (
      convention.signatories.establishmentRepresentative.email !==
      convention.establishmentTutor.email
    )
      recipients.push(convention.establishmentTutor.email);

    await this.emailGateway.sendEmail({
      type: "VALIDATED_CONVENTION_FINAL_CONFIRMATION",
      recipients,
      params: getValidatedConventionFinalConfirmationParams(agency, convention),
    });
  }
}

// Visible for testing.
export const getValidatedConventionFinalConfirmationParams = (
  agency: AgencyDto,
  convention: ConventionDto,
): ValidatedConventionFinalConfirmationEmail["params"] => {
  const {
    beneficiary,
    establishmentRepresentative,
    beneficiaryRepresentative,
  } = convention.signatories;

  return {
    totalHours: calculateTotalImmersionHoursBetweenDate({
      dateStart: convention.dateStart,
      dateEnd: convention.dateEnd,
      schedule: convention.schedule,
    }),
    beneficiaryFirstName: beneficiary.firstName,
    beneficiaryLastName: beneficiary.lastName,
    emergencyContact: beneficiary.emergencyContact,
    emergencyContactPhone: beneficiary.emergencyContactPhone,
    dateStart: parseISO(convention.dateStart).toLocaleDateString("fr"),
    dateEnd: parseISO(convention.dateEnd).toLocaleDateString("fr"),
    establishmentTutorName: `${convention.establishmentTutor.firstName} ${convention.establishmentTutor.lastName}`,
    establishmentRepresentativeName: `${establishmentRepresentative.firstName} ${establishmentRepresentative.lastName}`,
    scheduleText: prettyPrintSchedule(convention.schedule).split("\n"),
    businessName: convention.businessName,
    immersionAddress: convention.immersionAddress || "",
    immersionAppellationLabel: convention.immersionAppellation.appellationLabel,
    immersionActivities: convention.immersionActivities,
    immersionSkills: convention.immersionSkills ?? "Non renseigné",
    sanitaryPrevention:
      convention.sanitaryPrevention && convention.sanitaryPreventionDescription
        ? convention.sanitaryPreventionDescription
        : "non",
    individualProtection: convention.individualProtection ? "oui" : "non",
    questionnaireUrl: agency.questionnaireUrl,
    signature: agency.signature,
    workConditions: convention.workConditions,
    beneficiaryRepresentativeName: beneficiaryRepresentative
      ? `${beneficiaryRepresentative.firstName} ${beneficiaryRepresentative.lastName}`
      : "",
  };
};

const getPeAdvisorEmailIfExist = (
  advisor: ConventionPoleEmploiUserAdvisorEntity | undefined,
): [string] | [] => (advisor?.email ? [advisor.email] : []);

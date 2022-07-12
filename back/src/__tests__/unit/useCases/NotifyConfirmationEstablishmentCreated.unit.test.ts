import { AllowListEmailFilter } from "../../../adapters/secondary/core/EmailFilterImplementations";
import { InMemoryEmailGateway } from "../../../adapters/secondary/emailGateway/InMemoryEmailGateway";
import { EmailFilter } from "../../../domain/core/ports/EmailFilter";
import { NotifyConfirmationEstablishmentCreated as NotifyConfirmationEstablishmentCreated } from "../../../domain/immersionOffer/useCases/notifications/NotifyConfirmationEstablishmentCreated";
import { expectedEmailEstablishmentCreatedReviewMatchingEstablisment } from "../../../_testBuilders/emailAssertions";
import { FormEstablishmentDtoBuilder } from "../../../../../shared/src/formEstablishment/FormEstablishmentDtoBuilder";

describe("NotifyConfirmationEstablismentCreated", () => {
  const validEstablishment = FormEstablishmentDtoBuilder.valid().build();
  let emailGw: InMemoryEmailGateway;
  let emailFilter: EmailFilter;

  beforeEach(() => {
    emailGw = new InMemoryEmailGateway();
    emailFilter = new AllowListEmailFilter([
      validEstablishment.businessContact.email,
    ]);
  });

  const createUseCase = () =>
    new NotifyConfirmationEstablishmentCreated(emailFilter, emailGw);

  describe("When establishment is valid", () => {
    it("Nominal case: Sends notification email to Establisment contact", async () => {
      await createUseCase().execute(validEstablishment);

      const sentEmails = emailGw.getSentEmails();
      expect(sentEmails).toHaveLength(1);

      expectedEmailEstablishmentCreatedReviewMatchingEstablisment(
        sentEmails[0],
        validEstablishment,
      );
    });
  });

  it("Sends no emails when allowList is enforced and empty", async () => {
    emailFilter = new AllowListEmailFilter([]);
    await createUseCase().execute(validEstablishment);

    const sentEmails = emailGw.getSentEmails();
    expect(sentEmails).toHaveLength(0);
  });
});

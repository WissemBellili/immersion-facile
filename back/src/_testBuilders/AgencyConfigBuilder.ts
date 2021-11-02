import { AgencyConfig } from "../domain/immersionApplication/ports/AgencyRepository";
import { AgencyCode, AgencyId } from "../shared/agencies";
import { legacyAgencyIds } from "./../shared/agencies";
import { Builder } from "./Builder";

const emptyConfig: AgencyConfig = {
  id: "empty-id",
  name: "empty-name",
  counsellorEmails: [],
  validatorEmails: [],
  adminEmails: [],
  questionnaireUrl: "empty-questionnaire-url",
  signature: "empty-signature",
};

export class AgencyConfigBuilder implements Builder<AgencyConfig> {
  // Initializes all feature flags to be off.
  public constructor(readonly config: AgencyConfig) {}

  // TODO(nwettstein): Remove when agency ids have fully replaced agency codes.
  public static create(agencyCode: AgencyCode) {
    const id = legacyAgencyIds[agencyCode];
    if (!id) throw new Error(`Missing id for legacy agencyCode ${agencyCode}`);
    return new AgencyConfigBuilder({
      ...emptyConfig,
      id,
    });
  }

  public static empty() {
    return new AgencyConfigBuilder({ ...emptyConfig });
  }

  public withId(id: AgencyId) {
    return new AgencyConfigBuilder({
      ...this.config,
      id,
    });
  }

  public withName(name: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      name,
    });
  }

  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      counsellorEmails,
    });
  }
  public withValidatorEmails(validatorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      validatorEmails,
    });
  }
  public withAdminEmails(adminEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.config,
      adminEmails,
    });
  }
  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      questionnaireUrl,
    });
  }
  public withSignature(signature: string) {
    return new AgencyConfigBuilder({
      ...this.config,
      signature,
    });
  }

  public build() {
    return this.config;
  }
}

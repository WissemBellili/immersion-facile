import {
  AgencyConfig,
  AgencyStatus,
} from "../domain/immersionApplication/ports/AgencyRepository";
import { AgencyId } from "../shared/agencies";
import { Builder } from "./Builder";

const emptyAgency: AgencyConfig = {
  id: "empty-id",
  name: "empty-name",
  status: "active",
  counsellorEmails: [],
  validatorEmails: [],
  adminEmails: [],
  questionnaireUrl: "empty-questionnaire-url",
  signature: "empty-signature",
  address: "empty-address",
  position: {
    lat: 0,
    lon: 0,
  },
};

export class AgencyConfigBuilder implements Builder<AgencyConfig> {
  // Initializes all feature flags to be off.
  public constructor(readonly agency: AgencyConfig) {}

  public static create(id: AgencyId) {
    return new AgencyConfigBuilder({
      ...emptyAgency,
      id,
    });
  }

  public static empty() {
    return new AgencyConfigBuilder({ ...emptyAgency });
  }

  public withId(id: AgencyId) {
    return new AgencyConfigBuilder({
      ...this.agency,
      id,
    });
  }

  public withName(name: string) {
    return new AgencyConfigBuilder({
      ...this.agency,
      name,
    });
  }

  public withStatus(status: AgencyStatus) {
    return new AgencyConfigBuilder({
      ...this.agency,
      status,
    });
  }

  public withAddress(address: string) {
    return new AgencyConfigBuilder({
      ...this.agency,
      address,
    });
  }

  public withCounsellorEmails(counsellorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.agency,
      counsellorEmails,
    });
  }
  public withValidatorEmails(validatorEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.agency,
      validatorEmails,
    });
  }
  public withAdminEmails(adminEmails: string[]) {
    return new AgencyConfigBuilder({
      ...this.agency,
      adminEmails,
    });
  }
  public withQuestionnaireUrl(questionnaireUrl: string) {
    return new AgencyConfigBuilder({
      ...this.agency,
      questionnaireUrl,
    });
  }
  public withSignature(signature: string) {
    return new AgencyConfigBuilder({
      ...this.agency,
      signature,
    });
  }

  public withPosition(lat: number, lon: number) {
    return new AgencyConfigBuilder({
      ...this.agency,
      position: {
        lat,
        lon,
      },
    });
  }

  public build() {
    return this.agency;
  }
}

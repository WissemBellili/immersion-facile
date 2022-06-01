import { buildTestApp } from "../../_testBuilders/buildTestApp";
import { expectTypeToMatchAndEqual } from "../../_testBuilders/test.helpers";
import { CreateAgencyDto } from "shared/src/agency/agency.dto";
import { agenciesRoute } from "shared/src/routes";

describe("Route to add Agency", () => {
  it("support posting valid agency", async () => {
    const { request, reposAndGateways, appConfig } = await buildTestApp();
    reposAndGateways.agency.setAgencies([]);
    const parisMissionLocaleParams: CreateAgencyDto = {
      id: "some-id",
      address: "paris",
      counsellorEmails: ["counsellor@mail.com"],
      validatorEmails: ["validator@mail.com"],
      kind: "mission-locale",
      name: "Mission locale de Paris",
      position: { lat: 10, lon: 20 },
      questionnaireUrl: "www.myUrl.com",
      signature: "Super signature of the agency",
    };

    const response = await request
      .post(`/${agenciesRoute}`)
      .send(parisMissionLocaleParams);

    expect(response.status).toBe(200);

    const inRepo = reposAndGateways.agency.agencies;
    expectTypeToMatchAndEqual(inRepo, [
      {
        ...parisMissionLocaleParams,
        questionnaireUrl: parisMissionLocaleParams.questionnaireUrl!,
        adminEmails: [appConfig.defaultAdminEmail],
        status: "needsReview",
      },
    ]);
  });
});

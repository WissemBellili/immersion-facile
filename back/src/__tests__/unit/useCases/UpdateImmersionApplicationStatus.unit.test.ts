/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import {
  executeUpdateConventionStatusUseCase,
  setupInitialState,
  testForAllRolesAndInitialStatusCases,
} from "./UpdateImmersionApplicationStatus.testHelpers";

describe("UpdateImmersionApplicationStatus", () => {
  describe("* -> DRAFT transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "DRAFT",
      expectedDomainTopic: "ImmersionApplicationRequiresModification",
      justification: "test justification",
      updatedFields: { enterpriseAccepted: false, beneficiaryAccepted: false },
      allowedRoles: [
        "beneficiary",
        "establishment",
        "counsellor",
        "validator",
        "admin",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
  });

  describe("* -> READY_TO_SIGN transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "READY_TO_SIGN",
      expectedDomainTopic: null,
      allowedRoles: ["beneficiary", "establishment"],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "PARTIALLY_SIGNED",
      expectedDomainTopic: "ImmersionApplicationPartiallySigned",
      allowedRoles: ["beneficiary", "establishment"],
      allowedInitialStatuses: ["READY_TO_SIGN"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "IN_REVIEW",
      expectedDomainTopic: "ImmersionApplicationFullySigned",
      allowedRoles: ["beneficiary", "establishment"],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedDomainTopic: "ImmersionApplicationAcceptedByCounsellor",
      allowedRoles: ["counsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "ACCEPTED_BY_VALIDATOR",
      expectedDomainTopic: "ImmersionApplicationAcceptedByValidator",
      allowedRoles: ["validator"],
      allowedInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
    });
  });

  describe("* -> VALIDATED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "VALIDATED",
      expectedDomainTopic: "FinalImmersionApplicationValidationByAdmin",
      allowedRoles: ["admin"],
      allowedInitialStatuses: [
        "ACCEPTED_BY_COUNSELLOR",
        "ACCEPTED_BY_VALIDATOR",
      ],
    });
  });

  describe("* -> REJECTED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "REJECTED",
      expectedDomainTopic: "ImmersionApplicationRejected",
      justification: "my rejection justification",
      updatedFields: { rejectionJustification: "my rejection justification" },
      allowedRoles: ["admin", "validator", "counsellor"],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
  });

  describe("* -> CANCELLED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "CANCELLED",
      expectedDomainTopic: "ImmersionApplicationCancelled",
      allowedRoles: ["counsellor", "validator", "admin"],
      allowedInitialStatuses: [
        "DRAFT",
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
        "REJECTED",
      ],
    });
  });

  it("fails for unknown application ids", async () => {
    const { updateConventionStatus, conventionRepository } =
      await setupInitialState({ initialStatus: "IN_REVIEW" });
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        conventionId: "unknown_application_id",
        role: "admin",
        email: "test@test.fr",
        targetStatus: "VALIDATED",
        updateConventionStatus,
        conventionRepository,
      }),
      new NotFoundError("unknown_application_id"),
    );
  });
});

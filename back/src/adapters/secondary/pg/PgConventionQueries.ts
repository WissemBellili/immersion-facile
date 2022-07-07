import { PoolClient } from "pg";
import format from "pg-format";
import {
  ConventionDto,
  validatedConventionStatuses,
} from "shared/src/convention/convention.dto";
import { ConventionQueries } from "../../../domain/convention/ports/ConventionQueries";
import { ConventionRawBeforeExport } from "../../../domain/convention/useCases/ExportConventionsReport";
import { ImmersionAssessmentEmailParams } from "../../../domain/immersionOffer/useCases/SendEmailsWithAssessmentCreationLink";
import { pgConventionRowToDto } from "./PgConventionRepository";
import { optional } from "./pgUtils";

export class PgConventionQueries implements ConventionQueries {
  constructor(private client: PoolClient) {}
  public async getAllConventionsForExport(): Promise<
    ConventionRawBeforeExport[]
  > {
    const pgResult = await this.client.query(`
      SELECT *, conventions.status as convention_status, agencies.status as agency_status, cei.external_id
      FROM conventions
      LEFT JOIN agencies ON agencies.id = conventions.agency_id
      LEFT JOIN public_appellations_data AS pad ON pad.ogr_appellation = conventions.immersion_appellation
      LEFT JOIN convention_external_ids AS cei ON cei.convention_id = conventions.id
      `);

    return pgResult.rows.map((row) => ({
      agencyName: row.name,
      status: row.convention_status,
      postalCode: row.postal_code,
      email: row.email,
      phone: row.phone,
      firstName: row.first_name,
      lastName: row.last_name,
      emergencyContact: row.emergency_contact,
      emergencyContactPhone: row.emergency_contact_phone,
      dateSubmission: new Date(row.date_submission).toISOString(),
      dateStart: new Date(row.date_start).toISOString(),
      dateEnd: new Date(row.date_end).toISOString(),
      dateValidation:
        row.validation_date ?? new Date(row.date_validation).toISOString(),
      businessName: row.business_name,
      mentor: row.mentor,
      mentorPhone: row.mentor_phone,
      mentorEmail: row.mentor_email,
      immersionObjective: row.immersion_objective,
      immersionProfession: row.libelle_appellation_court,
      beneficiaryAccepted: row.beneficiary_accepted,
      enterpriseAccepted: row.enterprise_accepted,
      schedule: row.schedule,
      siret: row.siret,
      workConditions: optional(row.work_conditions),
    }));
  }

  public async getLatestUpdated(): Promise<ConventionDto[]> {
    const pgResult = await this.client.query(
      `SELECT *, vad.*, cei.external_id
       FROM conventions 
       LEFT JOIN view_appellations_dto AS vad 
         ON vad.appellation_code = conventions.immersion_appellation
        LEFT JOIN convention_external_ids AS cei
         ON cei.convention_id = conventions.id
       ORDER BY conventions.updated_at DESC
       LIMIT 10`,
    );

    return pgResult.rows.map(pgConventionRowToDto);
  }
  public async getAllImmersionAssessmentEmailParamsForThoseEndingThatDidntReceivedAssessmentLink(
    dateEnd: Date,
  ): Promise<ImmersionAssessmentEmailParams[]> {
    const pgResult = await this.client.query(
      format(
        `SELECT JSON_BUILD_OBJECT(
              'immersionId', id, 
              'beneficiaryFirstName', first_name, 
              'beneficiaryLastName', last_name,
              'mentorName', mentor, 
              'mentorEmail', mentor_email) AS params
       FROM conventions 
       WHERE date_end::date = $1
       AND status IN (%1$L)
       AND id NOT IN (SELECT (payload ->> 'id')::uuid FROM outbox where topic = 'EmailWithLinkToCreateAssessmentSent' )`,
        validatedConventionStatuses,
      ),
      [dateEnd],
    );
    return pgResult.rows.map((row) => row.params);
  }
}

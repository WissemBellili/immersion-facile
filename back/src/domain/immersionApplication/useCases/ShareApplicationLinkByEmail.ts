import { UseCase } from "../../core/UseCase";
import { EmailGateway } from "../ports/EmailGateway";
import { z } from "zod";

type ShareApplicationByEmailParams = {
  immersionApplicationLink: string;
  email: string;
  details?: string;
};

export class ShareApplicationLinkByEmail extends UseCase<
  ShareApplicationByEmailParams,
  boolean
> {
  constructor(private readonly emailGateway: EmailGateway) {
    super();
  }
  inputSchema = z.object({
    email: z.string(),
    details: z.string().optional(),
    immersionApplicationLink: z.string(),
  });

  public async _execute(
    params: ShareApplicationByEmailParams,
  ): Promise<boolean> {
    try {
      await this.emailGateway.sendShareDraftApplicationByLink(params.email, {
        additional_details: toFormattedDetails(params.immersionApplicationLink),
        application_form_url: params.immersionApplicationLink,
      });

      return true;
    } catch (e: any) {
      return false;
    }
  }
}

const toFormattedDetails = (details: string | undefined): string => {
  return details ? `Détails additionels : ${details}` : "";
};

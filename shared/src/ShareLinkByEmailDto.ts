import { z } from "zod";
import { zEmail, zString } from "./zodUtils";

export type ShareLinkByEmailDto = {
  conventionLink: string;
  email: string;
  details: string;
};

export const shareLinkByEmailSchema: z.Schema<ShareLinkByEmailDto> = z.object({
  conventionLink: zString,
  email: zEmail,
  details: zString,
});

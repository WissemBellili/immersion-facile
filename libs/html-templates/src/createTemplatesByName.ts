type CreateEmailVariable<P> = (params: P) => {
  subject: string;
  greetings?: string;
  content?: string;
  highlight?: string;
  subContent?: string;
  legals?: string;
  agencyLogoUrl?: string;
  button?: {
    url: string;
    label: string;
  };
};

export type HtmlTemplateEmailData<P> = {
  niceName: string;
  createEmailVariables: CreateEmailVariable<P>;
  tags?: string[];
  attachmentUrls?: string[];
};

export const createTemplatesByName = <
  ParamsByEmailType extends { [K in string]: unknown } = never,
>(templatesByName: {
  [K in keyof ParamsByEmailType]: HtmlTemplateEmailData<ParamsByEmailType[K]>;
}) => templatesByName;

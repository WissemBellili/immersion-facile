import { AnyObj, EmptyObj, Url, PathParameters } from "./utilityTypes";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type Target<
  // ResponseBody = void,
  Body = void,
  QueryParams = void,
  Headers = void,
  UrlWithParams = Url,
> = {
  url: UrlWithParams;
  method: HttpMethod;
  body: Body;
  queryParams: QueryParams;
  headers: Headers;
  // responseBody: ResponseBody;
  // validateResponseBody: (responseBody: unknown) => ResponseBody | never;
};

export type HttpResponse<ResponseBody> = {
  responseBody: ResponseBody;
  status: number;
};

export type UnknownTarget = Target<unknown, unknown, unknown>;

type RuntimeTarget<UrlWithParams = Url> = Pick<
  Target<void, void, void, UrlWithParams>,
  "method" | "url"
>;

export type CreateTargets<T extends Record<string, UnknownTarget>> = T;

export type HttpClient<Targets extends Record<string, UnknownTarget>> = {
  [TargetName in keyof Targets]: (
    /* If the body is not void return '{}' (required for union)
     * else return the generic parameter defined for the target
     */
    // prettier-ignore
    ...params: { target: Targets[TargetName], urlParams: PathParameters<Targets[TargetName]["url"]> } extends { target: Target<void, void, void, unknown>, urlParams: EmptyObj }
      ? []
      : [(PathParameters<Targets[TargetName]["url"]> extends EmptyObj ? AnyObj : { urlParams: PathParameters<Targets[TargetName]["url"]> })
      & (Targets[TargetName]["body"] extends void ? AnyObj : { body: Targets[TargetName]["body"];})
      & (Targets[TargetName]["queryParams"] extends void ? AnyObj : { queryParams: Targets[TargetName]["queryParams"]; })
      & (Targets[TargetName]["headers"] extends void ? AnyObj : { headers: Targets[TargetName]["headers"]; })]
  ) => Promise<HttpResponse<unknown>>;
};

type ExtractFromExisting<T, K extends T> = Extract<T, K>;

export type HandlerParams = Partial<
  Record<
    | ExtractFromExisting<keyof Target, "body" | "queryParams" | "headers">
    | "urlParams",
    any
  >
>;

type Handler = (params?: HandlerParams) => Promise<HttpResponse<any>>;

export type HandlerCreator = (target: RuntimeTarget) => Handler;

export const createTargets = <
  Targets extends Record<string, UnknownTarget>,
>(targets: {
  [TargetName in keyof Targets]: RuntimeTarget<Targets[TargetName]["url"]>;
}) => targets;

export const configureHttpClient =
  (handlerCreator: HandlerCreator) =>
  <Targets extends Record<string, UnknownTarget>>(targets: {
    [TargetName in keyof Targets]: RuntimeTarget<Targets[TargetName]["url"]>;
  }): HttpClient<Targets> =>
    Object.keys(targets).reduce((acc, targetName: keyof typeof targets) => {
      const target = targets[targetName];

      const handler: Handler = async (handlerParams) => {
        const handler = handlerCreator({
          ...target,
          url: replaceParamsInUrl(target.url, handlerParams?.urlParams),
        });
        return handler(handlerParams);
      };

      return {
        ...acc,
        [targetName]: handler,
      };
    }, {} as HttpClient<Targets>);

export const replaceParamsInUrl = <UrlToReplace extends Url>(
  path: UrlToReplace,
  params: PathParameters<UrlToReplace> = {} as PathParameters<UrlToReplace>,
): Url => {
  const paramNames = Object.keys(params) as (keyof typeof params)[];
  if (paramNames.length === 0) return path;
  return paramNames.reduce(
    (acc, paramName) =>
      acc.replace(`:${paramName.toString()}`, params[paramName]),
    path as any,
  );
};

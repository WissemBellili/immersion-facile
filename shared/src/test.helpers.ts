import { partition } from "ramda";
import { EmailType, TemplatedEmail } from "./email/email";

export const expectPromiseToFailWith = async (
  promise: Promise<unknown>,
  errorMessage: string,
) => {
  await expect(promise).rejects.toThrowError(new Error(errorMessage));
};

export const expectPromiseToFailWithError = async (
  promise: Promise<unknown>,
  expectedError: Error,
) => {
  await expect(promise).rejects.toThrowError(expectedError);
};

export const expectPromiseToFailWithErrorMatching = async (
  promise: Promise<unknown>,
  expectedErrorMatch: Record<string, unknown>,
) => {
  await expect(promise).rejects.toThrow();
  await promise.catch((e) => expect(e).toMatchObject(expectedErrorMatch));
};

export const expectArraysToMatch = <T>(actual: T[], expected: Partial<T>[]) => {
  expect(actual).toMatchObject(expected);
};

export const expectArraysToEqual = <T>(actual: T[], expected: T[]) => {
  expect(actual).toEqual(expected);
};

export const expectTypeToMatchAndEqual = <T>(actual: T, expected: T) => {
  expect(actual).toEqual(expected);
};

export const expectJwtInMagicLinkAndGetIt = (link: string | unknown) => {
  expect(typeof link).toBe("string");
  const split = (link as string).split("jwt=");
  const last = split[split.length - 1];
  expect(last).toBeTruthy();
  return last;
};

export const expectArraysToEqualIgnoringOrder = <T>(
  actual: T[],
  expected: T[],
) => {
  expect(actual).toHaveLength(expected.length);
  expect(actual).toEqual(expect.arrayContaining(expected));
};

export const splitCasesBetweenPassingAndFailing = <T>(
  cases: readonly T[],
  passing: readonly T[],
): [T[], T[]] => partition((status: T) => passing.includes(status), cases);

export const expectEmailOfType = <
  T extends EmailType,
  E extends TemplatedEmail = TemplatedEmail,
>(
  email: E,
  expectedEmailType: T,
): Extract<E, { type: T }> => {
  expect(email.type).toBe(expectedEmailType);
  return email as Extract<E, { type: T }>;
};

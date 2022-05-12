const originalEnvVariables = {
  VITE_GATEWAY: import.meta.env.VITE_GATEWAY,
  VITE_ENV_TYPE: import.meta.env.VITE_ENV_TYPE,
  DEV: import.meta.env.DEV,
  VITE_PREFILLED_ESTABLISHMENT_FORM: import.meta.env
    .VITE_PREFILLED_ESTABLISHMENT_FORM as undefined | string,
  VITE_PREFILLED_FORMS: import.meta.env.VITE_PREFILLED_FORMS,
};

export const ENV = {
  dev: originalEnvVariables.DEV,
  frontEnvType: String(originalEnvVariables.VITE_ENV_TYPE) || "PROD",
  gateway:
    originalEnvVariables.VITE_GATEWAY === "IN_MEMORY" ? "IN_MEMORY" : "HTTP",
  PREFILLED_ESTABLISHMENT_FORM:
    originalEnvVariables.VITE_PREFILLED_ESTABLISHMENT_FORM?.toLowerCase() ===
    "true",
  PREFILLED_FORMS:
    import.meta.env.VITE_PREFILLED_FORMS?.toLowerCase() === "true",
};

Object.entries(ENV).forEach(([key, value]) =>
  //eslint-disable-next-line no-console
  console.info(`ENV.${key} >>> `, value),
);

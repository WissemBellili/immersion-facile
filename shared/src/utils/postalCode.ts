import { zString } from "../zodUtils";

// Matches strings that contain at least one 5-digit number.
const postalCodeRegex = /(^|\s|,)\d{5}(\s|$|,)/;
export const addressWithPostalCodeSchema = zString.regex(
  postalCodeRegex,
  "Veuillez spécifier un code postal dans l'adresse.",
);

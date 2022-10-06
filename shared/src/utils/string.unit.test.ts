import { cleanStringToHTMLAttribute } from "./string";

describe("String cleaner utils", () => {
  it.each([
    [
      "Confirmer un projet professionnel",
      null,
      null,
      "confirmer-un-projet-professionnel",
    ],
    [
      "Intitulé du poste / métier observé *",
      "input",
      3,
      "input-intitule-du-poste-metier-observe-3",
    ],
    [
      "Mille sabords, capitaine !",
      "input",
      "-super",
      "input-mille-sabords-capitaine--super",
    ],
  ])(
    "should clean strings to HTML attribute value",
    (input, prefix, suffix, expected) => {
      expect(cleanStringToHTMLAttribute(input, prefix, suffix)).toBe(expected);
    },
  );
});

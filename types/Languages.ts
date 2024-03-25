export type LanguageType = "en" //| "fr" | "es" | "de";

// why can't I do this automatically based on the above type?
export const supportedLanguages = {
  "en": {
    name: "English",
    nativeName: "English",
  },
  // "de": {
  //   name: "German",
  //   nativeName: "Deutsch",
  // },
  // "es": {
  //   name: "Spanish",
  //   nativeName: "Español",
  // },
  // "pt": {
  //   name: "Portuguese",
  //   nativeName: "Português",
  // },
  // "fr": {
  //   name: "French",
  //   nativeName: "Français",
  // },
};

export const isSupportedLanguage = (lang: any): boolean => {
  // console.log("** types.Languages.isSupportedLanguage", { lang });
  return Object.keys(supportedLanguages).includes(lang);
};

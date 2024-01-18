export type LanguageType = "en" | "fr" | "es" | "de";

// why can't I do this automatically based on the above type?
export const supportedLanguages = {
  "en": {
    name: "English",
    nativeName: "English",
  },
  "fr": {
    name: "French",
    nativeName: "Français",
  },
  "es": {
    name: "Spanish",
    nativeName: "Español",
  },
  "de": {
    name: "German",
    nativeName: "Deutsch",
  },
};

export const isSupportedLanguage = (lang: any): boolean => {
  console.log("** types.Languages.isSupportedLanguage", { lang });
  return Object.keys(supportedLanguages).includes(lang);
};

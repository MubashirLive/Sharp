import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";

// SHARP i18n bootstrap
// Strings are extracted on a per-page basis; en.json is the source of truth.
// Hindi translations lag and fall back to en when missing (see fallbackLng).
i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
    },
    lng: localStorage.getItem("sharp-lang") ?? "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }, // React already escapes
    react: { useSuspense: false },
  });

export default i18n;

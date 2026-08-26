import type { Language } from "@/lib/context/LanguageContext";

export const accessDeniedTranslations = {
  en: {
    title: "Access Denied",
    description: "Your account does not have permission to view this page.",
    backToLogin: "Back to Login",
  },
  sw: {
    title: "Ufikiaji Umekataliwa",
    description: "Akaunti yako haina ruhusa ya kuona ukurasa huu.",
    backToLogin: "Rudi Kuingia",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const notFoundTranslations = {
  en: {
    title: "Page Not Found",
    description: "Sorry, the page you are looking for does not exist.",
    goHome: "Go Home",
  },
  sw: {
    title: "Ukurasa Haukupatikana",
    description: "Samahani, ukurasa unaoutafuta haupo.",
    goHome: "Rudi Nyumbani",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const errorPageTranslations = {
  en: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    tryAgain: "Try Again",
  },
  sw: {
    title: "Hitilafu imetokea",
    description: "Hitilafu isiyotarajiwa imetokea. Tafadhali jaribu tena.",
    tryAgain: "Jaribu Tena",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const loadingPageTranslations = {
  en: {
    title: "Loading HSIMS...",
    description: "Please wait a moment.",
  },
  sw: {
    title: "Inapakia HSIMS...",
    description: "Tafadhali subiri kidogo.",
  },
} as const satisfies Record<Language, Record<string, string>>;

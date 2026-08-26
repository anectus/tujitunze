import type { Language } from "@/lib/context/LanguageContext";

export const memberVerificationsTranslations = {
  en: {
    heading: "Hospital Verification",
    subtitle: "A record of every time a hospital verified your membership at check-in.",
    noVerifications: "No hospital has verified your membership yet.",
    noVerificationsHelp: "This fills in the first time you check in at a partner hospital.",
    date: "Date",
    hospital: "Hospital",
    method: "Method",
    result: "Result",
    remarks: "Remarks",
    errorFallback: "Unable to load verification history.",
  },
  sw: {
    heading: "Uthibitisho wa Hospitali",
    subtitle: "Kumbukumbu ya kila mara hospitali ilipothibitisha uanachama wako wakati wa kuingia.",
    noVerifications: "Hakuna hospitali iliyothibitisha uanachama wako bado.",
    noVerificationsHelp: "Hii itajazwa mara ya kwanza utakapoingia kwenye hospitali mshirika.",
    date: "Tarehe",
    hospital: "Hospitali",
    method: "Njia",
    result: "Matokeo",
    remarks: "Maoni",
    errorFallback: "Imeshindwa kupakia historia ya uthibitisho.",
  },
} as const satisfies Record<Language, Record<string, string>>;

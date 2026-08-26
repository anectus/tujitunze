import type { Language } from "@/lib/context/LanguageContext";

export const memberInsurancePlansTranslations = {
  en: {
    heading: "My Insurance",
    viewClaims: "View claims →",
    noPolicy: "You have no insurance policy on file.",
    provider: "Provider",
    plan: "Plan",
    policyNumber: "Policy #",
    coverage: "Coverage",
    status: "Status",
    errorFallback: "Unable to load your insurance.",
  },
  sw: {
    heading: "Bima Yangu",
    viewClaims: "Angalia madai →",
    noPolicy: "Huna sera ya bima kwenye kumbukumbu.",
    provider: "Mtoa Huduma",
    plan: "Mpango",
    policyNumber: "Namba ya Sera",
    coverage: "Kiwango cha Ulinzi",
    status: "Hali",
    errorFallback: "Imeshindwa kupakia bima yako.",
  },
} as const satisfies Record<Language, Record<string, string>>;

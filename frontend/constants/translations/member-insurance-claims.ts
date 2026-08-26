import type { Language } from "@/lib/context/LanguageContext";

export const memberInsuranceClaimsTranslations = {
  en: {
    heading: "Insurance Claims",
    viewInsurance: "View my insurance →",
    noClaims: "You have no claims on file.",
    noClaimsHelp: "A claim appears here once a partner hospital submits one on your behalf.",
    date: "Date",
    hospital: "Hospital",
    claimNumber: "Claim #",
    amount: "Amount",
    approved: "Approved",
    status: "Status",
    errorFallback: "Unable to load your claims.",
  },
  sw: {
    heading: "Madai ya Bima",
    viewInsurance: "Angalia bima yangu →",
    noClaims: "Huna madai kwenye kumbukumbu.",
    noClaimsHelp: "Dai litaonekana hapa mara hospitali mshirika itakapowasilisha kwa niaba yako.",
    date: "Tarehe",
    hospital: "Hospitali",
    claimNumber: "Namba ya Dai",
    amount: "Kiasi",
    approved: "Kilichoidhinishwa",
    status: "Hali",
    errorFallback: "Imeshindwa kupakia madai yako.",
  },
} as const satisfies Record<Language, Record<string, string>>;

import type { Language } from "@/lib/context/LanguageContext";

export const insuranceDashboardTranslations = {
  en: {
    title: "Insurance Dashboard",
    loading: "Loading dashboard...",
    errorFallback: "Unable to load the dashboard.",
    plans: "Plans",
    activePolicies: "Active Policies",
    totalClaims: "Total Claims",
    pendingClaims: "Pending Claims",
    colClaimNumber: "Claim Number",
    colAmount: "Amount",
    colStatus: "Status",
    colDate: "Date",
    noClaimsRouted: "No claims routed yet.",
  },
  sw: {
    title: "Dashibodi ya Bima",
    loading: "Inapakia dashibodi...",
    errorFallback: "Imeshindwa kupakia dashibodi.",
    plans: "Mipango",
    activePolicies: "Sera Hai",
    totalClaims: "Jumla ya Madai",
    pendingClaims: "Madai Yanayosubiri",
    colClaimNumber: "Namba ya Dai",
    colAmount: "Kiasi",
    colStatus: "Hali",
    colDate: "Tarehe",
    noClaimsRouted: "Hakuna madai yaliyoelekezwa bado.",
  },
} as const satisfies Record<Language, Record<string, string>>;

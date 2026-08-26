import type { Language } from "@/lib/context/LanguageContext";

export const adminDashboardTranslations = {
  en: {
    title: "Admin Dashboard",
    loading: "Loading dashboard...",
    errorFallback: "Unable to load the dashboard.",
    totalMembers: "Total Members",
    activeMembers: "Active Members",
    pendingMembers: "Pending Members",
    auditLogEntries24h: "Audit Log Entries (24h)",
  },
  sw: {
    title: "Dashibodi ya Msimamizi",
    loading: "Inapakia dashibodi...",
    errorFallback: "Imeshindwa kupakia dashibodi.",
    totalMembers: "Jumla ya Wanachama",
    activeMembers: "Wanachama Hai",
    pendingMembers: "Wanachama Wanaosubiri",
    auditLogEntries24h: "Kumbukumbu za Ukaguzi (Masaa 24)",
  },
} as const satisfies Record<Language, Record<string, string>>;

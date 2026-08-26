import type { Language } from "@/lib/context/LanguageContext";

export const adminMembersTranslations = {
  en: {
    title: "Members",
    subtitle: "Operational oversight of registered Tujitunze members.",
    loadError: "Unable to load members.",
    loading: "Loading members...",
    empty: "No members registered yet.",
    updateStatusError: "Unable to update status.",
    colName: "Name",
    colNida: "NIDA Number",
    colEmail: "Email",
    colStatus: "Status",
    colChangeStatus: "Change Status",
  },
  sw: {
    title: "Wanachama",
    subtitle: "Usimamizi wa uendeshaji wa wanachama waliosajiliwa wa Tujitunze.",
    loadError: "Imeshindwa kupakia wanachama.",
    loading: "Inapakia wanachama...",
    empty: "Hakuna wanachama waliosajiliwa bado.",
    updateStatusError: "Imeshindwa kubadilisha hali.",
    colName: "Jina",
    colNida: "Namba ya NIDA",
    colEmail: "Barua Pepe",
    colStatus: "Hali",
    colChangeStatus: "Badilisha Hali",
  },
} as const satisfies Record<Language, Record<string, string>>;

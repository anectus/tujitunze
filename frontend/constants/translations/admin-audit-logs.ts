import type { Language } from "@/lib/context/LanguageContext";

export const adminAuditLogsTranslations = {
  en: {
    title: "Audit Logs",
    subtitle:
      "A record of sensitive writes across the platform — phone number and bank account linking, password changes, and Admin actions on member accounts.",
    loadError: "Unable to load audit logs.",
    loading: "Loading audit logs...",
    empty: "No audit log entries yet.",
    colWhen: "When",
    colAction: "Action",
    colTable: "Table",
    colRecordId: "Record ID",
    colActor: "Actor (User ID)",
    colIpAddress: "IP Address",
    colChange: "Change",
  },
  sw: {
    title: "Kumbukumbu za Ukaguzi",
    subtitle:
      "Kumbukumbu ya maandiko nyeti kote kwenye mfumo — kuunganisha namba za simu na akaunti za benki, mabadiliko ya nywila, na vitendo vya Msimamizi kwenye akaunti za wanachama.",
    loadError: "Imeshindwa kupakia kumbukumbu za ukaguzi.",
    loading: "Inapakia kumbukumbu za ukaguzi...",
    empty: "Hakuna kumbukumbu za ukaguzi bado.",
    colWhen: "Wakati",
    colAction: "Kitendo",
    colTable: "Jedwali",
    colRecordId: "Kitambulisho cha Rekodi",
    colActor: "Mtekelezaji (Kitambulisho cha Mtumiaji)",
    colIpAddress: "Anwani ya IP",
    colChange: "Mabadiliko",
  },
} as const satisfies Record<Language, Record<string, string>>;

import type { Language } from "@/lib/context/LanguageContext";

export const telecomAuditLogsTranslations = {
  en: {
    headerTitle: "Audit & Security",
    loadError: "Unable to load audit logs.",
    activityLogsHeading: "Activity Logs & Security Events",
    noActivity: "No activity recorded yet.",
    action: "Action",
    table: "Table",
    ipAddress: "IP Address",
    date: "Date",
    apiAccessLogsHeading: "API Access Logs",
    noApiActivity: "No API activity recorded yet.",
    event: "Event",
    endpoint: "Endpoint",
    result: "Result",
    success: "Success",
    failed: "Failed",
    authLogsHeading: "Authentication Logs",
    authLogsBody:
      "Coming soon — login attempts aren't tracked anywhere in the system yet (the `sessions` table exists in the schema but nothing writes to it), so there's nothing telecom-specific to show here until that's built.",
  },
  sw: {
    headerTitle: "Ukaguzi na Usalama",
    loadError: "Imeshindwa kupakia kumbukumbu za ukaguzi.",
    activityLogsHeading: "Kumbukumbu za Shughuli na Matukio ya Usalama",
    noActivity: "Hakuna shughuli iliyorekodiwa bado.",
    action: "Kitendo",
    table: "Jedwali",
    ipAddress: "Anwani ya IP",
    date: "Tarehe",
    apiAccessLogsHeading: "Kumbukumbu za Ufikiaji wa API",
    noApiActivity: "Hakuna shughuli ya API iliyorekodiwa bado.",
    event: "Tukio",
    endpoint: "Kituo",
    result: "Matokeo",
    success: "Imefanikiwa",
    failed: "Imeshindwa",
    authLogsHeading: "Kumbukumbu za Uthibitishaji",
    authLogsBody:
      "Inakuja hivi karibuni — majaribio ya kuingia hayafuatiliwi popote kwenye mfumo bado (jedwali la `sessions` lipo kwenye muundo lakini hakuna kinachoandika kwenye hilo), hivyo hakuna kitu maalum cha simu cha kuonyesha hapa mpaka hilo litakapojengwa.",
  },
} as const satisfies Record<Language, Record<string, string>>;

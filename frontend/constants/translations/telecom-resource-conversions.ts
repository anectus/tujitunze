import type { Language } from "@/lib/context/LanguageContext";

export const telecomResourceConversionsTranslations = {
  en: {
    headerTitle: "Resource Conversions",
    subtitle:
      "Principle 1 of the micro-savings engine: a share of each bundle conversion is held back and credited to the member's Health Wallet.",
    loadError: "Unable to load resource conversions.",
    filterAll: "All",
    filterSuccessful: "Successful",
    filterPendingReview: "Pending Review",
    filterFailed: "Failed",
    statVoice: "Voice saved (TSh)",
    statData: "Data saved (TSh)",
    statSms: "SMS saved (TSh)",
    statSuccessful: "Successful",
    statPendingReview: "Pending Review",
    resourceType: "Resource",
    grossUnits: "Gross Units",
    savedUnits: "Saved Units",
    netToCustomer: "Net to Customer",
    savedValue: "Saved Value",
    dateTime: "Date & Time",
    emptyTitle: "No resource conversions yet",
    emptyBody:
      "Once your bundle-provisioning system starts calling the resource-conversion webhook, they'll show up here.",
    previous: "Previous",
    next: "Next",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  },
  sw: {
    headerTitle: "Ubadilishaji wa Rasilimali",
    subtitle:
      "Kanuni ya 1 ya mfumo wa akiba: sehemu ya kila ubadilishaji wa bando hutunzwa na kuwekwa kwenye Mkoba wa Afya wa mwanachama.",
    loadError: "Imeshindwa kupakia ubadilishaji wa rasilimali.",
    filterAll: "Zote",
    filterSuccessful: "Zilizofanikiwa",
    filterPendingReview: "Zinasubiri Ukaguzi",
    filterFailed: "Zilizoshindwa",
    statVoice: "Sauti iliyowekwa akiba (TSh)",
    statData: "Data iliyowekwa akiba (TSh)",
    statSms: "SMS iliyowekwa akiba (TSh)",
    statSuccessful: "Zilizofanikiwa",
    statPendingReview: "Zinasubiri Ukaguzi",
    resourceType: "Rasilimali",
    grossUnits: "Kiasi Chote",
    savedUnits: "Kiasi Kilichowekwa Akiba",
    netToCustomer: "Kilichopokelewa na Mteja",
    savedValue: "Thamani Iliyowekwa Akiba",
    dateTime: "Tarehe na Saa",
    emptyTitle: "Hakuna ubadilishaji wa rasilimali bado",
    emptyBody:
      "Mfumo wako wa bando utakapoanza kuita webhook ya ubadilishaji wa rasilimali, itaonekana hapa.",
    previous: "Iliyotangulia",
    next: "Ifuatayo",
    pageOf: (page: number, total: number) => `Ukurasa ${page} kati ya ${total}`,
  },
} as const satisfies Record<
  Language,
  {
    headerTitle: string;
    subtitle: string;
    loadError: string;
    filterAll: string;
    filterSuccessful: string;
    filterPendingReview: string;
    filterFailed: string;
    statVoice: string;
    statData: string;
    statSms: string;
    statSuccessful: string;
    statPendingReview: string;
    resourceType: string;
    grossUnits: string;
    savedUnits: string;
    netToCustomer: string;
    savedValue: string;
    dateTime: string;
    emptyTitle: string;
    emptyBody: string;
    previous: string;
    next: string;
    pageOf: (page: number, total: number) => string;
  }
>;

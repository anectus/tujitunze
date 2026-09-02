import type { Language } from "@/lib/context/LanguageContext";

export const memberSavingsTranslations = {
  en: {
    title: "Micro-Savings",
    subtitle:
      "Automatic savings from your everyday telecom and mobile-money activity — no separate deposit needed.",
    loadError: "Unable to load your savings summary.",
    totalSaved: "Total Saved",
    resourceConversion: "From Bundle Conversions",
    resourceConversionHint: "A share of each voice/data/SMS bundle you buy",
    transactionDiversion: "From Outgoing Transactions",
    transactionDiversionHint: "A share of your Tuma, Lipa Namba, Toa & bill payments",
    recentTitle: "Recent Saving Events",
    emptyTitle: "No savings yet",
    emptyBody:
      "Once your telecom operator reports a bundle conversion or an outgoing transaction, it will show up here.",
    resourceLabel: "Bundle conversion",
    transactionLabel: "Transaction diversion",
  },
  sw: {
    title: "Akiba Ndogo",
    subtitle:
      "Akiba ya moja kwa moja kutoka kwenye matumizi yako ya kila siku ya simu na pesa za simu — hakuna amana ya ziada inayohitajika.",
    loadError: "Imeshindwa kupakia muhtasari wa akiba yako.",
    totalSaved: "Jumla ya Akiba",
    resourceConversion: "Kutoka Ubadilishaji wa Bando",
    resourceConversionHint: "Sehemu ya kila bando la sauti/data/SMS unalonunua",
    transactionDiversion: "Kutoka Miamala ya Kutoka",
    transactionDiversionHint: "Sehemu ya Tuma, Lipa Namba, Toa na malipo ya bili",
    recentTitle: "Matukio ya Hivi Karibuni ya Akiba",
    emptyTitle: "Bado hakuna akiba",
    emptyBody:
      "Mtoa huduma wako wa simu atakapotoa taarifa ya ubadilishaji wa bando au muamala wa kutoka, itaonekana hapa.",
    resourceLabel: "Ubadilishaji wa bando",
    transactionLabel: "Uelekezaji wa muamala",
  },
} as const satisfies Record<
  Language,
  {
    title: string;
    subtitle: string;
    loadError: string;
    totalSaved: string;
    resourceConversion: string;
    resourceConversionHint: string;
    transactionDiversion: string;
    transactionDiversionHint: string;
    recentTitle: string;
    emptyTitle: string;
    emptyBody: string;
    resourceLabel: string;
    transactionLabel: string;
  }
>;

import type { Language } from "@/lib/context/LanguageContext";

export const superAdminSavingRulesTranslations = {
  en: {
    title: "Saving Rules",
    subtitle:
      "Configures the rates behind both principles of the micro-savings engine — Resource Conversion (telecom bundles) and Transaction Diversion (Tuma / Lipa Namba / Toa / Bill Payment). Every purchase-based contribution rule (Airtime, Data Bundle, etc.) is unaffected and stays read-only.",
    resourceConversionHeading: "Resource Conversion",
    transactionDiversionHeading: "Transaction Diversion",
    transactionDiversionNote:
      "These start inactive — funding_source assumes a revenue-share agreement with the relevant switch/operator that doesn't exist yet. Only turn one on once that agreement is real.",
    createTitle: "Add a Rule",
    createSubtitle:
      "Only needed if a rule was deleted or a new resource/transaction type is added later — the standard set is already seeded.",
    principle: "Principle",
    ruleType: "Rule Type",
    ratePercent: "Rate (%)",
    minimumAmount: "Minimum Amount",
    active: "Active",
    inactive: "Inactive",
    save: "Save",
    saving: "Saving...",
    creating: "Creating...",
    createButton: "Create Rule",
    loadError: "Unable to load saving rules.",
    createError: "Unable to create this rule.",
    saveError: "Unable to save this rule.",
    loading: "Loading...",
    channel: "Channel",
    lastUpdated: "Effective from",
  },
  sw: {
    title: "Kanuni za Akiba",
    subtitle:
      "Inasimamia viwango vya kanuni zote mbili za mfumo wa akiba — Ubadilishaji wa Rasilimali (bando za simu) na Uelekezaji wa Miamala (Tuma / Lipa Namba / Toa / Lipa Bili). Kila kanuni ya mchango wa ununuzi (Muda wa Maongezi, Bando la Data, n.k.) haiathiriwi na inabaki kusomeka tu.",
    resourceConversionHeading: "Ubadilishaji wa Rasilimali",
    transactionDiversionHeading: "Uelekezaji wa Miamala",
    transactionDiversionNote:
      "Hizi huanza zikiwa zimezimwa — funding_source inadhania makubaliano ya mgawanyo wa mapato na mtoa huduma husika ambayo bado hayapo. Washa moja tu makubaliano hayo yatakapokuwa halisi.",
    createTitle: "Ongeza Kanuni",
    createSubtitle:
      "Inahitajika tu kama kanuni ilifutwa au aina mpya ya rasilimali/muamala imeongezwa baadaye — seti ya kawaida tayari imewekwa.",
    principle: "Kanuni",
    ruleType: "Aina ya Kanuni",
    ratePercent: "Kiwango (%)",
    minimumAmount: "Kiasi cha Chini",
    active: "Hai",
    inactive: "Imezimwa",
    save: "Hifadhi",
    saving: "Inahifadhi...",
    creating: "Inaunda...",
    createButton: "Unda Kanuni",
    loadError: "Imeshindwa kupakia kanuni za akiba.",
    createError: "Imeshindwa kuunda kanuni hii.",
    saveError: "Imeshindwa kuhifadhi kanuni hii.",
    loading: "Inapakia...",
    channel: "Kituo",
    lastUpdated: "Inatumika kuanzia",
  },
} as const satisfies Record<
  Language,
  {
    title: string;
    subtitle: string;
    resourceConversionHeading: string;
    transactionDiversionHeading: string;
    transactionDiversionNote: string;
    createTitle: string;
    createSubtitle: string;
    principle: string;
    ruleType: string;
    ratePercent: string;
    minimumAmount: string;
    active: string;
    inactive: string;
    save: string;
    saving: string;
    creating: string;
    createButton: string;
    loadError: string;
    createError: string;
    saveError: string;
    loading: string;
    channel: string;
    lastUpdated: string;
  }
>;

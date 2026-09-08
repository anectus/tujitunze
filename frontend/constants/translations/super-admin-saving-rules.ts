import type { Language } from "@/lib/context/LanguageContext";

export const superAdminSavingRulesTranslations = {
  en: {
    title: "Saving Rules",
    subtitle:
      "Configures the rates behind both principles of the micro-savings engine — Resource Conversion (telecom bundles) and Transaction Diversion (Tuma / Lipa Namba / Toa / Bill Payment). Every purchase-based contribution rule (Airtime, Data Bundle, etc.) is unaffected and stays read-only.",
    resourceConversionHeading: "Resource Conversion",
    resourceConversionNote:
      "These stay active by design — this is the invisible micro-saving mechanic (a bundle purchase splits into net-to-customer + saved-to-wallet). Deactivating one stops all future saving for that resource type with no other warning anywhere in the system.",
    transactionDiversionHeading: "Transaction Diversion",
    transactionDiversionNote:
      "These start inactive — funding_source assumes a revenue-share agreement with the relevant switch/operator that doesn't exist yet. Only turn one on once that agreement is real.",
    deactivateResourceConversionConfirm:
      "Deactivating {ruleType} stops all future micro-savings for that resource type — silently, with no other alert anywhere in the app. Continue?",
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
    resourceConversionNote:
      "Hizi hubaki hai kwa makusudi — huu ndio mfumo wa akiba usioonekana (ununuzi wa bando hugawanyika kuwa kiasi cha mteja + akiba kwenye mkoba). Kuzima moja kunazuia akiba yote ya baadaye kwa aina hiyo ya rasilimali bila onyo lolote jingine popote kwenye mfumo.",
    transactionDiversionHeading: "Uelekezaji wa Miamala",
    transactionDiversionNote:
      "Hizi huanza zikiwa zimezimwa — funding_source inadhania makubaliano ya mgawanyo wa mapato na mtoa huduma husika ambayo bado hayapo. Washa moja tu makubaliano hayo yatakapokuwa halisi.",
    deactivateResourceConversionConfirm:
      "Kuzima {ruleType} kutazuia akiba yote ya baadaye ya aina hiyo ya rasilimali — kimya kimya, bila onyo lingine lolote popote kwenye programu. Endelea?",
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
    resourceConversionNote: string;
    transactionDiversionHeading: string;
    transactionDiversionNote: string;
    deactivateResourceConversionConfirm: string;
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

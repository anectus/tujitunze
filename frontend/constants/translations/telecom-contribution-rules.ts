import type { Language } from "@/lib/context/LanguageContext";

export const telecomContributionRulesTranslations = {
  en: {
    headerTitle: "Contribution Rules",
    readOnlyNote: "Read-only — editing rates is an Admin/Super-admin decision not built yet.",
    loadError: "Unable to load contribution rules.",
    activeRulesHeading: "Active Rules",
    contributionType: "Contribution Type",
    rate: "Rate",
    minimumAmount: "Minimum Amount",
    effectiveDate: "Effective Date",
    ruleHistoryHeading: "Rule History",
  },
  sw: {
    headerTitle: "Kanuni za Michango",
    readOnlyNote: "Kusoma tu — kubadilisha viwango ni uamuzi wa Msimamizi/Msimamizi Mkuu ambao haujajengwa bado.",
    loadError: "Imeshindwa kupakia kanuni za michango.",
    activeRulesHeading: "Kanuni Zinazotumika",
    contributionType: "Aina ya Mchango",
    rate: "Kiwango",
    minimumAmount: "Kiasi cha Chini",
    effectiveDate: "Tarehe ya Kuanza Kutumika",
    ruleHistoryHeading: "Historia ya Kanuni",
  },
} as const satisfies Record<Language, Record<string, string>>;

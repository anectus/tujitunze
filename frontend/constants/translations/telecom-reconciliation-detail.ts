import type { Language } from "@/lib/context/LanguageContext";

export const telecomReconciliationDetailTranslations = {
  en: {
    headerTitle: "Reconciliation Run",
    headerTitleWithId: (runId: number) => `Reconciliation Run #${runId}`,
    backLink: "← Back to Reconciliation",
    loadError: "Unable to load this reconciliation run.",
    uploaded: "Uploaded",
    matched: "Matched",
    unmatched: "Unmatched",
    reference: "Reference",
    amount: "Amount",
    matchedContribution: "Matched Contribution",
    matchStatusMatched: "Matched",
    matchStatusUnmatched: "Unmatched",
  },
  sw: {
    headerTitle: "Mzunguko wa Upatanisho",
    headerTitleWithId: (runId: number) => `Mzunguko wa Upatanisho #${runId}`,
    backLink: "← Rudi kwenye Upatanisho",
    loadError: "Imeshindwa kupakia mzunguko huu wa upatanisho.",
    uploaded: "Zilizopakiwa",
    matched: "Zilizolingana",
    unmatched: "Hazikulingana",
    reference: "Kumbukumbu",
    amount: "Kiasi",
    matchedContribution: "Mchango Uliolingana",
    matchStatusMatched: "Imelingana",
    matchStatusUnmatched: "Haikulingana",
  },
// Interpolation helpers below take varying parameter shapes (number/string) per key,
// which TypeScript's function-parameter contravariance can't unify without `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<Language, Record<string, string | ((...args: any[]) => string)>>;

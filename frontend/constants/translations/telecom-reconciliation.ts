import type { Language } from "@/lib/context/LanguageContext";

export const telecomReconciliationTranslations = {
  en: {
    headerTitle: "Reconciliation",
    uploadHeading: "Upload Telecom Records",
    uploadBody:
      "Paste your own operator-side contribution records (CSV: reference,amount,date) — each row is matched against HSIMS's contribution records by reference and amount.",
    uploadResult: (runId: number, matched: number, unmatched: number, total: number) =>
      `Run #${runId}: ${matched} matched, ${unmatched} unmatched out of ${total}.`,
    validationError: "Paste at least one valid row (reference,amount[,date]).",
    loadError: "Unable to load reconciliation history.",
    runError: "Unable to run reconciliation.",
    runReconciliation: "Run Reconciliation",
    reconciling: "Reconciling...",
    historyHeading: "Reconciliation History",
    noRuns: "No reconciliation runs yet.",
    run: "Run",
    uploaded: "Uploaded",
    matched: "Matched",
    unmatched: "Unmatched",
    date: "Date",
    viewLink: "View →",
  },
  sw: {
    headerTitle: "Upatanisho",
    uploadHeading: "Pakia Kumbukumbu za Simu",
    uploadBody:
      "Bandika kumbukumbu zako za michango kutoka upande wa mtoa huduma (CSV: reference,amount,date) — kila mstari unalinganishwa na kumbukumbu za michango za HSIMS kwa kumbukumbu na kiasi.",
    uploadResult: (runId: number, matched: number, unmatched: number, total: number) =>
      `Mzunguko #${runId}: ${matched} zimelingana, ${unmatched} hazikulingana kati ya ${total}.`,
    validationError: "Bandika angalau mstari mmoja sahihi (reference,amount[,date]).",
    loadError: "Imeshindwa kupakia historia ya upatanisho.",
    runError: "Imeshindwa kuendesha upatanisho.",
    runReconciliation: "Endesha Upatanisho",
    reconciling: "Inapatanisha...",
    historyHeading: "Historia ya Upatanisho",
    noRuns: "Hakuna mizunguko ya upatanisho bado.",
    run: "Mzunguko",
    uploaded: "Zilizopakiwa",
    matched: "Zilizolingana",
    unmatched: "Hazikulingana",
    date: "Tarehe",
    viewLink: "Angalia →",
  },
// Interpolation helpers below take varying parameter shapes (number/string) per key,
// which TypeScript's function-parameter contravariance can't unify without `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<Language, Record<string, string | ((...args: any[]) => string)>>;

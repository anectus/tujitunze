import type { Language } from "@/lib/context/LanguageContext";

export const telecomReportsTranslations = {
  en: {
    headerTitle: "Reports",
    dailyReport: "Daily Report",
    weeklyReport: "Weekly Report",
    monthlyReport: "Monthly Report",
    loadError: "Unable to load reports.",
    contributionReportHeading: "Contribution Report",
    noContributionsPeriod: "No contributions in this period yet.",
    period: "Period",
    transactions: "Transactions",
    total: "Total",
    failedReportHeading: "Failed Transaction Report",
    noFailedOrPending: "No failed or pending transactions.",
    reconciliationReportHeading: "Reconciliation Report",
    reconciliationReportBodyPrefix: "See the",
    reconciliationReportLinkText: "Reconciliation",
    reconciliationReportBodySuffix:
      "page for run-by-run history — a rolled-up trend report over multiple runs isn't built yet.",
  },
  sw: {
    headerTitle: "Ripoti",
    dailyReport: "Ripoti ya Kila Siku",
    weeklyReport: "Ripoti ya Kila Wiki",
    monthlyReport: "Ripoti ya Kila Mwezi",
    loadError: "Imeshindwa kupakia ripoti.",
    contributionReportHeading: "Ripoti ya Michango",
    noContributionsPeriod: "Hakuna michango kwa kipindi hiki bado.",
    period: "Kipindi",
    transactions: "Miamala",
    total: "Jumla",
    failedReportHeading: "Ripoti ya Miamala Iliyoshindwa",
    noFailedOrPending: "Hakuna miamala iliyoshindwa au inayosubiri.",
    reconciliationReportHeading: "Ripoti ya Upatanisho",
    reconciliationReportBodyPrefix: "Angalia ukurasa wa",
    reconciliationReportLinkText: "Upatanisho",
    reconciliationReportBodySuffix:
      "kwa historia ya kila mzunguko — ripoti ya mwelekeo iliyokusanywa kutoka mizunguko mingi haijajengwa bado.",
  },
} as const satisfies Record<Language, Record<string, string>>;

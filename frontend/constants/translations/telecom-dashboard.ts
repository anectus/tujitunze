import type { Language } from "@/lib/context/LanguageContext";

export const telecomDashboardTranslations = {
  en: {
    headerTitle: "Telecom Dashboard",
    loadError: "Unable to load the dashboard.",
    loadingDashboard: "Loading dashboard...",
    totalRegisteredMembers: "Total Registered Members",
    todaysContributions: "Today's Contributions",
    todaysContributionsHint: (count: number) =>
      `${count} transaction${count === 1 ? "" : "s"} today`,
    successfulTransactions: "Successful Transactions",
    pendingTransactions: "Pending Transactions",
    failedTransactions: "Failed Transactions",
    contributionSummary: "Contribution Summary",
    contributionSummaryHint: (total: number, linked: number) =>
      `${total} total, ${linked} linked numbers`,
    reference: "Reference",
    source: "Source",
    amount: "Amount",
    date: "Date",
    noContributionsYet: "No contributions yet.",
  },
  sw: {
    headerTitle: "Dashibodi ya Simu",
    loadError: "Imeshindwa kupakia dashibodi.",
    loadingDashboard: "Inapakia dashibodi...",
    totalRegisteredMembers: "Jumla ya Wanachama Waliosajiliwa",
    todaysContributions: "Michango ya Leo",
    todaysContributionsHint: (count: number) => `Miamala ${count} leo`,
    successfulTransactions: "Miamala Iliyofanikiwa",
    pendingTransactions: "Miamala Inayosubiri",
    failedTransactions: "Miamala Iliyoshindwa",
    contributionSummary: "Muhtasari wa Michango",
    contributionSummaryHint: (total: number, linked: number) =>
      `Jumla ${total}, namba ${linked} zilizounganishwa`,
    reference: "Kumbukumbu",
    source: "Chanzo",
    amount: "Kiasi",
    date: "Tarehe",
    noContributionsYet: "Hakuna michango bado.",
  },
// Interpolation helpers below take varying parameter shapes (number/string) per key,
// which TypeScript's function-parameter contravariance can't unify without `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<Language, Record<string, string | ((...args: any[]) => string)>>;

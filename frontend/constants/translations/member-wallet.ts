import type { Language } from "@/lib/context/LanguageContext";

// Read-only balance view — the Health Wallet only grows through
// deductions from a member's linked telecom/bank accounts, never a
// member-initiated top-up, and funds are never cashed out back to a
// phone or bank account. See app/(member)/wallet/page.tsx.
export const walletPageTranslations = {
  en: {
    title: "Your Wallet",
    descriptionBefore:
      "Save a little at a time, straight from your phone — no bank account needed. Tujitunze is built for the",
    descriptionAfter: ".",
    loadingWallet: "Loading your wallet...",
    availableBalance: "Available Balance",
    wallet: "Wallet",
    fundingNote:
      "Your balance grows automatically from your linked telecom and bank accounts — there's nothing to top up yourself.",
    viewTransactionHistory: "View transaction history →",
    errorFallback: "Unable to load your wallet.",
  },
  sw: {
    title: "Mkoba Wako",
    descriptionBefore:
      "Weka akiba kidogo kwa kidogo, moja kwa moja kutoka simu yako — hauhitaji akaunti ya benki. Tujitunze imeundwa kwa ajili ya",
    descriptionAfter: ".",
    loadingWallet: "Inapakia mkoba wako...",
    availableBalance: "Salio Lililopo",
    wallet: "Mkoba",
    fundingNote:
      "Salio lako huongezeka moja kwa moja kutoka kwenye akaunti zako za simu na benki zilizounganishwa — hakuna unachohitajika kuongeza wewe mwenyewe.",
    viewTransactionHistory: "Angalia historia ya miamala →",
    errorFallback: "Imeshindwa kupakia mkoba wako.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const walletTransactionsTranslations = {
  en: {
    backToWallet: "Back to Wallet",
    title: "Transaction History",
    totalContributed: "Total contributed:",
    loading: "Loading...",
    noTransactionsTitle: "No transactions yet.",
    noTransactionsDescription:
      "Every deduction from your linked telecom or bank accounts, and every insurance payment made from your Health Wallet, will show up here.",
    columnDate: "Date",
    columnDescription: "Description",
    columnReference: "Reference",
    columnType: "Type",
    columnAmount: "Amount",
    previous: "Previous",
    next: "Next",
    pageOfTemplate: "Page {page} of {totalPages}",
    errorFallback: "Unable to load your transactions.",
  },
  sw: {
    backToWallet: "Rudi kwenye Mkoba",
    title: "Historia ya Miamala",
    totalContributed: "Jumla iliyochangwa:",
    loading: "Inapakia...",
    noTransactionsTitle: "Hakuna miamala bado.",
    noTransactionsDescription:
      "Kila upunguzaji kutoka kwenye akaunti zako za simu au benki zilizounganishwa, na kila malipo ya bima kutoka kwenye Mkoba wako wa Afya, itaonekana hapa.",
    columnDate: "Tarehe",
    columnDescription: "Maelezo",
    columnReference: "Kumbukumbu",
    columnType: "Aina",
    columnAmount: "Kiasi",
    previous: "Iliyotangulia",
    next: "Ifuatayo",
    pageOfTemplate: "Ukurasa {page} kati ya {totalPages}",
    errorFallback: "Imeshindwa kupakia miamala yako.",
  },
} as const satisfies Record<Language, Record<string, string>>;

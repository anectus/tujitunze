import type { Language } from "@/lib/context/LanguageContext";

export const telecomOutgoingDiversionsTranslations = {
  en: {
    headerTitle: "Outgoing Diversions",
    subtitle:
      "Principle 2 of the micro-savings engine: a small share of each Tuma / Lipa Namba / Toa / Bill Payment is diverted to the Health Wallet after the transaction settles — never withheld from it.",
    inactiveNotice:
      "Diversion rules are not active yet — every incoming event is acknowledged and skipped until a rate is turned on in Saving Rules.",
    loadError: "Unable to load outgoing diversions.",
    filterAll: "All",
    filterSuccessful: "Successful",
    filterSkipped: "Skipped",
    filterPendingReview: "Pending Review",
    statTuma: "Tuma saved (TSh)",
    statLipaNamba: "Lipa Namba saved (TSh)",
    statToa: "Toa saved (TSh)",
    statBillPayment: "Bill Payment saved (TSh)",
    transactionType: "Type",
    grossAmount: "Transaction Amount",
    savedAmount: "Saved to Wallet",
    dateTime: "Date & Time",
    emptyTitle: "No outgoing diversions yet",
    emptyBody:
      "Once your mobile-money platform starts calling the outgoing-transaction webhook, they'll show up here.",
    previous: "Previous",
    next: "Next",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  },
  sw: {
    headerTitle: "Uelekezaji wa Miamala ya Kutoka",
    subtitle:
      "Kanuni ya 2 ya mfumo wa akiba: sehemu ndogo ya kila Tuma / Lipa Namba / Toa / Lipa Bili huelekezwa kwenye Mkoba wa Afya baada ya muamala kukamilika — haitolewi kutoka kwenye muamala wenyewe.",
    inactiveNotice:
      "Kanuni za uelekezaji bado hazijawashwa — kila tukio linalopokelewa linakubaliwa na kurukwa hadi kiwango kiwashwe kwenye Kanuni za Akiba.",
    loadError: "Imeshindwa kupakia uelekezaji wa miamala ya kutoka.",
    filterAll: "Zote",
    filterSuccessful: "Zilizofanikiwa",
    filterSkipped: "Zilizorukwa",
    filterPendingReview: "Zinasubiri Ukaguzi",
    statTuma: "Tuma iliyowekwa akiba (TSh)",
    statLipaNamba: "Lipa Namba iliyowekwa akiba (TSh)",
    statToa: "Toa iliyowekwa akiba (TSh)",
    statBillPayment: "Lipa Bili iliyowekwa akiba (TSh)",
    transactionType: "Aina",
    grossAmount: "Kiasi cha Muamala",
    savedAmount: "Kilichowekwa Mkobani",
    dateTime: "Tarehe na Saa",
    emptyTitle: "Hakuna uelekezaji bado",
    emptyBody:
      "Mfumo wako wa pesa za simu utakapoanza kuita webhook ya miamala ya kutoka, itaonekana hapa.",
    previous: "Iliyotangulia",
    next: "Ifuatayo",
    pageOf: (page: number, total: number) => `Ukurasa ${page} kati ya ${total}`,
  },
} as const satisfies Record<
  Language,
  {
    headerTitle: string;
    subtitle: string;
    inactiveNotice: string;
    loadError: string;
    filterAll: string;
    filterSuccessful: string;
    filterSkipped: string;
    filterPendingReview: string;
    statTuma: string;
    statLipaNamba: string;
    statToa: string;
    statBillPayment: string;
    transactionType: string;
    grossAmount: string;
    savedAmount: string;
    dateTime: string;
    emptyTitle: string;
    emptyBody: string;
    previous: string;
    next: string;
    pageOf: (page: number, total: number) => string;
  }
>;

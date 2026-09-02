import type { Language } from "@/lib/context/LanguageContext";

export const memberDashboardTranslations = {
  en: {
    loadingDashboard: "Loading your dashboard...",
    welcomeHeading: "Welcome to Tujitunze",
    sections: [
      {
        href: "/profile",
        title: "My Profile",
        description: "Personal information, phone numbers, and bank accounts.",
      },
      {
        href: "/membership",
        title: "My Membership",
        description: "Member ID, status, registration date, and eligibility.",
      },
      {
        href: "/wallet",
        title: "Contribution",
        description: "Make a contribution and see how much you've saved in total.",
      },
      {
        href: "/wallet/transactions",
        title: "Transaction History",
        description: "Every contribution and wallet transaction, filterable.",
      },
      {
        href: "/savings",
        title: "Micro-Savings",
        description: "Automatic savings from bundle purchases and outgoing transactions.",
      },
    ],
  },
  sw: {
    loadingDashboard: "Inapakia dashibodi yako...",
    welcomeHeading: "Karibu Tujitunze",
    sections: [
      {
        href: "/profile",
        title: "Wasifu Wangu",
        description: "Taarifa binafsi, namba za simu, na akaunti za benki.",
      },
      {
        href: "/membership",
        title: "Uanachama Wangu",
        description: "Kitambulisho cha mwanachama, hali, tarehe ya usajili, na ustahiki.",
      },
      {
        href: "/wallet",
        title: "Mchango",
        description: "Fanya mchango na uone kiasi ulichoweka akiba kwa jumla.",
      },
      {
        href: "/wallet/transactions",
        title: "Historia ya Miamala",
        description: "Kila mchango na muamala wa mkoba, unaoweza kuchujwa.",
      },
      {
        href: "/savings",
        title: "Akiba Ndogo",
        description: "Akiba ya moja kwa moja kutoka ununuzi wa bando na miamala ya kutoka.",
      },
    ],
  },
} as const satisfies Record<
  Language,
  {
    loadingDashboard: string;
    welcomeHeading: string;
    sections: { href: string; title: string; description: string }[];
  }
>;

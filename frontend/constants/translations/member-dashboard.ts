import type { Language } from "@/lib/context/LanguageContext";

export const memberDashboardTranslations = {
  en: {
    loadingDashboard: "Loading your dashboard...",
    welcomeHeading: "Welcome to Tujitunze",
    breadcrumbCurrent: "Dashboard",
    overviewHeading: "Overview",
    noActivePolicy: "Not enrolled yet",
    comingSoon: "Coming soon",
    unreadTemplate: "{count} unread",
    allCaughtUp: "All caught up",
    cards: [
      {
        href: "/wallet",
        title: "Wallet",
        subtitle: "Your Health Wallet balance and transaction history.",
      },
      {
        href: "/insurance/plans",
        title: "Insurance",
        subtitle: "Your active policy and coverage details.",
      },
      {
        href: "/savings",
        title: "Savings",
        subtitle: "Automatic micro-savings from your contributions.",
      },
      {
        href: "/telecom",
        title: "Telecom",
        subtitle: "Airtime, data bundles, and telecom payments.",
      },
      {
        href: "/notifications",
        title: "Notifications",
        subtitle: "Account activity and updates.",
      },
    ],
  },
  sw: {
    loadingDashboard: "Inapakia dashibodi yako...",
    welcomeHeading: "Karibu Tujitunze",
    breadcrumbCurrent: "Dashibodi",
    overviewHeading: "Muhtasari",
    noActivePolicy: "Bado hujajiunga",
    comingSoon: "Inakuja hivi karibuni",
    unreadTemplate: "Arifa {count} mpya",
    allCaughtUp: "Hakuna jipya",
    cards: [
      {
        href: "/wallet",
        title: "Mkoba",
        subtitle: "Salio la Mkoba wako wa Afya na historia ya miamala.",
      },
      {
        href: "/insurance/plans",
        title: "Bima",
        subtitle: "Sera yako inayoendelea na maelezo ya ufunikaji.",
      },
      {
        href: "/savings",
        title: "Akiba",
        subtitle: "Akiba ya moja kwa moja kutoka kwenye michango yako.",
      },
      {
        href: "/telecom",
        title: "Simu",
        subtitle: "Muda wa maongezi, vifurushi vya data, na malipo ya simu.",
      },
      {
        href: "/notifications",
        title: "Arifa",
        subtitle: "Shughuli na taarifa za akaunti yako.",
      },
    ],
  },
} as const satisfies Record<
  Language,
  {
    loadingDashboard: string;
    welcomeHeading: string;
    breadcrumbCurrent: string;
    overviewHeading: string;
    noActivePolicy: string;
    comingSoon: string;
    unreadTemplate: string;
    allCaughtUp: string;
    cards: { href: string; title: string; subtitle: string }[];
  }
>;

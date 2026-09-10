import type { Language } from "@/lib/context/LanguageContext";

export const memberDashboardTranslations = {
  en: {
    loadingDashboard: "Loading your dashboard...",
    membershipVerifiedToast: "Membership verified successfully!",
    welcomeHeading: "Welcome to Tujitunze",
    breadcrumbCurrent: "Dashboard",
    noActivePolicy: "Not enrolled yet",
    comingSoon: "Coming soon",
    unreadTemplate: "{count} unread",
    allCaughtUp: "All caught up",
    quickAccessHeading: "Quick Access",
    quickAccessSubtitle:
      "Jump straight to your insurance, savings, and notifications.",
    viewDetails: "View Details",
    savingsProgressTemplate:
      "{percent}% of your wallet balance built from automatic micro-savings",
    cards: [
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
        href: "/notifications",
        title: "Notifications",
        subtitle: "Account activity and updates.",
      },
    ],
  },
  sw: {
    loadingDashboard: "Inapakia dashibodi yako...",
    membershipVerifiedToast: "Uanachama umethibitishwa kwa mafanikio!",
    welcomeHeading: "Karibu Tujitunze",
    breadcrumbCurrent: "Dashibodi",
    noActivePolicy: "Bado hujajiunga",
    comingSoon: "Inakuja hivi karibuni",
    unreadTemplate: "Arifa {count} mpya",
    allCaughtUp: "Hakuna jipya",
    quickAccessHeading: "Ufikiaji wa Haraka",
    quickAccessSubtitle:
      "Nenda moja kwa moja kwenye bima, akiba, na arifa zako.",
    viewDetails: "Angalia Maelezo",
    savingsProgressTemplate:
      "{percent}% ya salio la mkoba wako limetokana na akiba ya kiotomatiki",
    cards: [
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
    membershipVerifiedToast: string;
    welcomeHeading: string;
    breadcrumbCurrent: string;
    noActivePolicy: string;
    comingSoon: string;
    unreadTemplate: string;
    allCaughtUp: string;
    quickAccessHeading: string;
    quickAccessSubtitle: string;
    viewDetails: string;
    savingsProgressTemplate: string;
    cards: { href: string; title: string; subtitle: string }[];
  }
>;

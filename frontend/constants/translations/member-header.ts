import type { Language } from "@/lib/context/LanguageContext";

// Member-only strings for DashboardHeader.tsx's notifications bell and
// "Complete Membership" nudge — everything else in that header (title,
// account menu, log out) is already covered by commonTranslations, shared
// across every role that mounts DashboardHeader.
export const memberHeaderTranslations = {
  en: {
    completeMembership: "Complete Membership",
    unreadNotifications: "unread notifications",
  },
  sw: {
    completeMembership: "Kamilisha Usajili",
    unreadNotifications: "arifa mpya",
  },
} as const satisfies Record<Language, Record<string, string>>;

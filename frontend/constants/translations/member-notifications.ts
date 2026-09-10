import type { Language } from "@/lib/context/LanguageContext";

export const memberNotificationsTranslations = {
  en: {
    heading: "Notifications",
    markAllAsRead: "Mark all as read",
    noNotificationsYet: "No notifications yet.",
    noNotificationsHelp: "Contributions, membership updates, and account activity will show up here.",
    markRead: "Mark read",
    errorFallback: "Unable to load notifications.",
    deleteConfirmTitle: "Delete notification?",
    deleteConfirmMessageTemplate: "Are you sure you want to delete “{title}”? This can't be undone.",
    deleting: "Deleting...",
    deleteErrorFallback: "Unable to delete this notification. Please try again.",
  },
  sw: {
    heading: "Arifa",
    markAllAsRead: "Weka zote kama zimesomwa",
    noNotificationsYet: "Bado hakuna arifa.",
    noNotificationsHelp: "Michango, masasisho ya uanachama, na shughuli za akaunti zitaonekana hapa.",
    markRead: "Weka kama imesomwa",
    errorFallback: "Imeshindwa kupakia arifa.",
    deleteConfirmTitle: "Futa arifa?",
    deleteConfirmMessageTemplate: "Una uhakika unataka kufuta “{title}”? Hatua hii haiwezi kutenduliwa.",
    deleting: "Inafuta...",
    deleteErrorFallback: "Imeshindwa kufuta arifa hii. Tafadhali jaribu tena.",
  },
} as const satisfies Record<Language, Record<string, string>>;

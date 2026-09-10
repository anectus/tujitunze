import type { Language } from "@/lib/context/LanguageContext";

// One entry per ComingSoonPage caller in the Member route group.
export const comingSoonTranslations = {
  en: {
    qr: {
      title: "My QR Code",
      description:
        "A scannable QR code for fast identity and membership verification will appear here.",
    },
  },
  sw: {
    qr: {
      title: "Msimbo Wangu wa QR",
      description:
        "Msimbo wa QR unaosomeka kwa haraka wa kuthibitisha utambulisho na uanachama utaonekana hapa.",
    },
  },
} as const satisfies Record<
  Language,
  Record<string, { title: string; description: string; backLabel?: string }>
>;

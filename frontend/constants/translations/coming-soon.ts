import type { Language } from "@/lib/context/LanguageContext";

// One entry per ComingSoonPage caller in the Member route group.
export const comingSoonTranslations = {
  en: {
    hospitalAppointments: {
      title: "Appointments",
      description:
        "Book and track appointments with hospitals in the Tujitunze network.",
      backLabel: "Back to Hospitals",
    },
    qr: {
      title: "My QR Code",
      description:
        "A scannable QR code for fast hospital check-in and identity verification will appear here.",
    },
    reports: {
      title: "Reports",
      description:
        "A summary of your contributions, claims, and wallet activity over time will appear here.",
    },
    telecomAirtime: {
      title: "Buy Airtime",
      description:
        "Purchase airtime here once telecom purchases are wired up — a small levy from each purchase feeds your Health Wallet automatically.",
      backLabel: "Back to Telecom",
    },
    telecomBundles: {
      title: "Data Bundles",
      description:
        "Purchase data bundles here once telecom purchases are wired up — a small levy from each purchase feeds your Health Wallet automatically.",
      backLabel: "Back to Telecom",
    },
    telecom: {
      title: "Telecom",
      description:
        "Buy airtime and data bundles, and see how much of each purchase's micro-levy went into your Health Wallet.",
    },
    telecomPayments: {
      title: "Telecom Payments",
      description:
        "A history of your airtime, data bundle, and other telecom purchases will appear here.",
      backLabel: "Back to Telecom",
    },
    walletTransfer: {
      title: "Transfer",
      description:
        "Transferring funds from your Main Wallet to your Health Wallet, or to another member, will be available here.",
      backLabel: "Back to Wallet",
    },
    walletWithdraw: {
      title: "Withdraw",
      description:
        "Withdrawing from your Health Wallet back to mobile money or a bank account will be available here.",
      backLabel: "Back to Wallet",
    },
  },
  sw: {
    hospitalAppointments: {
      title: "Miadi",
      description:
        "Panga na fuatilia miadi na hospitali zilizo kwenye mtandao wa Tujitunze.",
      backLabel: "Rudi kwa Hospitali",
    },
    qr: {
      title: "Msimbo Wangu wa QR",
      description:
        "Msimbo wa QR unaosomeka kwa haraka wa kuingia hospitalini na kuthibitisha utambulisho utaonekana hapa.",
    },
    reports: {
      title: "Ripoti",
      description:
        "Muhtasari wa michango yako, madai, na shughuli za mkoba kwa muda utaonekana hapa.",
    },
    telecomAirtime: {
      title: "Nunua Muda wa Maongezi",
      description:
        "Nunua muda wa maongezi hapa mara mfumo wa manunuzi ya simu utakapowekwa — ada ndogo kutoka kila manunuzi itaingia moja kwa moja kwenye Mkoba wako wa Afya.",
      backLabel: "Rudi kwa Simu",
    },
    telecomBundles: {
      title: "Vifurushi vya Data",
      description:
        "Nunua vifurushi vya data hapa mara mfumo wa manunuzi ya simu utakapowekwa — ada ndogo kutoka kila manunuzi itaingia moja kwa moja kwenye Mkoba wako wa Afya.",
      backLabel: "Rudi kwa Simu",
    },
    telecom: {
      title: "Simu",
      description:
        "Nunua muda wa maongezi na vifurushi vya data, na uone ni kiasi gani cha ada ndogo ya kila ununuzi kimeingia kwenye Mkoba wako wa Afya.",
    },
    telecomPayments: {
      title: "Malipo ya Simu",
      description:
        "Historia ya manunuzi yako ya muda wa maongezi, vifurushi vya data, na manunuzi mengine ya simu itaonekana hapa.",
      backLabel: "Rudi kwa Simu",
    },
    walletTransfer: {
      title: "Hamisha",
      description:
        "Kuhamisha fedha kutoka kwenye Mkoba wako Mkuu kwenda Mkoba wa Afya, au kwa mwanachama mwingine, kutapatikana hapa.",
      backLabel: "Rudi kwenye Mkoba",
    },
    walletWithdraw: {
      title: "Toa Fedha",
      description:
        "Kutoa fedha kutoka Mkoba wako wa Afya kurudi kwenye pesa za simu au akaunti ya benki kutapatikana hapa.",
      backLabel: "Rudi kwenye Mkoba",
    },
  },
} as const satisfies Record<
  Language,
  Record<string, { title: string; description: string; backLabel?: string }>
>;

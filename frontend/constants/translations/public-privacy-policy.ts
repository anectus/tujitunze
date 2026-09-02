import type { Language } from "@/lib/context/LanguageContext";

export const privacyPolicyTranslations = {
  en: {
    heading: "Privacy Policy",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "September 2026",
    intro:
      "Tujitunze (Health Savings and Insurance Management System) is built to handle national ID (NIDA) numbers, health records, and financial transactions on behalf of our members. This policy explains what we collect, why, and how it is protected.",
    sections: [
      {
        title: "Information We Collect",
        body: "To create and operate your account we collect identity information (full name, NIDA number, date of birth, contact details), financial information (wallet balance, telecom contributions, linked bank accounts, transaction history), and health-related information (insurance plans, claims, hospital verification records) tied to your membership.",
      },
      {
        title: "How We Use Your Information",
        body: "Your information is used to verify your identity, operate your health wallet and insurance coverage, process contributions made through telecom and bank partners, allow partner hospitals to verify your membership at the point of care, and maintain the audit trail required for a financial and health-records system.",
      },
      {
        title: "Who Can Access Your Data",
        body: "Access is role-based: Tujitunze staff, partner hospitals, banks, telecom operators, and insurance providers can only see the data required for their specific role, scoped to their own tenant. Every access to a role-scoped endpoint is authenticated and logged.",
      },
      {
        title: "Data Retention & Security",
        body: "Passwords are stored hashed, never in plain text. Sensitive writes to wallets, claims, and bank accounts are captured in an audit log. We retain your data for as long as your account is active and as required by applicable financial and health-record regulations.",
      },
      {
        title: "Your Rights",
        body: "You may review and update your profile information from your account settings at any time, and may contact us to request further information about the data we hold on you.",
      },
      {
        title: "Contact Us",
        body: "Questions about this policy can be sent to support@tujitunze.com or through the Contact page.",
      },
    ],
  },
  sw: {
    heading: "Sera ya Faragha",
    lastUpdatedLabel: "Ilisasishwa mara ya mwisho",
    lastUpdatedDate: "Septemba 2026",
    intro:
      "Tujitunze (Mfumo wa Akiba ya Afya na Usimamizi wa Bima) umeundwa kushughulikia namba za Kitambulisho cha Taifa (NIDA), taarifa za afya, na miamala ya fedha kwa niaba ya wanachama wetu. Sera hii inaeleza tunachokusanya, kwa nini, na jinsi kinavyolindwa.",
    sections: [
      {
        title: "Taarifa Tunazokusanya",
        body: "Ili kufungua na kuendesha akaunti yako tunakusanya taarifa za utambulisho (jina kamili, namba ya NIDA, tarehe ya kuzaliwa, mawasiliano), taarifa za fedha (salio la mkoba, michango ya simu, akaunti za benki zilizounganishwa, historia ya miamala), na taarifa zinazohusiana na afya (mipango ya bima, madai, rekodi za uthibitisho wa hospitali) zinazohusiana na uanachama wako.",
      },
      {
        title: "Jinsi Tunavyotumia Taarifa Zako",
        body: "Taarifa zako hutumika kuthibitisha utambulisho wako, kuendesha mkoba wako wa afya na huduma za bima, kuchakata michango inayofanywa kupitia washirika wa simu na benki, kuruhusu hospitali washirika kuthibitisha uanachama wako wakati wa huduma, na kudumisha kumbukumbu za ukaguzi zinazohitajika kwa mfumo wa fedha na rekodi za afya.",
      },
      {
        title: "Nani Anaweza Kufikia Taarifa Zako",
        body: "Ufikiaji unategemea jukumu: wafanyakazi wa Tujitunze, hospitali washirika, benki, watoa huduma za simu, na watoa bima wanaweza kuona tu taarifa zinazohitajika kwa jukumu lao mahususi. Kila ufikiaji wa taarifa hulindwa na huthibitishwa na kurekodiwa.",
      },
      {
        title: "Uhifadhi na Usalama wa Taarifa",
        body: "Nywila huhifadhiwa kwa njia iliyosimbwa, hazihifadhiwi kama maandishi wazi. Maandiko nyeti kwenye mikoba, madai, na akaunti za benki hurekodiwa kwenye kumbukumbu ya ukaguzi. Tunahifadhi taarifa zako kadri akaunti yako inavyoendelea kuwa hai na kama inavyohitajika na kanuni za fedha na rekodi za afya zinazotumika.",
      },
      {
        title: "Haki Zako",
        body: "Unaweza kukagua na kusasisha taarifa za wasifu wako kutoka kwenye mipangilio ya akaunti yako wakati wowote, na unaweza kuwasiliana nasi kuomba taarifa zaidi kuhusu data tunayoihifadhi kukuhusu.",
      },
      {
        title: "Wasiliana Nasi",
        body: "Maswali kuhusu sera hii yanaweza kutumwa kwa support@tujitunze.com au kupitia ukurasa wa Wasiliana Nasi.",
      },
    ],
  },
} as const satisfies Record<
  Language,
  {
    heading: string;
    lastUpdatedLabel: string;
    lastUpdatedDate: string;
    intro: string;
    sections: { title: string; body: string }[];
  }
>;

import type { Language } from "@/lib/context/LanguageContext";

// Deliberately scoped to what this system actually does today, not
// aspirational compliance claims — see CLAUDE.md's Known Security Gaps
// for the source of truth this stays in sync with. No TLS/ISO 27001/
// penetration-test/regulator-supervision claims: none of those are true
// yet, and a privacy policy is a legal document, not marketing copy.
export const privacyPolicyTranslations = {
  en: {
    heading: "Privacy Policy",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "September 2026",
    intro:
      "Tujitunze (Health Savings and Insurance Management System) values your privacy. This policy explains how we collect, use, and protect your information, based on the current system implementation.",
    sections: [
      {
        title: "Information We Collect",
        body: "We collect only the data necessary to operate your account and deliver services: identity information (name, contact details, and membership records); financial information (wallet balances, telecom contributions, linked bank accounts, and transaction history); health information (insurance plan details and claim records); and technical information (device type and usage logs for fraud prevention).",
      },
      {
        title: "How We Use Your Information",
        body: "Your data is used to verify your identity and membership, operate your health wallet and insurance coverage, process contributions through telecom and bank partners, allow your insurance provider to review claims against your coverage, and maintain audit logs for selected write operations (such as contributions and role changes).",
      },
      {
        title: "Security Measures",
        body: "Passwords are hashed using bcrypt and never stored in plain text. Authentication is enforced with JWT tokens and role-based access controls, scoped to your account and role. Webhook secrets are encrypted at rest using AES-256-GCM; other stored data is not encrypted at rest. Audit logs capture sensitive write operations, but not all actions are logged yet. Transport security: the system currently runs on HTTP in development — HTTPS will be required before any production deployment.",
      },
      {
        title: "Data Retention",
        body: "Data is retained while your account is active, or as required by applicable financial and health-record regulations. Logs and records are kept to support system integrity and troubleshooting.",
      },
      {
        title: "Your Rights",
        body: "You may review and update your profile information from your account settings at any time, request correction of inaccurate records, and request deletion of your account, subject to applicable regulatory requirements.",
      },
      {
        title: "Future Improvements",
        body: "We plan to introduce full HTTPS/TLS transport security, expanded audit-log coverage, encryption of wallet and claim data at rest, and formal compliance registration with the relevant regulators.",
      },
      {
        title: "Contact Us",
        body: "For privacy inquiries or data requests, contact tujitunze@gmail.com, call +255 756 801 149, or write to us in Dar es Salaam, Tanzania.",
      },
    ],
  },
  sw: {
    heading: "Sera ya Faragha",
    lastUpdatedLabel: "Ilisasishwa mara ya mwisho",
    lastUpdatedDate: "Septemba 2026",
    intro:
      "Tujitunze (Mfumo wa Akiba ya Afya na Usimamizi wa Bima) unathamini faragha yako. Sera hii inaeleza jinsi tunavyokusanya, kutumia, na kulinda taarifa zako, kulingana na hali halisi ya mfumo kwa sasa.",
    sections: [
      {
        title: "Taarifa Tunazokusanya",
        body: "Tunakusanya tu taarifa zinazohitajika kuendesha akaunti yako na kutoa huduma: taarifa za utambulisho (jina, mawasiliano, na rekodi za uanachama); taarifa za fedha (salio la mkoba, michango ya simu, akaunti za benki zilizounganishwa, na historia ya miamala); taarifa za afya (maelezo ya mipango ya bima na rekodi za madai); na taarifa za kiufundi (aina ya kifaa na kumbukumbu za matumizi kwa ajili ya kuzuia udanganyifu).",
      },
      {
        title: "Jinsi Tunavyotumia Taarifa Zako",
        body: "Taarifa zako hutumika kuthibitisha utambulisho na uanachama wako, kuendesha mkoba wako wa afya na huduma za bima, kuchakata michango kupitia washirika wa simu na benki, kuruhusu mtoa huduma wako wa bima kukagua madai dhidi ya bima yako, na kudumisha kumbukumbu za ukaguzi kwa baadhi ya matendo (kama vile michango na mabadiliko ya majukumu).",
      },
      {
        title: "Hatua za Usalama",
        body: "Nywila husimbwa kwa njia ya bcrypt na hazihifadhiwi kama maandishi wazi kamwe. Uthibitishaji hutekelezwa kwa kutumia tokeni za JWT na udhibiti wa ufikiaji unaotegemea jukumu, ukilenga akaunti na jukumu lako. Siri za webhook husimbwa zikiwa zimehifadhiwa kwa kutumia AES-256-GCM; taarifa nyingine zilizohifadhiwa hazijasimbwa. Kumbukumbu za ukaguzi hurekodi matendo nyeti ya kuandika, lakini si matendo yote yanayorekodiwa bado. Usalama wa usafirishaji: mfumo kwa sasa unafanya kazi kwa HTTP wakati wa maendeleo — HTTPS itahitajika kabla ya matumizi rasmi.",
      },
      {
        title: "Uhifadhi wa Taarifa",
        body: "Taarifa huhifadhiwa wakati akaunti yako inaendelea kuwa hai, au kama inavyohitajika na kanuni husika za fedha na rekodi za afya. Kumbukumbu na rekodi huhifadhiwa ili kusaidia uadilifu wa mfumo na utatuzi wa matatizo.",
      },
      {
        title: "Haki Zako",
        body: "Unaweza kukagua na kusasisha taarifa za wasifu wako kutoka kwenye mipangilio ya akaunti yako wakati wowote, kuomba urekebishaji wa rekodi zisizo sahihi, na kuomba ufutaji wa akaunti yako, kwa kuzingatia matakwa husika ya kikanuni.",
      },
      {
        title: "Maboresho Yajayo",
        body: "Tunapanga kuanzisha usalama kamili wa usafirishaji wa HTTPS/TLS, upanuzi wa kumbukumbu za ukaguzi, usimbaji wa data ya mkoba na madai ikiwa imehifadhiwa, na usajili rasmi wa utii kwa mamlaka husika.",
      },
      {
        title: "Wasiliana Nasi",
        body: "Kwa maswali ya faragha au maombi ya taarifa, wasiliana nasi kupitia tujitunze@gmail.com, piga simu +255 756 801 149, au tuandikie Dar es Salaam, Tanzania.",
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

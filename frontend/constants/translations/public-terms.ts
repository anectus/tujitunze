import type { Language } from "@/lib/context/LanguageContext";

export const termsTranslations = {
  en: {
    heading: "Terms & Conditions",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "September 2026",
    intro:
      "These terms govern your use of Tujitunze, the Health Savings and Insurance Management System. By creating an account you agree to the terms below.",
    sections: [
      {
        title: "Eligibility",
        body: "Tujitunze accounts are for individuals who can provide a valid national ID (NIDA) number for verification. You are responsible for keeping your login credentials confidential.",
      },
      {
        title: "Health Wallet & Contributions",
        body: "Your health wallet reflects contributions made by you or on your behalf through supported telecom and bank channels. Wallet balances are internal accounting records maintained by Tujitunze; they are not a deposit account with a bank or telecom operator.",
      },
      {
        title: "Insurance & Claims",
        body: "Insurance coverage shown in your account reflects the plans and providers you are enrolled with. Claims are reviewed according to the terms of the applicable insurance plan, and partner hospitals may verify your membership status at the point of care.",
      },
      {
        title: "Acceptable Use",
        body: "You agree not to misuse the platform, attempt to access another member's data, or provide false identity or financial information. Accounts found in violation may be suspended pending review.",
      },
      {
        title: "Changes to the Service",
        body: "Tujitunze may update features, fees, or these terms from time to time. Material changes will be communicated through the platform before they take effect.",
      },
      {
        title: "Contact Us",
        body: "Questions about these terms can be sent to support@tujitunze.com or through the Contact page.",
      },
    ],
  },
  sw: {
    heading: "Vigezo na Masharti",
    lastUpdatedLabel: "Ilisasishwa mara ya mwisho",
    lastUpdatedDate: "Septemba 2026",
    intro:
      "Vigezo hivi vinasimamia matumizi yako ya Tujitunze, Mfumo wa Akiba ya Afya na Usimamizi wa Bima. Kwa kufungua akaunti unakubaliana na vigezo vilivyo hapa chini.",
    sections: [
      {
        title: "Sifa za Kustahili",
        body: "Akaunti za Tujitunze ni kwa ajili ya watu binafsi wanaoweza kutoa namba halali ya Kitambulisho cha Taifa (NIDA) kwa ajili ya uthibitisho. Unawajibika kutunza siri za kuingia kwenye akaunti yako.",
      },
      {
        title: "Mkoba wa Afya na Michango",
        body: "Mkoba wako wa afya unaonyesha michango iliyofanywa na wewe au kwa niaba yako kupitia njia za simu na benki zinazotumika. Salio la mkoba ni kumbukumbu za uhasibu za ndani zinazosimamiwa na Tujitunze; si akaunti ya amana kwa benki au mtoa huduma za simu.",
      },
      {
        title: "Bima na Madai",
        body: "Huduma za bima zinazoonyeshwa kwenye akaunti yako zinaonyesha mipango na watoa huduma uliojiunga nao. Madai hukaguliwa kulingana na vigezo vya mpango husika wa bima, na hospitali washirika zinaweza kuthibitisha hali ya uanachama wako wakati wa huduma.",
      },
      {
        title: "Matumizi Yanayokubalika",
        body: "Unakubali kutotumia vibaya jukwaa hili, kutojaribu kufikia taarifa za mwanachama mwingine, au kutoa taarifa za uongo za utambulisho au fedha. Akaunti zitakazobainika kukiuka masharti haya zinaweza kusimamishwa wakati wa ukaguzi.",
      },
      {
        title: "Mabadiliko ya Huduma",
        body: "Tujitunze inaweza kusasisha huduma, ada, au vigezo hivi mara kwa mara. Mabadiliko muhimu yatawasilishwa kupitia jukwaa kabla ya kuanza kutumika.",
      },
      {
        title: "Wasiliana Nasi",
        body: "Maswali kuhusu vigezo hivi yanaweza kutumwa kwa support@tujitunze.com au kupitia ukurasa wa Wasiliana Nasi.",
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

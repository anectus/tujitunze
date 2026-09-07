import type { Language } from "@/lib/context/LanguageContext";

// The FAQSection rendered under the /services page (distinct from the
// Services component's own heading/description in constants/translations/home.ts).
export const servicesFaqSectionTranslations = {
  en: {
    title: "Service Questions",
    description: "More detail on how each Tujitunze service works.",
  },
  sw: {
    title: "Maswali ya Huduma",
    description:
      "Maelezo zaidi kuhusu jinsi kila huduma ya Tujitunze inavyofanya kazi.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const servicesFaqsTranslations = {
  en: [
    {
      question:
        "What's the difference between the wallet and telecom contributions?",
      answer:
        "Your wallet is where your health savings are held and tracked. Telecom contributions are one of the ways you can add money into that wallet, using mobile money from your network operator.",
    },
    {
      question: "Which banks does Tujitunze support?",
      answer:
        "Tujitunze integrates with partner banks to let you link an account and move funds securely. Supported banks are shown when you add a bank account from your profile.",
    },
    {
      question: "How does insurance allocation work?",
      answer:
        "A share of your Health Wallet savings is allocated to the insurance plan you're enrolled with. Claims against that plan are reviewed by your insurance provider according to its terms, and you can track their status from your dashboard.",
    },
    {
      question: "What is member management used for?",
      answer:
        "It covers your registration details, NIDA identification, linked phone numbers, and profile — everything that keeps your account accurate and secure.",
    },
  ],
  sw: [
    {
      question: "Kuna tofauti gani kati ya mkoba na michango ya simu?",
      answer:
        "Mkoba wako ndipo akiba yako ya afya inapohifadhiwa na kufuatiliwa. Michango ya simu ni mojawapo ya njia za kuongeza fedha kwenye mkoba huo, kwa kutumia pesa za simu kutoka kwa mtoa huduma wako wa mtandao.",
    },
    {
      question: "Tujitunze inasaidia benki zipi?",
      answer:
        "Tujitunze inaunganika na benki washirika ili kukuwezesha kuunganisha akaunti na kuhamisha fedha kwa usalama. Benki zinazotumika huonyeshwa unapoongeza akaunti ya benki kutoka kwenye wasifu wako.",
    },
    {
      question: "Ugawaji wa bima unafanya kazije?",
      answer:
        "Sehemu ya akiba yako ya Mkoba wa Afya hugawiwa kwa mpango wa bima ulioujiunga nao. Madai dhidi ya mpango huo hukaguliwa na mtoa huduma wako wa bima kulingana na vigezo vyake, na unaweza kufuatilia hali yake kutoka dashibodi yako.",
    },
    {
      question: "Usimamizi wa wanachama unatumika kwa ajili ya nini?",
      answer:
        "Unahusisha taarifa zako za usajili, kitambulisho cha NIDA, namba za simu zilizounganishwa, na wasifu — kila kitu kinachoweka akaunti yako sahihi na salama.",
    },
  ],
} as const satisfies Record<Language, { question: string; answer: string }[]>;

import type { Language } from "@/lib/context/LanguageContext";

export const helpPageTranslations = {
  en: {
    heading: "Help Center",
    description:
      "Find answers to common questions about your Tujitunze account, organized by topic.",
  },
  sw: {
    heading: "Kituo cha Msaada",
    description:
      "Pata majibu ya maswali ya kawaida kuhusu akaunti yako ya Tujitunze, yaliyopangwa kwa mada.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export interface HelpFaqCategoryTranslation {
  category: string;
  items: { question: string; answer: string }[];
}

export const helpFaqCategoriesTranslations = {
  en: [
    {
      category: "Getting Started",
      items: [
        {
          question: "How do I create a Tujitunze account?",
          answer:
            "Sign up from the homepage with your name, phone number, and NIDA details. Once verified, you can start saving and contributing right away.",
        },
        {
          question: "What do I need to sign up?",
          answer:
            "You'll need a valid phone number and your NIDA (National ID) details to complete sign up.",
        },
      ],
    },
    {
      category: "Wallet & Contributions",
      items: [
        {
          question: "How do I top up my wallet?",
          answer:
            "Use mobile money from a supported telecom operator, or link a bank account from your profile settings.",
        },
        {
          question: "Can I withdraw funds from my wallet?",
          answer:
            "Yes, withdrawals are available from your wallet dashboard, subject to your account's linked payment methods.",
        },
      ],
    },
    {
      category: "Insurance & Claims",
      items: [
        {
          question: "How do I check my coverage?",
          answer:
            "Your active insurance plan and coverage details are shown on your Insurance page once logged in.",
        },
        {
          question: "How do I submit a claim?",
          answer:
            "Claims are submitted from the Insurance section of your dashboard, where you can track their status until they're resolved.",
        },
      ],
    },
    {
      category: "Account & Security",
      items: [
        {
          question: "Is my data shared with third parties?",
          answer:
            "Your account data is used only to manage your own savings, coverage, and verification — it isn't sold or shared beyond what's needed to provide the service.",
        },
        {
          question: "What do I do if I forget my password?",
          answer:
            'Use the "Forgot password" link on the login page to reset it via your registered phone number.',
        },
      ],
    },
  ],
  sw: [
    {
      category: "Kuanza",
      items: [
        {
          question: "Ninawezaje kufungua akaunti ya Tujitunze?",
          answer:
            "Jisajili kutoka ukurasa wa mwanzo kwa jina lako, namba ya simu, na taarifa za NIDA. Baada ya kuthibitishwa, unaweza kuanza kuweka akiba na kuchangia mara moja.",
        },
        {
          question: "Ninahitaji nini ili kujisajili?",
          answer:
            "Utahitaji namba ya simu halali na taarifa zako za NIDA (Kitambulisho cha Taifa) ili kukamilisha usajili.",
        },
      ],
    },
    {
      category: "Mkoba na Michango",
      items: [
        {
          question: "Ninawezaje kuongeza fedha kwenye mkoba wangu?",
          answer:
            "Tumia pesa za simu kutoka kwa mtoa huduma wa mawasiliano anayetumika, au unganisha akaunti ya benki kutoka mipangilio ya wasifu wako.",
        },
        {
          question: "Je, ninaweza kutoa fedha kutoka kwenye mkoba wangu?",
          answer:
            "Ndiyo, utoaji unapatikana kutoka dashibodi ya mkoba wako, kulingana na njia za malipo zilizounganishwa na akaunti yako.",
        },
      ],
    },
    {
      category: "Bima na Madai",
      items: [
        {
          question: "Ninawezaje kuangalia bima yangu?",
          answer:
            "Mpango wako wa bima ulio hai na maelezo ya bima huonyeshwa kwenye ukurasa wako wa Bima mara tu unapoingia.",
        },
        {
          question: "Ninawezaje kuwasilisha dai?",
          answer:
            "Madai huwasilishwa kutoka sehemu ya Bima kwenye dashibodi yako, ambapo unaweza kufuatilia hali yake hadi litakapotatuliwa.",
        },
      ],
    },
    {
      category: "Akaunti na Usalama",
      items: [
        {
          question: "Je, taarifa zangu zinashirikiwa na wahusika wengine?",
          answer:
            "Taarifa za akaunti yako hutumika tu kusimamia akiba, bima, na uthibitisho wako mwenyewe — hazitolewi wala kushirikiwa zaidi ya kile kinachohitajika kutoa huduma.",
        },
        {
          question: "Nifanye nini nikisahau nywila yangu?",
          answer:
            'Tumia kiungo cha "Umesahau nywila" kwenye ukurasa wa kuingia ili kuiweka upya kupitia namba yako ya simu iliyosajiliwa.',
        },
      ],
    },
  ],
} as const satisfies Record<Language, HelpFaqCategoryTranslation[]>;

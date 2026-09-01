import type { Language } from "@/lib/context/LanguageContext";

export const headerTranslations = {
  en: {
    tagline: "Health Savings & Insurance Management System",
    home: "Home",
    about: "About",
    services: "Services",
    login: "Login",
    signUp: "Sign Up",
    completeMembership: "Complete Membership",
    profile: "Profile",
    settings: "Settings",
    logOut: "Log Out",
  },
  sw: {
    tagline: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima",
    home: "Nyumbani",
    about: "Kuhusu Sisi",
    services: "Huduma",
    login: "Ingia",
    signUp: "Jisajili",
    completeMembership: "Kamilisha Usajili",
    profile: "Wasifu",
    settings: "Mipangilio",
    logOut: "Toka",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const heroTranslations = {
  en: {
    badge: "Health Savings & Insurance Management System",
    titleLine1: "Secure Your",
    titleHighlight: " Healthcare Future",
    description:
      "Tujitunze is a digital healthcare financial platform that enables members to save healthcare funds, contribute through telecom networks, verify membership status, and access healthcare services securely.",
    signUp: "Sign Up",
    login: "Login",
    whyChoose: "Why Choose Tujitunze?",
    feature1Title: "Health Wallet",
    feature1Description:
      "Save small amounts daily via mobile money — no bank account needed. Built for the mtu wa kawaida.",
    feature2Title: "Telecom Contributions",
    feature2Description: "Supports contributions through mobile networks.",
    feature3Title: "Bank Integration",
    feature3Description: "Connects securely with financial institutions.",
  },
  sw: {
    badge: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima",
    titleLine1: "Hakikisha",
    titleHighlight: " Afya Yako ya Baadaye",
    description:
      "Tujitunze ni jukwaa la kidijitali la fedha za afya linalowawezesha wanachama kuweka akiba ya matibabu, kuchangia kupitia mitandao ya simu, kuthibitisha uanachama, na kupata huduma za afya kwa usalama.",
    signUp: "Jisajili",
    login: "Ingia",
    whyChoose: "Kwa Nini Uchague Tujitunze?",
    feature1Title: "Mkoba wa Afya",
    feature1Description:
      "Weka akiba kidogo kila siku kupitia pesa za simu — hauhitaji akaunti ya benki. Imeundwa kwa ajili ya mtu wa kawaida.",
    feature2Title: "Michango ya Simu",
    feature2Description: "Inasaidia michango kupitia mitandao ya simu.",
    feature3Title: "Uunganisho wa Benki",
    feature3Description: "Inaunganisha kwa usalama na taasisi za fedha.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const servicesTranslations = {
  en: {
    heading: "Our Services",
    description:
      "HSIMS provides a complete healthcare financial ecosystem connecting members, telecom operators, banks, and healthcare providers.",
    learnMore: "Learn More →",
    telecomTitle: "Telecom Contributions",
    telecomDescription:
      "Tujitunze enables health contributions through Tanzania's telecom networks and telecom-related transactions and usage.",
    telecomMetaMember: "Member-first",
    telecomMetaRegion: "Tanzania",
    cards: [
      {
        title: "Health Savings Wallet",
        description:
          "Built for the mtu wa kawaida — save small amounts daily straight from mobile money, no bank account needed. One button to top up, one screen to check your balance.",
      },
      {
        title: "Telecom Contributions",
        description:
          "Enables members to contribute through mobile networks such as Vodacom, Airtel, Tigo, Halotel, and TTCL.",
      },
      {
        title: "Bank Integration",
        description:
          "Provides secure connection with bank accounts for healthcare financial transactions.",
      },
    ],
  },
  sw: {
    heading: "Huduma Zetu",
    description:
      "HSIMS inatoa mfumo kamili wa fedha za afya unaounganisha wanachama, watoa huduma za simu, benki, na watoa huduma za afya.",
    learnMore: "Jifunze Zaidi →",
    telecomTitle: "Michango ya Simu",
    telecomDescription:
      "Tujitunze inawawezesha wanachama kuchangia kwa afya kupitia mitandao ya simu ya Tanzania na miamala na matumizi yanayohusiana na simu.",
    telecomMetaMember: "Kwa mwanachama",
    telecomMetaRegion: "Tanzania",
    cards: [
      {
        title: "Mkoba wa Akiba ya Afya",
        description:
          "Imeundwa kwa ajili ya mtu wa kawaida — weka akiba kidogo kila siku moja kwa moja kutoka kwa pesa za simu, hauhitaji akaunti ya benki. Kitufe kimoja kuongeza fedha, skrini moja kuangalia salio lako.",
      },
      {
        title: "Michango ya Simu",
        description:
          "Inawawezesha wanachama kuchangia kupitia mitandao ya simu kama vile Vodacom, Airtel, Tigo, Halotel, na TTCL.",
      },
      {
        title: "Uunganisho wa Benki",
        description:
          "Inatoa uunganisho salama na akaunti za benki kwa ajili ya miamala ya fedha za afya.",
      },
    ],
  },
} as const satisfies Record<
  Language,
  {
    heading: string;
    description: string;
    learnMore: string;
    telecomTitle: string;
    telecomDescription: string;
    telecomMetaMember: string;
    telecomMetaRegion: string;
    cards: { title: string; description: string }[];
  }
>;

export const faqSectionTranslations = {
  en: {
    title: "Frequently Asked Questions",
    description:
      "Answers to common questions about saving, contributing, and using Tujitunze.",
  },
  sw: {
    title: "Maswali Yanayoulizwa Mara kwa Mara",
    description:
      "Majibu ya maswali ya kawaida kuhusu kuweka akiba, kuchangia, na kutumia Tujitunze.",
  },
} as const satisfies Record<Language, Record<string, string>>;

export const homeFaqsTranslations = {
  en: [
    {
      question: "What is Tujitunze?",
      answer:
        "Tujitunze is a health savings and insurance management platform for Tanzania. It lets you save toward healthcare costs, contribute through your telecom or bank account, and access verified partner hospitals — all from one account.",
    },
    {
      question: "Is Tujitunze free to use?",
      answer:
        "Creating an account and using the wallet, telecom contributions, and hospital verification features is free. Any transaction or contribution fees are shown clearly before you confirm, so there are never hidden charges.",
    },
    {
      question: "How do I add money to my wallet?",
      answer:
        "You can top up your Tujitunze wallet through mobile money with Vodacom, Airtel, Yas Money, Halotel, or TTCL, or by linking a supported bank account directly from your dashboard.",
    },
    {
      question: "Do I need a bank account to use Tujitunze?",
      answer:
        "No. The wallet is built for the mtu wa kawaida — the ordinary person. Mobile money is enough to save small amounts daily; a bank account is only an extra option for members who prefer one.",
    },
    {
      question: "Can hospitals verify my membership?",
      answer:
        "Yes. Partner hospitals can verify your active membership at the point of care, so you don't need to carry paperwork — your account status is checked instantly.",
    },
    {
      question: "Is my personal information secure?",
      answer:
        "Yes. Tujitunze uses authenticated, role-based access to protect your account, and your NIDA and financial details are only used to verify your identity and manage your own savings and coverage.",
    },
  ],
  sw: [
    {
      question: "Tujitunze ni nini?",
      answer:
        "Tujitunze ni jukwaa la akiba ya afya na usimamizi wa bima kwa Tanzania. Linakuwezesha kuweka akiba kwa ajili ya gharama za matibabu, kuchangia kupitia simu au akaunti ya benki, na kupata hospitali washirika zilizothibitishwa — yote kutoka akaunti moja.",
    },
    {
      question: "Je, Tujitunze ni bure kutumia?",
      answer:
        "Kufungua akaunti na kutumia mkoba, michango ya simu, na uthibitisho wa hospitali ni bure. Ada zozote za miamala au michango zinaonyeshwa wazi kabla ya kuthibitisha, hivyo hakuna gharama za siri.",
    },
    {
      question: "Ninawezaje kuweka fedha kwenye mkoba wangu?",
      answer:
        "Unaweza kuongeza fedha kwenye mkoba wako wa Tujitunze kupitia pesa za simu za Vodacom, Airtel, Yas Money, Halotel, au TTCL, au kwa kuunganisha akaunti ya benki inayotumika moja kwa moja kutoka dashibodi yako.",
    },
    {
      question: "Je, nahitaji akaunti ya benki kutumia Tujitunze?",
      answer:
        "Hapana. Mkoba umeundwa kwa ajili ya mtu wa kawaida. Pesa za simu zinatosha kuweka akiba kidogo kila siku; akaunti ya benki ni chaguo la ziada tu kwa wanachama wanaopendelea.",
    },
    {
      question: "Je, hospitali zinaweza kuthibitisha uanachama wangu?",
      answer:
        "Ndiyo. Hospitali washirika zinaweza kuthibitisha uanachama wako ulio hai wakati wa huduma, hivyo hauhitaji kubeba nyaraka — hali ya akaunti yako inakaguliwa papo hapo.",
    },
    {
      question: "Je, taarifa zangu binafsi ziko salama?",
      answer:
        "Ndiyo. Tujitunze hutumia ufikiaji wenye uthibitisho na unaozingatia jukumu kulinda akaunti yako, na taarifa zako za NIDA na fedha hutumika tu kuthibitisha utambulisho wako na kusimamia akiba na huduma zako mwenyewe.",
    },
  ],
} as const satisfies Record<Language, { question: string; answer: string }[]>;

export const footerTranslations = {
  en: {
    description:
      "Health Savings and Insurance Management System. A secure digital platform connecting members, healthcare providers, telecom networks, and financial institutions.",
    navigation: "Navigation",
    home: "Home",
    about: "About Us",
    services: "Services",
    contact: "Contact",
    ourServices: "Our Services",
    service1: "Health Savings Wallet",
    service2: "Telecom Contributions",
    service3: "NIDA Member Verification",
    service5: "Bank Account Integration",
    contactInfo: "Contact Information",
    location: "Tanzania",
    rightsReserved: "All rights reserved.",
    privacyPolicy: "Privacy Policy",
    terms: "Terms & Conditions",
  },
  sw: {
    description:
      "Mfumo wa Akiba ya Afya na Usimamizi wa Bima. Jukwaa salama la kidijitali linaunganisha wanachama, watoa huduma za afya, mitandao ya simu, na taasisi za fedha.",
    navigation: "Uelekezaji",
    home: "Nyumbani",
    about: "Kuhusu Sisi",
    services: "Huduma",
    contact: "Wasiliana Nasi",
    ourServices: "Huduma Zetu",
    service1: "Mkoba wa Akiba ya Afya",
    service2: "Michango ya Simu",
    service3: "Uthibitisho wa Uanachama wa NIDA",
    service5: "Uunganisho wa Akaunti ya Benki",
    contactInfo: "Taarifa za Mawasiliano",
    location: "Tanzania",
    rightsReserved: "Haki zote zimehifadhiwa.",
    privacyPolicy: "Sera ya Faragha",
    terms: "Vigezo na Masharti",
  },
} as const satisfies Record<Language, Record<string, string>>;

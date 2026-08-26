import type { Language } from "@/lib/context/LanguageContext";

export const publicAboutTranslations = {
  en: {
    heroTitle: "About Tujitunze",
    heroDescription:
      "Health Savings and Insurance Management System (Tujitunze) is an integrated digital platform that enables individuals to save money for healthcare services while securely connecting members, healthcare providers, banks, and telecommunication operators into one trusted ecosystem.",
    whatIsTitle: "What is Tujitunze?",
    whatIsBody:
      "Tujitunze is designed to improve access to healthcare by providing a secure Health Savings Wallet where members accumulate funds that can later be used for medical services. The platform supports multiple stakeholders including healthcare providers, telecommunication operators, financial institutions, and government authorities, ensuring transparency, accountability, and secure healthcare financing.",
    missionTitle: "Our Mission",
    missionBody:
      "To provide a secure, reliable and innovative healthcare savings platform that empowers individuals to access affordable healthcare services through digital financial technology.",
    visionTitle: "Our Vision",
    visionBody:
      "To become the leading digital healthcare savings and insurance management platform in Tanzania, ensuring every citizen has easy access to quality healthcare services.",
    objectivesTitle: "System Objectives",
    objective1: "Provide secure healthcare savings.",
    objective2: "Support member registration using NIDA (National ID).",
    objective3: "Integrate banks for financial services.",
    objective4: "Connect multiple telecommunication operators.",
    objective5: "Improve transparency.",
    objective6: "Reduce healthcare payment delays.",
    objective7: "Ensure secure digital transactions.",
    objective8: "Protect member information.",
    coreValuesTitle: "Our Core Values",
    securityTitle: "Security",
    securityBody: "Protecting financial information.",
    trustTitle: "Trust",
    trustBody: "Building confidence among all stakeholders.",
    closingTitle: "Building the Future of Digital Healthcare",
    closingBody:
      "Tujitunze combines secure technology, financial services, and telecommunication infrastructure to create a modern healthcare savings ecosystem that is accessible, transparent, and sustainable.",
  },
  sw: {
    heroTitle: "Kuhusu Tujitunze",
    heroDescription:
      "Mfumo wa Akiba ya Afya na Usimamizi wa Bima (Tujitunze) ni jukwaa la kidijitali lililounganishwa linalowawezesha watu kuweka akiba ya fedha kwa ajili ya huduma za afya huku likiunganisha kwa usalama wanachama, watoa huduma za afya, benki, na watoa huduma za mawasiliano katika mfumo mmoja wa kuaminika.",
    whatIsTitle: "Tujitunze ni nini?",
    whatIsBody:
      "Tujitunze imeundwa kuboresha upatikanaji wa huduma za afya kwa kutoa Mkoba salama wa Akiba ya Afya ambapo wanachama hukusanya fedha ambazo baadaye zinaweza kutumika kwa huduma za matibabu. Jukwaa hili linasaidia wadau mbalimbali ikiwemo watoa huduma za afya, watoa huduma za mawasiliano, taasisi za fedha, na mamlaka za serikali, kuhakikisha uwazi, uwajibikaji, na ufadhili salama wa huduma za afya.",
    missionTitle: "Dhamira Yetu",
    missionBody:
      "Kutoa jukwaa salama, la kuaminika na la kibunifu la akiba ya afya linalowezesha watu kupata huduma za afya za bei nafuu kupitia teknolojia ya kidijitali ya fedha.",
    visionTitle: "Dira Yetu",
    visionBody:
      "Kuwa jukwaa linaloongoza la kidijitali la akiba ya afya na usimamizi wa bima nchini Tanzania, kuhakikisha kila raia anapata kwa urahisi huduma bora za afya.",
    objectivesTitle: "Malengo ya Mfumo",
    objective1: "Kutoa akiba salama ya huduma za afya.",
    objective2: "Kusaidia usajili wa wanachama kwa kutumia NIDA (Kitambulisho cha Taifa).",
    objective3: "Kuunganisha benki kwa ajili ya huduma za fedha.",
    objective4: "Kuunganisha watoa huduma mbalimbali wa mawasiliano.",
    objective5: "Kuboresha uwazi.",
    objective6: "Kupunguza ucheleweshaji wa malipo ya huduma za afya.",
    objective7: "Kuhakikisha miamala salama ya kidijitali.",
    objective8: "Kulinda taarifa za wanachama.",
    coreValuesTitle: "Maadili Yetu Msingi",
    securityTitle: "Usalama",
    securityBody: "Kulinda taarifa za kifedha.",
    trustTitle: "Uaminifu",
    trustBody: "Kujenga imani miongoni mwa wadau wote.",
    closingTitle: "Kujenga Mustakabali wa Afya ya Kidijitali",
    closingBody:
      "Tujitunze inaunganisha teknolojia salama, huduma za fedha, na miundombinu ya mawasiliano kuunda mfumo wa kisasa wa akiba ya afya ulio rahisi kufikiwa, wa uwazi, na endelevu.",
  },
} as const satisfies Record<Language, Record<string, string>>;

import type { Language } from "@/lib/context/LanguageContext";

// CONTACT_CATEGORIES values are sent to POST /contact and validated there by
// @IsIn(...) (backend/src/modules/contact/dto/create-contact-message.dto.ts)
// — they must stay these exact English strings. contactCategoryLabelTranslations
// maps each stable value to its displayed label per language.
export const CONTACT_CATEGORIES = [
  "General Enquiry",
  "Member Registration",
  "Health Wallet",
  "Hospital Verification",
  "Telecom Contributions",
  "Bank Integration",
  "Technical Support",
  "Complaint",
  "Partnership",
] as const;

export const contactCategoryLabelTranslations = {
  en: {
    "General Enquiry": "General Enquiry",
    "Member Registration": "Member Registration",
    "Health Wallet": "Health Wallet",
    "Hospital Verification": "Hospital Verification",
    "Telecom Contributions": "Telecom Contributions",
    "Bank Integration": "Bank Integration",
    "Technical Support": "Technical Support",
    "Complaint": "Complaint",
    "Partnership": "Partnership",
  },
  sw: {
    "General Enquiry": "Uchunguzi wa Jumla",
    "Member Registration": "Usajili wa Wanachama",
    "Health Wallet": "Mkoba wa Afya",
    "Hospital Verification": "Uthibitisho wa Hospitali",
    "Telecom Contributions": "Michango ya Simu",
    "Bank Integration": "Uunganisho wa Benki",
    "Technical Support": "Msaada wa Kiufundi",
    "Complaint": "Malalamiko",
    "Partnership": "Ushirikiano",
  },
} as const satisfies Record<Language, Record<(typeof CONTACT_CATEGORIES)[number], string>>;

export const contactTranslations = {
  en: {
    heading: "Contact Tujitunze",
    intro:
      "Whether you are a member seeking healthcare support, a telecom operator integrating contribution services, a financial institution, or a development partner, the Health Savings and Insurance Management System (Tujitunze) team is ready to assist you.",
    headquartersTitle: "Headquarters",
    headquartersBody: "Health Savings and Insurance Management System",
    city: "Dar es Salaam",
    country: "Tanzania",
    officeHoursTitle: "Office Hours",
    officeHoursDays: "Monday – Friday",
    officeHoursTime: "08:00 AM – 05:00 PM (EAT)",
    officeHoursNote:
      "Emergency technical incidents are handled according to system support procedures.",
    responseTimeTitle: "Response Time",
    generalEnquiriesLabel: "General enquiries:",
    generalEnquiriesValue: "1–2 Business Days",
    priorityNote:
      "Technical issues affecting healthcare services receive priority support.",
    contactInfoTitle: "Contact Information",
    addressTitle: "Address",
    generalSupportTitle: "General Support",
    technicalSupportTitle: "Technical Support",
    telephoneTitle: "Telephone",
    weSupportTitle: "We Support",
    supportList: [
      "Member Registration",
      "Health Wallet Assistance",
      "Telecom Integration",
      "Bank Integration",
      "System Administration",
      "Partnership & Collaboration",
    ],
    sendMessageTitle: "Send Us a Message",
    sendMessageIntro:
      "Complete the form below and the appropriate Tujitunze team will respond as soon as possible.",
    sendingAsPrefix: "Sending as",
    sendingAsSuffix:
      "— we'll use the contact details already on your account, so you only need to write your message below.",
    yourAccount: "your account",
    fullNamePlaceholder: "Full Name *",
    nationalIdPlaceholder: "National ID (Optional)",
    emailPlaceholder: "Email Address *",
    phonePlaceholder: "Phone Number (Optional)",
    selectCategoryPlaceholder: "Select Enquiry Category",
    subjectPlaceholder: "Subject *",
    messagePlaceholder: "Describe your enquiry...",
    sending: "Sending...",
    submitEnquiry: "Submit Enquiry",
    nameEmailRequiredError: "Name and email are required.",
    genericSendError: "Unable to send your message.",
    genericSendSuccess: "Your message has been sent.",
  },
  sw: {
    heading: "Wasiliana na Tujitunze",
    intro:
      "Iwe wewe ni mwanachama unayetafuta msaada wa afya, mtoa huduma za mawasiliano anayeunganisha huduma za michango, taasisi ya fedha, au mshirika wa maendeleo, timu ya Mfumo wa Akiba ya Afya na Usimamizi wa Bima (Tujitunze) iko tayari kukusaidia.",
    headquartersTitle: "Makao Makuu",
    headquartersBody: "Mfumo wa Akiba ya Afya na Usimamizi wa Bima",
    city: "Dar es Salaam",
    country: "Tanzania",
    officeHoursTitle: "Saa za Kazi",
    officeHoursDays: "Jumatatu – Ijumaa",
    officeHoursTime: "Saa 2:00 Asubuhi – Saa 11:00 Jioni (EAT)",
    officeHoursNote:
      "Matukio ya dharura ya kiufundi hushughulikiwa kulingana na taratibu za msaada wa mfumo.",
    responseTimeTitle: "Muda wa Kujibu",
    generalEnquiriesLabel: "Maswali ya jumla:",
    generalEnquiriesValue: "Siku 1–2 za Kazi",
    priorityNote:
      "Matatizo ya kiufundi yanayoathiri huduma za afya hupewa msaada wa kipaumbele.",
    contactInfoTitle: "Taarifa za Mawasiliano",
    addressTitle: "Anwani",
    generalSupportTitle: "Msaada wa Jumla",
    technicalSupportTitle: "Msaada wa Kiufundi",
    telephoneTitle: "Simu",
    weSupportTitle: "Tunasaidia",
    supportList: [
      "Usajili wa Wanachama",
      "Msaada wa Mkoba wa Afya",
      "Uunganisho wa Mawasiliano",
      "Uunganisho wa Benki",
      "Usimamizi wa Mfumo",
      "Ushirikiano na Mashirikiano",
    ],
    sendMessageTitle: "Tutumie Ujumbe",
    sendMessageIntro:
      "Jaza fomu iliyo hapa chini na timu husika ya Tujitunze itajibu haraka iwezekanavyo.",
    sendingAsPrefix: "Unatuma kama",
    sendingAsSuffix:
      "— tutatumia taarifa za mawasiliano zilizopo tayari kwenye akaunti yako, hivyo unahitaji tu kuandika ujumbe wako hapa chini.",
    yourAccount: "akaunti yako",
    fullNamePlaceholder: "Jina Kamili *",
    nationalIdPlaceholder: "Kitambulisho cha Taifa (Hiari)",
    emailPlaceholder: "Barua Pepe *",
    phonePlaceholder: "Namba ya Simu (Hiari)",
    selectCategoryPlaceholder: "Chagua Aina ya Uchunguzi",
    subjectPlaceholder: "Kichwa cha Habari *",
    messagePlaceholder: "Eleza uchunguzi wako...",
    sending: "Inatuma...",
    submitEnquiry: "Wasilisha Uchunguzi",
    nameEmailRequiredError: "Jina na barua pepe vinahitajika.",
    genericSendError: "Imeshindwa kutuma ujumbe wako.",
    genericSendSuccess: "Ujumbe wako umetumwa.",
  },
} as const satisfies Record<Language, Record<string, string | string[]>>;

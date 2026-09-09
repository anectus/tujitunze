import type { Language } from "@/lib/context/LanguageContext";

export const mobileMoneyFormTranslations = {
  en: {
    title: "Complete Your Membership",
    subtitle:
      "A few more details, then link a mobile money account so we can attribute your contributions.",
    lookupErrorFallback: "Unable to load bank/region options. Please try again.",

    incompleteBanner:
      "Your membership setup is incomplete. Please finish linking your mobile account.",

    sectionPersonalInfo: "Personal Information",
    sectionLocationInfo: "Location Information",
    sectionMobileMoney: "Mobile Money Accounts",
    sectionBankAccounts: "Bank Accounts",

    progressLabelTemplate: "Profile {percent}% complete",
    progressBankHint: " — link your bank account to finish",
    progressComplete: "Profile 100% complete — you're all set!",

    genderRequiredError: "Gender is required.",
    regionRequiredError: "Region is required.",
    phoneRequiredError: "Phone number is required.",

    bankAccountTooltip:
      "Optional, but recommended: a linked bank account lets Insurance/Bank settlements reach you directly and gives you a backup way to top up your wallet.",

    successModalTitle: "🎉 Membership completed successfully!",
    successModalBody: "You can now access your dashboard.",

    gender: "Gender",
    selectGender: "Select your gender",
    male: "Male",
    female: "Female",
    dateOfBirth: "Date of Birth",
    optional: "(Optional)",
    region: "Region",
    selectRegion: "Select your region",
    district: "District",
    selectDistrict: "Select your district",
    selectRegionFirst: "Select a region first",

    mobileMoneyAccountTemplate: "Mobile Money Account {n}",
    remove: "Remove",
    phoneNumber: "Phone Number",
    phoneNumberPlaceholder: "0626881149",
    networkDetectedHelp: "Your network is detected automatically from this number.",
    accountNumber: "Account Number",
    accountNumberPlaceholder: "Enter your mobile money account number",
    addAnotherMobileMoneyAccount: "+ Add another mobile money account",

    bankAccount: "Bank Account",
    bankAccountTemplate: "Bank Account {n}",
    bank: "Bank",
    selectYourBank: "Select your bank",
    bankAccountNumberPlaceholder: "Enter your bank account number",
    accountType: "Account Type",
    selectAccountType: "Select account type",
    savings: "Savings",
    current: "Current",
    addAnotherBankAccount: "+ Add another bank account",
    addABankAccount: "+ Add a bank account",

    saving: "Saving...",
    saveAndContinue: "Save and Continue",

    profileSaveErrorFallback: "Unable to save your profile details.",
    mobileMoneyMultiErrorTemplate: "Mobile Money Account {n}: {message}",
    mobileMoneyLinkErrorFallback: "Unable to link this account.",
    mobileMoneySingleLinkErrorFallback: "Unable to link this mobile money account.",
    bankMultiErrorTemplate: "Bank Account {n}: {message}",
    bankLinkErrorFallback: "Unable to link this bank account.",
    successMessage: "Your details were saved successfully.",
    genericErrorFallback: "Something went wrong. Please try again.",
  },
  sw: {
    title: "Kamilisha Usajili Wako",
    subtitle:
      "Taarifa chache zaidi, kisha unganisha akaunti ya pesa za simu ili tuweze kuhusisha michango yako.",
    lookupErrorFallback: "Imeshindwa kupakia chaguo za benki/mkoa. Tafadhali jaribu tena.",

    incompleteBanner:
      "Usanidi wa uanachama wako haujakamilika. Tafadhali maliza kuunganisha akaunti yako ya simu.",

    sectionPersonalInfo: "Taarifa Binafsi",
    sectionLocationInfo: "Taarifa za Mahali",
    sectionMobileMoney: "Akaunti za Pesa za Simu",
    sectionBankAccounts: "Akaunti za Benki",

    progressLabelTemplate: "Wasifu umekamilika {percent}%",
    progressBankHint: " — unganisha akaunti yako ya benki ili kukamilisha",
    progressComplete: "Wasifu umekamilika 100% — uko tayari!",

    genderRequiredError: "Jinsia inahitajika.",
    regionRequiredError: "Mkoa unahitajika.",
    phoneRequiredError: "Namba ya simu inahitajika.",

    bankAccountTooltip:
      "Si lazima, lakini inapendekezwa: akaunti ya benki iliyounganishwa huruhusu malipo ya Bima/Benki kufika kwako moja kwa moja na hukupa njia mbadala ya kuongeza fedha kwenye mkoba wako.",

    successModalTitle: "🎉 Uanachama umekamilika kwa mafanikio!",
    successModalBody: "Sasa unaweza kufikia dashibodi yako.",

    gender: "Jinsia",
    selectGender: "Chagua jinsia yako",
    male: "Mwanaume",
    female: "Mwanamke",
    dateOfBirth: "Tarehe ya Kuzaliwa",
    optional: "(Si lazima)",
    region: "Mkoa",
    selectRegion: "Chagua mkoa wako",
    district: "Wilaya",
    selectDistrict: "Chagua wilaya yako",
    selectRegionFirst: "Chagua mkoa kwanza",

    mobileMoneyAccountTemplate: "Akaunti ya Pesa za Simu {n}",
    remove: "Ondoa",
    phoneNumber: "Namba ya Simu",
    phoneNumberPlaceholder: "0626881149",
    networkDetectedHelp: "Mtandao wako unatambuliwa moja kwa moja kutoka namba hii.",
    accountNumber: "Namba ya Akaunti",
    accountNumberPlaceholder: "Weka namba yako ya akaunti ya pesa za simu",
    addAnotherMobileMoneyAccount: "+ Ongeza akaunti nyingine ya pesa za simu",

    bankAccount: "Akaunti ya Benki",
    bankAccountTemplate: "Akaunti ya Benki {n}",
    bank: "Benki",
    selectYourBank: "Chagua benki yako",
    bankAccountNumberPlaceholder: "Weka namba yako ya akaunti ya benki",
    accountType: "Aina ya Akaunti",
    selectAccountType: "Chagua aina ya akaunti",
    savings: "Akiba",
    current: "Ya Sasa",
    addAnotherBankAccount: "+ Ongeza akaunti nyingine ya benki",
    addABankAccount: "+ Ongeza akaunti ya benki",

    saving: "Inahifadhi...",
    saveAndContinue: "Hifadhi na Endelea",

    profileSaveErrorFallback: "Imeshindwa kuhifadhi taarifa za wasifu wako.",
    mobileMoneyMultiErrorTemplate: "Akaunti ya Pesa za Simu {n}: {message}",
    mobileMoneyLinkErrorFallback: "Imeshindwa kuunganisha akaunti hii.",
    mobileMoneySingleLinkErrorFallback: "Imeshindwa kuunganisha akaunti hii ya pesa za simu.",
    bankMultiErrorTemplate: "Akaunti ya Benki {n}: {message}",
    bankLinkErrorFallback: "Imeshindwa kuunganisha akaunti hii ya benki.",
    successMessage: "Taarifa zako zimehifadhiwa kikamilifu.",
    genericErrorFallback: "Hitilafu imetokea. Tafadhali jaribu tena.",
  },
} as const satisfies Record<Language, Record<string, string>>;

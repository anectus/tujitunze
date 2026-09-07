import type { Language } from "@/lib/context/LanguageContext";

export const memberSettingsTranslations = {
  en: {
    backToProfile: "Back to Profile",
    title: "Settings",
    description:
      "Change your password, or add more phone numbers and bank accounts as income sources for your wallet. Your name, NIDA number, and email can't be changed here.",

    userSettingsTab: "User Settings",
    securitySettingsTab: "Security Settings",

    accountSecurityGroupTitle: "Account Security",
    accountSecurityGroupDescription:
      "Manage your password and keep your account protected.",
    walletSourcesGroupTitle: "Wallet Sources",
    walletSourcesGroupDescription:
      "Link the phone numbers and bank accounts your Health Wallet can draw contributions from.",
    microSavingsGroupTitle: "Micro-Savings Preferences",
    microSavingsGroupDescription:
      "Control whether small amounts are automatically saved from your everyday transactions.",

    changePasswordTitle: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    saving: "Saving...",
    changePasswordButton: "Change Password",
    newPasswordsDontMatch: "New passwords do not match.",
    newPasswordTooShort: "New password must be at least 8 characters.",
    changePasswordErrorFallback: "Unable to change your password.",
    changePasswordSuccess: "Password changed successfully.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    passwordMinLengthHint: "Must be at least 8 characters",
    passwordsMatchHint: "Passwords match",

    addPhoneTitle: "Add Phone Number",
    addPhoneDescription: "Link another mobile money number as a source for your wallet.",
    network: "Network",
    selectNetwork: "Select network",
    phoneNumber: "Phone Number",
    phoneNumberPlaceholder: "0626881149",
    adding: "Adding...",
    addPhoneButton: "Add Phone Number",
    addPhoneErrorFallback: "Unable to add this phone number.",
    addPhoneSuccessTemplate: "{phoneNumber} was added to your account.",

    addBankTitle: "Add Bank Account",
    addBankDescription: "Link another bank account as a source for your wallet.",
    bank: "Bank",
    selectBank: "Select bank",
    accountNumber: "Account Number",
    accountType: "Account Type",
    selectAccountType: "Select account type",
    savings: "Savings",
    current: "Current",
    addBankButton: "Add Bank Account",
    addBankErrorFallback: "Unable to add this bank account.",
    addBankSuccessTemplate: "Account {accountNumber} was added to your account.",

    savingConsentTitle: "Automatic Micro-Savings",
    savingConsentDescription:
      "When this is on, a small share of eligible telecom bundle purchases and mobile-money transactions is automatically saved into your Health Wallet. Turning it off stops new savings — it does not affect money already saved.",
    savingConsentOn: "On — savings are active",
    savingConsentOff: "Off — no new savings will be applied",
    savingConsentUpdateErrorFallback: "Unable to update this setting.",
    savingConsentUpdateSuccess: "Your savings preference was updated.",

    genericErrorFallback: "Something went wrong. Please try again.",
  },
  sw: {
    backToProfile: "Rudi kwenye Wasifu",
    title: "Mipangilio",
    description:
      "Badilisha nywila yako, au ongeza namba za simu na akaunti za benki kama vyanzo vya mapato kwa mkoba wako. Jina lako, namba ya NIDA, na barua pepe haviwezi kubadilishwa hapa.",

    userSettingsTab: "Mipangilio ya Mtumiaji",
    securitySettingsTab: "Mipangilio ya Usalama",

    accountSecurityGroupTitle: "Usalama wa Akaunti",
    accountSecurityGroupDescription:
      "Simamia nywila yako na uweke akaunti yako salama.",
    walletSourcesGroupTitle: "Vyanzo vya Mkoba",
    walletSourcesGroupDescription:
      "Unganisha namba za simu na akaunti za benki ambazo Mkoba wako wa Afya unaweza kupokea michango kutoka kwake.",
    microSavingsGroupTitle: "Mapendeleo ya Akiba Ndogo Ndogo",
    microSavingsGroupDescription:
      "Dhibiti kama kiasi kidogo kinahifadhiwa kiotomatiki kutoka kwenye miamala yako ya kila siku.",

    changePasswordTitle: "Badilisha Nywila",
    currentPassword: "Nywila ya Sasa",
    newPassword: "Nywila Mpya",
    confirmNewPassword: "Thibitisha Nywila Mpya",
    saving: "Inahifadhi...",
    changePasswordButton: "Badilisha Nywila",
    newPasswordsDontMatch: "Nywila mpya hazifanani.",
    newPasswordTooShort: "Nywila mpya lazima iwe na angalau herufi 8.",
    changePasswordErrorFallback: "Imeshindwa kubadilisha nywila yako.",
    changePasswordSuccess: "Nywila imebadilishwa kikamilifu.",
    showPassword: "Onyesha nywila",
    hidePassword: "Ficha nywila",
    passwordMinLengthHint: "Lazima iwe na angalau herufi 8",
    passwordsMatchHint: "Nywila zinafanana",

    addPhoneTitle: "Ongeza Namba ya Simu",
    addPhoneDescription: "Unganisha namba nyingine ya pesa za simu kama chanzo cha mkoba wako.",
    network: "Mtandao",
    selectNetwork: "Chagua mtandao",
    phoneNumber: "Namba ya Simu",
    phoneNumberPlaceholder: "0626881149",
    adding: "Inaongeza...",
    addPhoneButton: "Ongeza Namba ya Simu",
    addPhoneErrorFallback: "Imeshindwa kuongeza namba hii ya simu.",
    addPhoneSuccessTemplate: "{phoneNumber} imeongezwa kwenye akaunti yako.",

    addBankTitle: "Ongeza Akaunti ya Benki",
    addBankDescription: "Unganisha akaunti nyingine ya benki kama chanzo cha mkoba wako.",
    bank: "Benki",
    selectBank: "Chagua benki",
    accountNumber: "Namba ya Akaunti",
    accountType: "Aina ya Akaunti",
    selectAccountType: "Chagua aina ya akaunti",
    savings: "Akiba",
    current: "Ya Sasa",
    addBankButton: "Ongeza Akaunti ya Benki",
    addBankErrorFallback: "Imeshindwa kuongeza akaunti hii ya benki.",
    addBankSuccessTemplate: "Akaunti {accountNumber} imeongezwa kwenye akaunti yako.",

    savingConsentTitle: "Akiba Ndogo Ndogo Kiotomatiki",
    savingConsentDescription:
      "Ukiwasha hii, sehemu ndogo ya manunuzi ya vifurushi vya simu na miamala ya pesa za simu inayostahili itahifadhiwa kiotomatiki kwenye Mkoba wako wa Afya. Kuzima hakuathiri fedha ambazo tayari zimehifadhiwa — kunazuia tu akiba mpya.",
    savingConsentOn: "Imewashwa — akiba inaendelea",
    savingConsentOff: "Imezimwa — hakuna akiba mpya itakayowekwa",
    savingConsentUpdateErrorFallback: "Imeshindwa kubadilisha mpangilio huu.",
    savingConsentUpdateSuccess: "Mpangilio wako wa akiba umesasishwa.",

    genericErrorFallback: "Hitilafu imetokea. Tafadhali jaribu tena.",
  },
} as const satisfies Record<Language, Record<string, string>>;

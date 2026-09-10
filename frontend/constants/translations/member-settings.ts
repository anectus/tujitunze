import type { Language } from "@/lib/context/LanguageContext";

export const memberSettingsTranslations = {
  en: {
    backToProfile: "Back to Profile",
    title: "Settings",
    description:
      "Change your password, or add more phone numbers and bank accounts as income sources for your wallet. Your name, NIDA number, and email can't be changed here.",

    userSettingsTab: "User Settings",
    securitySettingsTab: "Security Settings",

    loadingSettings: "Loading your settings...",
    onboardingCompleteBanner:
      "Your onboarding is complete. You can now manage your linked accounts.",

    accountSecurityGroupTitle: "Account Security",
    accountSecurityGroupDescription:
      "Manage your password and keep your account protected.",
    walletSourcesGroupTitle: "Wallet Sources",
    walletSourcesGroupDescription:
      "Link the phone numbers and bank accounts your Health Wallet can draw contributions from.",
    microSavingsGroupTitle: "Micro-Savings Preferences",
    microSavingsGroupDescription:
      "Control whether small amounts are automatically saved from your everyday transactions.",

    linkedAccountsTitle: "Linked Accounts",
    linkedAccountsDescription:
      "Phone numbers and bank accounts currently linked to your Health Wallet.",
    primary: "Primary",
    unknownNetwork: "Unknown network",
    unknownBank: "Unknown bank",
    remove: "Remove",
    removing: "Removing...",
    cancel: "Cancel",
    addAccountTooltip: "Link a new source for your Health Wallet.",
    removeAccountTooltip: "Stops wallet contributions from this source.",
    savingConsentRequiredAlert:
      "Turn on Automatic Micro-Savings above before adding a new phone number or bank account.",
    removeAccountConfirmTitle: "Unlink this account?",
    removeAccountConfirmMessageTemplate:
      "Are you sure you want to unlink {account}? This will stop wallet contributions from this source.",
    removeAccountSuccess: "Account removed successfully.",
    removeAccountErrorFallback: "Failed to remove account. Please try again.",

    inactiveBadge: "Inactive",
    reactivate: "Reactivate",
    reactivating: "Reactivating...",
    reactivateAccountTooltip: "Brings this source back online for wallet contributions.",
    reactivateAccountSuccess: "Account reactivated successfully.",
    reactivateAccountErrorFallback: "Failed to reactivate account. Please try again.",
    deletePermanently: "Delete Permanently",
    deleting: "Deleting...",
    deleteAccountTooltip:
      "Permanently removes this account from your profile. This can't be undone.",
    deleteAccountConfirmTitle: "Permanently delete this account?",
    deleteAccountConfirmMessageTemplate:
      "Are you sure you want to permanently delete {account}? This cannot be undone.",
    deleteAccountSuccess: "Account deleted permanently.",
    deleteAccountErrorFallback: "Failed to delete account. Please try again.",

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
    simType: "SIM Type",
    simTypeStandard: "Standard",
    simTypeM2M: "M2M (device)",
    simTypeTooltipStandard: "You may hold one SIM per operator under your NIDA.",
    simTypeTooltipM2M: "Up to 4 M2M SIMs per operator are allowed.",
    m2mBadge: "M2M",
    simSlotFullStandard:
      "You already have a {operator} SIM registered under your NIDA. Only one standard SIM per operator is allowed.",
    simSlotFullM2M:
      "You already have the maximum of {limit} M2M SIMs registered with {operator}.",

    addBankTitle: "Add Bank Account",
    addBankDescription: "Link another bank account as a source for your wallet.",
    bank: "Bank",
    selectBank: "Select bank",
    accountNumber: "Account Number",
    accountType: "Account Type",
    selectAccountType: "Select account type",
    savings: "Savings",
    current: "Current",
    currency: "Currency",
    accountCapacity: "Account Capacity",
    capacityIndividual: "Individual",
    capacityJoint: "Joint",
    addBankButton: "Add Bank Account",
    addBankErrorFallback: "Unable to add this bank account.",
    addBankSuccessTemplate: "Account {accountNumber} was added to your account.",

    savingConsentTitle: "Automatic Micro-Savings",
    savingConsentDescription:
      "When this is on, a small share of eligible telecom bundle purchases and mobile-money transactions is automatically saved into your Health Wallet. Turning it off stops new savings — it does not affect money already saved.",
    savingConsentOn: "On — savings are active",
    savingConsentOff: "Off — no new savings will be applied",
    savingConsentUpdateErrorFallback:
      "Could not update savings preference. Please try again.",
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

    loadingSettings: "Inapakia mipangilio yako...",
    onboardingCompleteBanner:
      "Usajili wako umekamilika. Sasa unaweza kusimamia akaunti zako zilizounganishwa.",

    accountSecurityGroupTitle: "Usalama wa Akaunti",
    accountSecurityGroupDescription:
      "Simamia nywila yako na uweke akaunti yako salama.",
    walletSourcesGroupTitle: "Vyanzo vya Mkoba",
    walletSourcesGroupDescription:
      "Unganisha namba za simu na akaunti za benki ambazo Mkoba wako wa Afya unaweza kupokea michango kutoka kwake.",
    microSavingsGroupTitle: "Mapendeleo ya Akiba Ndogo Ndogo",
    microSavingsGroupDescription:
      "Dhibiti kama kiasi kidogo kinahifadhiwa kiotomatiki kutoka kwenye miamala yako ya kila siku.",

    linkedAccountsTitle: "Akaunti Zilizounganishwa",
    linkedAccountsDescription:
      "Namba za simu na akaunti za benki ambazo tayari zimeunganishwa na Mkoba wako wa Afya.",
    primary: "Msingi",
    unknownNetwork: "Mtandao usiojulikana",
    unknownBank: "Benki isiyojulikana",
    remove: "Ondoa",
    removing: "Inaondoa...",
    cancel: "Ghairi",
    addAccountTooltip: "Unganisha chanzo kipya kwa Mkoba wako wa Afya.",
    removeAccountTooltip: "Inasitisha michango ya mkoba kutoka chanzo hiki.",
    savingConsentRequiredAlert:
      "Washa Akiba Ndogo Ndogo Kiotomatiki hapo juu kabla ya kuongeza namba mpya ya simu au akaunti ya benki.",
    removeAccountConfirmTitle: "Ondoa akaunti hii?",
    removeAccountConfirmMessageTemplate:
      "Una uhakika unataka kuondoa {account}? Hii itasitisha michango ya mkoba kutoka chanzo hiki.",
    removeAccountSuccess: "Akaunti imeondolewa kikamilifu.",
    removeAccountErrorFallback: "Imeshindwa kuondoa akaunti. Tafadhali jaribu tena.",

    inactiveBadge: "Haitumiki",
    reactivate: "Rejesha",
    reactivating: "Inarejesha...",
    reactivateAccountTooltip: "Inarejesha chanzo hiki kwa michango ya mkoba.",
    reactivateAccountSuccess: "Akaunti imerejeshwa kikamilifu.",
    reactivateAccountErrorFallback: "Imeshindwa kurejesha akaunti. Tafadhali jaribu tena.",
    deletePermanently: "Futa Kabisa",
    deleting: "Inafuta...",
    deleteAccountTooltip:
      "Inaondoa akaunti hii kabisa kwenye wasifu wako. Hatua hii haiwezi kutenduliwa.",
    deleteAccountConfirmTitle: "Futa akaunti hii kabisa?",
    deleteAccountConfirmMessageTemplate:
      "Una uhakika unataka kufuta {account} kabisa? Hatua hii haiwezi kutenduliwa.",
    deleteAccountSuccess: "Akaunti imefutwa kabisa.",
    deleteAccountErrorFallback: "Imeshindwa kufuta akaunti. Tafadhali jaribu tena.",

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
    simType: "Aina ya SIM",
    simTypeStandard: "Kawaida",
    simTypeM2M: "M2M (kifaa)",
    simTypeTooltipStandard: "Unaweza kuwa na SIM moja kwa kila mtandao chini ya NIDA yako.",
    simTypeTooltipM2M: "SIM 4 za M2M kwa kila mtandao zinaruhusiwa.",
    m2mBadge: "M2M",
    simSlotFullStandard:
      "Tayari una SIM ya {operator} iliyosajiliwa chini ya NIDA yako. SIM moja tu kwa kila mtandao inaruhusiwa kwa matumizi ya kawaida.",
    simSlotFullM2M:
      "Tayari umefikia kikomo cha SIM {limit} za M2M kwa {operator}.",

    addBankTitle: "Ongeza Akaunti ya Benki",
    addBankDescription: "Unganisha akaunti nyingine ya benki kama chanzo cha mkoba wako.",
    bank: "Benki",
    selectBank: "Chagua benki",
    accountNumber: "Namba ya Akaunti",
    accountType: "Aina ya Akaunti",
    selectAccountType: "Chagua aina ya akaunti",
    savings: "Akiba",
    current: "Ya Sasa",
    currency: "Sarafu",
    accountCapacity: "Uwezo wa Akaunti",
    capacityIndividual: "Binafsi",
    capacityJoint: "Pamoja",
    addBankButton: "Ongeza Akaunti ya Benki",
    addBankErrorFallback: "Imeshindwa kuongeza akaunti hii ya benki.",
    addBankSuccessTemplate: "Akaunti {accountNumber} imeongezwa kwenye akaunti yako.",

    savingConsentTitle: "Akiba Ndogo Ndogo Kiotomatiki",
    savingConsentDescription:
      "Ukiwasha hii, sehemu ndogo ya manunuzi ya vifurushi vya simu na miamala ya pesa za simu inayostahili itahifadhiwa kiotomatiki kwenye Mkoba wako wa Afya. Kuzima hakuathiri fedha ambazo tayari zimehifadhiwa — kunazuia tu akiba mpya.",
    savingConsentOn: "Imewashwa — akiba inaendelea",
    savingConsentOff: "Imezimwa — hakuna akiba mpya itakayowekwa",
    savingConsentUpdateErrorFallback:
      "Imeshindwa kusasisha mpangilio wa akiba. Tafadhali jaribu tena.",
    savingConsentUpdateSuccess: "Mpangilio wako wa akiba umesasishwa.",

    genericErrorFallback: "Hitilafu imetokea. Tafadhali jaribu tena.",
  },
} as const satisfies Record<Language, Record<string, string>>;

import type { Language } from "@/lib/context/LanguageContext";

export const telecomMembersTranslations = {
  en: {
    headerTitle: "Registered Members",
    subtitle: "Members with at least one phone number on this operator's network.",
    loadError: "Unable to load registered members.",
    emptyState: "No members found on this network.",
    name: "Name",
    memberStatus: "Member Status",
    phoneNumbers: "Phone Numbers",
    membershipVerification: "Membership Verification",
    primary: "(Primary)",
    verified: "Verified",
    notVerified: "Not verified",
    previous: "Previous",
    next: "Next",
    pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  },
  sw: {
    headerTitle: "Wanachama Waliosajiliwa",
    subtitle: "Wanachama wenye angalau namba moja ya simu kwenye mtandao wa mtoa huduma huyu.",
    loadError: "Imeshindwa kupakia wanachama waliosajiliwa.",
    emptyState: "Hakuna wanachama waliopatikana kwenye mtandao huu.",
    name: "Jina",
    memberStatus: "Hali ya Mwanachama",
    phoneNumbers: "Namba za Simu",
    membershipVerification: "Uthibitisho wa Uanachama",
    primary: "(Kikuu)",
    verified: "Imethibitishwa",
    notVerified: "Haijathibitishwa",
    previous: "Iliyotangulia",
    next: "Inayofuata",
    pageOf: (page: number, total: number) => `Ukurasa ${page} kati ya ${total}`,
  },
// Interpolation helpers below take varying parameter shapes (number/string) per key,
// which TypeScript's function-parameter contravariance can't unify without `any` here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as const satisfies Record<Language, Record<string, string | ((...args: any[]) => string)>>;

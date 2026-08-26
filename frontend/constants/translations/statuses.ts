import type { Language } from "@/lib/context/LanguageContext";
import type { StatusDomain } from "@/constants/statuses";

// Mirrors the domain/status key shape of constants/statuses.ts — that file
// stays the single source of truth for tone/color (language-independent),
// this one is the single source of truth for the label text StatusBadge
// renders. Keys are lowercase to match getStatusStyle's lookup.
export const statusLabelTranslations = {
  en: {
    claim: {
      draft: "Draft",
      submitted: "Submitted",
      under_review: "Under Review",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      disputed: "Disputed",
    },
    coverage: {
      active: "Active",
      pending_activation: "Pending Activation",
      suspended: "Suspended",
      expired: "Expired",
    },
    transaction: {
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
      reversed: "Reversed",
    },
    member: {
      pending: "Pending Verification",
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
    },
    partner: {
      active: "Active",
      inactive: "Inactive",
      suspended: "Suspended",
    },
    unknown: "Unknown",
  },
  sw: {
    claim: {
      draft: "Rasimu",
      submitted: "Imewasilishwa",
      under_review: "Inakaguliwa",
      pending: "Inasubiri",
      approved: "Imeidhinishwa",
      rejected: "Imekataliwa",
      disputed: "Inapingwa",
    },
    coverage: {
      active: "Hai",
      pending_activation: "Inasubiri Uamilishaji",
      suspended: "Imesimamishwa",
      expired: "Imeisha Muda",
    },
    transaction: {
      completed: "Imekamilika",
      pending: "Inasubiri",
      failed: "Imeshindwa",
      reversed: "Imerejeshwa",
    },
    member: {
      pending: "Inasubiri Uthibitisho",
      active: "Hai",
      inactive: "Haifanyi Kazi",
      suspended: "Imesimamishwa",
    },
    partner: {
      active: "Hai",
      inactive: "Haifanyi Kazi",
      suspended: "Imesimamishwa",
    },
    unknown: "Haijulikani",
  },
} as const satisfies Record<
  Language,
  Record<StatusDomain, Record<string, string>> & { unknown: string }
>;

export function getStatusLabel(
  language: Language,
  domain: StatusDomain,
  status: string
): string {
  const table = statusLabelTranslations[language];
  const domainTable = table[domain] as Record<string, string>;
  return domainTable[status.toLowerCase()] ?? table.unknown;
}

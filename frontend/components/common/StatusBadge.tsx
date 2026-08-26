"use client";

import Badge from "@/components/ui/Badge";
import { getStatusStyle, StatusDomain } from "@/constants/statuses";
import { useLanguage } from "@/lib/context/LanguageContext";
import { getStatusLabel } from "@/constants/translations/statuses";

interface StatusBadgeProps {
  domain: StatusDomain;
  status: string;
  className?: string;
}

// Drop-in badge for any claim/coverage/transaction/member status value
// coming straight from the API — looks up the color from the single status
// reference in constants/statuses.ts, and the label text from the
// language-aware translation table, so neither needs to be picked by hand
// at the call site.
export default function StatusBadge({
  domain,
  status,
  className,
}: StatusBadgeProps) {
  const { language } = useLanguage();
  const style = getStatusStyle(domain, status);
  const label = getStatusLabel(language, domain, status);

  return (
    <Badge tone={style.tone} className={className}>
      {label}
    </Badge>
  );
}

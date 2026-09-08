import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

export interface QuickAction {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface QuickActionsProps {
  actions: readonly QuickAction[];
}

// Reusable row of quick-access buttons for a dashboard's most common
// write/navigation actions (e.g. Super-admin's "Create Administrator").
// Each action is just a styled Link to a real, already-guarded route —
// this component adds no access control of its own, since the
// destination page/endpoint is what actually enforces it.
export default function QuickActions({ actions }: QuickActionsProps) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#064E3B] shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </div>
  );
}

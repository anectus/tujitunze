import type { ComponentType, SVGProps } from "react";

interface StatisticCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export default function StatisticCard({
  label,
  value,
  hint,
  icon: Icon,
}: StatisticCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">

      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#064E3B]">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>

      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>

      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}

    </div>
  );
}

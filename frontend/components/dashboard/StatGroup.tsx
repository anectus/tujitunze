interface StatGroupProps {
  title: string;
  children: React.ReactNode;
}

// One titled group of stat cards (e.g. "System Overview", "Institutions",
// "Governance") sharing a responsive grid — the grouping unit the
// Super-admin dashboard introduced, reused on its sibling pages
// (Administrators/Roles & Permissions/Saving Rules/Audit Logs) so every
// page in that route group reads as one consistent design system rather
// than the dashboard being a one-off.
export default function StatGroup({ title, children }: StatGroupProps) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {children}
      </div>
    </section>
  );
}

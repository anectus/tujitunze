interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

// Title + optional subtitle + divider for one top-level dashboard content
// section (e.g. Member dashboard's Overview/Insights/Quick Access).
// Mirrors StatGroup's own spacing (mt-10 first:mt-0) so a page mixing
// this with StatGroup still reads as one consistent rhythm, but adds the
// subtitle line and divider rule StatGroup's dense stat-card grid header
// doesn't need.
export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mt-10 border-b border-gray-100 pb-3 first:mt-0">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
}

import Sidebar, { SidebarNavItem } from "@/components/common/Sidebar";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import type { roleLabelTranslations } from "@/constants/translations/common";

interface DashboardLayoutProps {
  roleLabel: keyof (typeof roleLabelTranslations)["en"];
  navItems: readonly SidebarNavItem[];
  children: React.ReactNode;
}

// Persistent chrome for every staff route group (Admin, Super-admin,
// Bank, Telecom, Insurance) — mounted once in each group's
// layout.tsx so the sidebar's own links never leave the shell partway
// through navigation.
export default function DashboardLayout({
  roleLabel,
  navItems,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">

      <Sidebar roleLabel={roleLabel} navItems={navItems} />

      <div className="flex min-h-screen flex-col pt-14 md:pt-0 md:pl-64">
        <div className="flex-1">{children}</div>
        <DashboardFooter />
      </div>

    </div>
  );
}

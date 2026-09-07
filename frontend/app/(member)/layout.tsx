import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

// Real (member) pages only — see frontend AGENTS notes elsewhere in the
// codebase about not copying a nav entry without checking the page
// exists first.
const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/dashboard" },
  { labelKey: "wallet", href: "/wallet" },
  { labelKey: "savings", href: "/savings" },
  { labelKey: "insurance", href: "/insurance/plans" },
  { labelKey: "telecom", href: "/telecom" },
  { labelKey: "membership", href: "/membership" },
  { labelKey: "verifications", href: "/verifications" },
  { labelKey: "notifications", href: "/notifications" },
  { labelKey: "reports", href: "/reports" },
  { labelKey: "qrCode", href: "/qr" },
  { labelKey: "profile", href: "/profile" },
  { labelKey: "settings", href: "/settings" },
] as const;

export default function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Member"]}>
      <DashboardLayout roleLabel="Member" navItems={NAV_ITEMS}>
        <DashboardHeader />
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

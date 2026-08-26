import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/admin/dashboard" },
  { labelKey: "members", href: "/members" },
  { labelKey: "auditLogs", href: "/audit-logs" },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout roleLabel="Admin" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

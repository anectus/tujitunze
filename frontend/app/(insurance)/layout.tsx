import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [{ labelKey: "dashboard", href: "/insurance/dashboard" }] as const;

export default function InsuranceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Insurance"]}>
      <DashboardLayout roleLabel="Insurance" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

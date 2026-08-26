import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/bank/dashboard" },
  { labelKey: "bankProfile", href: "/bank/profile" },
  { labelKey: "fundAccounts", href: "/bank/fund-accounts" },
  { labelKey: "transactions", href: "/bank/transactions" },
  { labelKey: "settlements", href: "/bank/settlements" },
  { labelKey: "reconciliation", href: "/bank/reconciliation" },
  { labelKey: "reports", href: "/bank/reports" },
  { labelKey: "auditSecurity", href: "/bank/audit-logs" },
] as const;

export default function BankLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Bank"]}>
      <DashboardLayout roleLabel="Bank" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

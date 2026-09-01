import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const NAV_ITEMS = [
  { labelKey: "dashboard", href: "/telecom/dashboard" },
  { labelKey: "operatorProfile", href: "/telecom/operator" },
  { labelKey: "registeredMembers", href: "/telecom/members" },
  { labelKey: "contributionTransactions", href: "/telecom/contributions" },
  { labelKey: "usageContributions", href: "/telecom/usage-contributions" },
  { labelKey: "contributionRules", href: "/telecom/contribution-rules" },
  { labelKey: "reconciliation", href: "/telecom/reconciliation" },
  { labelKey: "reports", href: "/telecom/reports" },
  { labelKey: "auditSecurity", href: "/telecom/audit-logs" },
] as const;

export default function TelecomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={["Telecom"]}>
      <DashboardLayout roleLabel="Telecom" navItems={NAV_ITEMS}>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

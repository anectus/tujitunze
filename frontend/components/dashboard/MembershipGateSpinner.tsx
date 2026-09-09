// Shown by every Member page gated on membershipComplete (Dashboard,
// Settings, Profile) while the flag is still resolving, and briefly
// while a redirect triggered by useMembershipGate is in flight — never
// alongside real page content underneath it.
export default function MembershipGateSpinner({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      <p className="text-base text-gray-500">{label}</p>
    </div>
  );
}

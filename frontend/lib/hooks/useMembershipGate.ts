"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMembershipStatus } from "@/lib/hooks/useMembershipStatus";

// The real "Complete Your Membership" form — see CLAUDE.md's route-
// mapping note: kept at its existing, already-linked-from-everywhere
// path rather than a new /membership/complete URL.
const MEMBERSHIP_COMPLETE_PATH = "/onboarding/mobile-money";

type GateMode =
  // Default — for pages a member should only reach once their profile
  // is complete (Dashboard, Settings). Redirects away the moment the
  // flag resolves to false.
  | "requireComplete"
  // For the completion form itself: bounces an ALREADY-complete member
  // back to the dashboard, so a stale bookmark/link from before they
  // finished onboarding doesn't re-open the form pointlessly.
  //
  // NOT applied to MobileMoneyAccountForm today — that form is also the
  // only "edit profile" entry point this app has (see ProfilePage's
  // "Edit Profile" / "Add Another" links, which deliberately send an
  // already-complete member back here). A hard redirect-away would
  // silently break that real, working feature, so this mode exists but
  // is intentionally unused until edit-vs-first-time-setup are told
  // apart some other way.
  | "requireIncomplete";

// Single place a Member page checks membershipComplete and reacts to it
// — used by the dashboard and settings pages so they can't diverge on
// when/whether to gate. Returns the same null | boolean
// useMembershipStatus does, so a page can still render its own loading
// state while this resolves.
export function useMembershipGate(
  mode: GateMode = "requireComplete"
): boolean | null {
  const router = useRouter();
  const membershipComplete = useMembershipStatus();

  useEffect(() => {
    if (mode === "requireComplete" && membershipComplete === false) {
      router.replace(`${MEMBERSHIP_COMPLETE_PATH}?reason=incomplete`);
    } else if (mode === "requireIncomplete" && membershipComplete === true) {
      router.replace("/dashboard");
    }
  }, [mode, membershipComplete, router]);

  return membershipComplete;
}

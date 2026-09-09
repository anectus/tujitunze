"use client";

import { useEffect, useState } from "react";

import { getAccessToken } from "@/lib/utils/permissions";
import { API_URL } from "@/lib/utils/api";

// Fetch-only — no redirect. Used where a component just needs to know
// the state (e.g. the member sidebar deciding which nav items to show),
// as opposed to useMembershipGate, which also acts on it. null means
// "not resolved yet" (no token, or the request hasn't returned).
export function useMembershipStatus(): boolean | null {
  const [membershipComplete, setMembershipComplete] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    fetch(`${API_URL}/members/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((profile) =>
        setMembershipComplete(!!profile && profile.membershipComplete === true)
      )
      .catch(() => setMembershipComplete(false));
  }, []);

  return membershipComplete;
}

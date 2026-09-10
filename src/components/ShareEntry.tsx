"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredParticipant } from "@/lib/participant";
import type { TripStats } from "@/lib/tripStats";
import { NamePicker } from "./NamePicker";

export function ShareEntry({
  shareToken,
  participants,
  redirectTo,
  stats,
}: {
  shareToken: string;
  participants: { id: string; name: string }[];
  redirectTo: string;
  stats: TripStats;
}) {
  const router = useRouter();
  const [{ stored, checked }, setStoredState] = useState<{
    stored: { id: string; name: string } | null;
    checked: boolean;
  }>({ stored: null, checked: false });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount localStorage read to avoid a hydration mismatch
    setStoredState({ stored: getStoredParticipant(shareToken), checked: true });
  }, [shareToken]);

  const stillValid = stored !== null && participants.some((p) => p.id === stored.id);

  useEffect(() => {
    if (checked && stillValid) router.replace(redirectTo);
  }, [checked, stillValid, redirectTo, router]);

  if (!checked || stillValid) return null;

  return (
    <NamePicker
      shareToken={shareToken}
      participants={participants}
      redirectTo={redirectTo}
      stats={stats}
    />
  );
}

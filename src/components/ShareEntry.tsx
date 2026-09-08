"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredParticipant } from "@/lib/participant";
import { NamePicker } from "./NamePicker";

export function ShareEntry({
  shareToken,
  participants,
  redirectTo,
}: {
  shareToken: string;
  participants: { id: string; name: string }[];
  redirectTo: string;
}) {
  const router = useRouter();
  const [stored] = useState(() => getStoredParticipant(shareToken));
  const stillValid = stored !== null && participants.some((p) => p.id === stored.id);

  useEffect(() => {
    if (stillValid) router.replace(redirectTo);
  }, [stillValid, redirectTo, router]);

  if (stillValid) return null;

  return (
    <NamePicker shareToken={shareToken} participants={participants} redirectTo={redirectTo} />
  );
}

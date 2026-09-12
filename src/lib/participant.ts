export type StoredParticipant = { id: string; name: string };

function key(shareToken: string) {
  return `fp:${shareToken}:participant`;
}

export function getStoredParticipant(shareToken: string): StoredParticipant | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(shareToken));
    return raw ? (JSON.parse(raw) as StoredParticipant) : null;
  } catch {
    return null;
  }
}

export function setStoredParticipant(shareToken: string, participant: StoredParticipant) {
  localStorage.setItem(key(shareToken), JSON.stringify(participant));
}

export function clearStoredParticipant(shareToken: string) {
  localStorage.removeItem(key(shareToken));
}

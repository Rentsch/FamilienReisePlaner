export type PackingStats = {
  totalCount: number;
  claimedCount: number;
  packedCount: number;
};

export function computePackingStats(items: { claimedByParticipantId: string | null; isPacked: boolean }[]): PackingStats {
  return {
    totalCount: items.length,
    claimedCount: items.filter((i) => i.claimedByParticipantId !== null).length,
    packedCount: items.filter((i) => i.isPacked).length,
  };
}

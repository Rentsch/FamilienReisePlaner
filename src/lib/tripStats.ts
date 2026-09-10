export type TripStats = {
  participantCount: number;
  adultCount: number;
  kidCount: number;
  bikeCount: number;
  vehicleCount: number;
  variantCount: number;
};

export function computeTripStats({
  participants,
  vehicleCount,
  variantCount,
}: {
  participants: { hasBike: boolean; person: { backSeatOnly: boolean } }[];
  vehicleCount: number;
  variantCount: number;
}): TripStats {
  const kidCount = participants.filter((p) => p.person.backSeatOnly).length;
  return {
    participantCount: participants.length,
    adultCount: participants.length - kidCount,
    kidCount,
    bikeCount: participants.filter((p) => p.hasBike).length,
    vehicleCount,
    variantCount,
  };
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShareEntry } from "@/components/ShareEntry";

export default async function ShareTokenPage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareToken },
    include: { participants: { include: { person: true } } },
  });

  if (!trip) notFound();

  const participants = trip.participants.map((p) => ({ id: p.id, name: p.person.name }));

  return (
    <ShareEntry
      shareToken={shareToken}
      participants={participants}
      redirectTo={`/t/${shareToken}/trip`}
    />
  );
}

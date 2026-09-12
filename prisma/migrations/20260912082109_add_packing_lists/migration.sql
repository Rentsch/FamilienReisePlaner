-- CreateTable
CREATE TABLE "PackingListTemplate" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackingListTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingListTemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PackingListTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripPackingItem" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "claimedByParticipantId" TEXT,
    "isPacked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripPackingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripPackingItem_tripId_idx" ON "TripPackingItem"("tripId");

-- AddForeignKey
ALTER TABLE "PackingListTemplateItem" ADD CONSTRAINT "PackingListTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PackingListTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPackingItem" ADD CONSTRAINT "TripPackingItem_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripPackingItem" ADD CONSTRAINT "TripPackingItem_claimedByParticipantId_fkey" FOREIGN KEY ("claimedByParticipantId") REFERENCES "TripParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

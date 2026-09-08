-- DropForeignKey
ALTER TABLE "Bike" DROP CONSTRAINT "Bike_ownerPersonId_fkey";

-- DropForeignKey
ALTER TABLE "Bike" DROP CONSTRAINT "Bike_tripId_fkey";

-- DropForeignKey
ALTER TABLE "BikeAssignment" DROP CONSTRAINT "BikeAssignment_bikeId_fkey";

-- DropForeignKey
ALTER TABLE "BikeAssignment" DROP CONSTRAINT "BikeAssignment_trailerId_fkey";

-- DropForeignKey
ALTER TABLE "BikeAssignment" DROP CONSTRAINT "BikeAssignment_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Person" DROP CONSTRAINT "Person_tripId_fkey";

-- DropForeignKey
ALTER TABLE "PersonAssignment" DROP CONSTRAINT "PersonAssignment_personId_fkey";

-- DropForeignKey
ALTER TABLE "PersonAssignment" DROP CONSTRAINT "PersonAssignment_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Trailer" DROP CONSTRAINT "Trailer_tripId_fkey";

-- DropForeignKey
ALTER TABLE "TrailerAssignment" DROP CONSTRAINT "TrailerAssignment_trailerId_fkey";

-- DropForeignKey
ALTER TABLE "TrailerAssignment" DROP CONSTRAINT "TrailerAssignment_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_createdByPersonId_fkey";

-- DropForeignKey
ALTER TABLE "VariantVehiclePlan" DROP CONSTRAINT "VariantVehiclePlan_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "Vehicle" DROP CONSTRAINT "Vehicle_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_personId_fkey";

-- DropIndex
DROP INDEX "BikeAssignment_variantId_bikeId_key";

-- DropIndex
DROP INDEX "Person_tripId_name_key";

-- DropIndex
DROP INDEX "PersonAssignment_variantId_personId_key";

-- DropIndex
DROP INDEX "TrailerAssignment_variantId_trailerId_key";

-- DropIndex
DROP INDEX "VariantVehiclePlan_variantId_vehicleId_key";

-- DropIndex
DROP INDEX "Vote_tripId_personId_key";

-- AlterTable
ALTER TABLE "BikeAssignment" DROP COLUMN "bikeId",
DROP COLUMN "trailerId",
DROP COLUMN "vehicleId",
ADD COLUMN     "tripParticipantId" TEXT NOT NULL,
ADD COLUMN     "tripTrailerId" TEXT,
ADD COLUMN     "tripVehicleId" TEXT;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "tripId",
ADD COLUMN     "adminUserId" TEXT NOT NULL,
ADD COLUMN     "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "PersonAssignment" DROP COLUMN "personId",
DROP COLUMN "vehicleId",
ADD COLUMN     "tripParticipantId" TEXT NOT NULL,
ADD COLUMN     "tripVehicleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Trailer" DROP COLUMN "tripId",
ADD COLUMN     "adminUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TrailerAssignment" DROP COLUMN "trailerId",
DROP COLUMN "vehicleId",
ADD COLUMN     "tripTrailerId" TEXT NOT NULL,
ADD COLUMN     "tripVehicleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "createdByPersonId",
ADD COLUMN     "createdByParticipantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VariantVehiclePlan" DROP COLUMN "vehicleId",
ADD COLUMN     "tripVehicleId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "tripId",
ADD COLUMN     "adminUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Vote" DROP COLUMN "personId",
ADD COLUMN     "tripParticipantId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Bike";

-- CreateTable
CREATE TABLE "TripParticipant" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "hasBike" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TripParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripVehicle" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "TripVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripTrailer" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "trailerId" TEXT NOT NULL,

    CONSTRAINT "TripTrailer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TripParticipant_tripId_personId_key" ON "TripParticipant"("tripId", "personId");

-- CreateIndex
CREATE UNIQUE INDEX "TripVehicle_tripId_vehicleId_key" ON "TripVehicle"("tripId", "vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "TripTrailer_tripId_trailerId_key" ON "TripTrailer"("tripId", "trailerId");

-- CreateIndex
CREATE UNIQUE INDEX "BikeAssignment_variantId_tripParticipantId_key" ON "BikeAssignment"("variantId", "tripParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_adminUserId_name_key" ON "Person"("adminUserId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PersonAssignment_variantId_tripParticipantId_key" ON "PersonAssignment"("variantId", "tripParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "TrailerAssignment_variantId_tripTrailerId_key" ON "TrailerAssignment"("variantId", "tripTrailerId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantVehiclePlan_variantId_tripVehicleId_key" ON "VariantVehiclePlan"("variantId", "tripVehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_tripParticipantId_key" ON "Vote"("tripParticipantId");

-- CreateIndex
CREATE INDEX "Vote_tripId_idx" ON "Vote"("tripId");

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripParticipant" ADD CONSTRAINT "TripParticipant_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVehicle" ADD CONSTRAINT "TripVehicle_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripVehicle" ADD CONSTRAINT "TripVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTrailer" ADD CONSTRAINT "TripTrailer_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripTrailer" ADD CONSTRAINT "TripTrailer_trailerId_fkey" FOREIGN KEY ("trailerId") REFERENCES "Trailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_createdByParticipantId_fkey" FOREIGN KEY ("createdByParticipantId") REFERENCES "TripParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAssignment" ADD CONSTRAINT "PersonAssignment_tripParticipantId_fkey" FOREIGN KEY ("tripParticipantId") REFERENCES "TripParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonAssignment" ADD CONSTRAINT "PersonAssignment_tripVehicleId_fkey" FOREIGN KEY ("tripVehicleId") REFERENCES "TripVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeAssignment" ADD CONSTRAINT "BikeAssignment_tripParticipantId_fkey" FOREIGN KEY ("tripParticipantId") REFERENCES "TripParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeAssignment" ADD CONSTRAINT "BikeAssignment_tripVehicleId_fkey" FOREIGN KEY ("tripVehicleId") REFERENCES "TripVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BikeAssignment" ADD CONSTRAINT "BikeAssignment_tripTrailerId_fkey" FOREIGN KEY ("tripTrailerId") REFERENCES "TripTrailer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrailerAssignment" ADD CONSTRAINT "TrailerAssignment_tripTrailerId_fkey" FOREIGN KEY ("tripTrailerId") REFERENCES "TripTrailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrailerAssignment" ADD CONSTRAINT "TrailerAssignment_tripVehicleId_fkey" FOREIGN KEY ("tripVehicleId") REFERENCES "TripVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantVehiclePlan" ADD CONSTRAINT "VariantVehiclePlan_tripVehicleId_fkey" FOREIGN KEY ("tripVehicleId") REFERENCES "TripVehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_tripParticipantId_fkey" FOREIGN KEY ("tripParticipantId") REFERENCES "TripParticipant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


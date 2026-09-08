
-- CreateEnum
CREATE TYPE "SeatRow" AS ENUM ('FRONT', 'BACK');

-- DropForeignKey
ALTER TABLE "BikeAssignment" DROP CONSTRAINT "BikeAssignment_tripTrailerId_fkey";

-- DropForeignKey
ALTER TABLE "BikeAssignment" DROP CONSTRAINT "BikeAssignment_tripVehicleId_fkey";

-- AlterTable
ALTER TABLE "BikeAssignment" DROP COLUMN "tripVehicleId",
ALTER COLUMN "tripTrailerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "backSeatOnly" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PersonAssignment" ADD COLUMN     "isDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "row" "SeatRow" NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "frontSeats" INTEGER NOT NULL DEFAULT 2;

-- AddForeignKey
ALTER TABLE "BikeAssignment" ADD CONSTRAINT "BikeAssignment_tripTrailerId_fkey" FOREIGN KEY ("tripTrailerId") REFERENCES "TripTrailer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


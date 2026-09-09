-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "travelTimeMinutes" INTEGER,
ADD COLUMN     "travelTimeWithBikeTrailerMinutes" INTEGER,
ADD COLUMN     "travelTimeWithCargoTrailerMinutes" INTEGER;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "travelTimeMinutes",
DROP COLUMN "travelTimeWithTrailerMinutes";


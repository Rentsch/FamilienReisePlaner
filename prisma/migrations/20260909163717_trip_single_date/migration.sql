-- Replace Trip.startDate/endDate with a single Trip.date (trips are one-way journeys, not date ranges)
ALTER TABLE "Trip" RENAME COLUMN "startDate" TO "date";
ALTER TABLE "Trip" DROP COLUMN "endDate";

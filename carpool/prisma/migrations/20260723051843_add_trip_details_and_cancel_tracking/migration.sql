-- AlterTable
ALTER TABLE "public"."Ride" ADD COLUMN     "cancelledById" TEXT,
ADD COLUMN     "hasDriver" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tripDriverName" TEXT,
ADD COLUMN     "tripVehicleNumber" TEXT;

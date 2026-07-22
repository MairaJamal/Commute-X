-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "destAddress" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "vehicleInfo" TEXT,
    "distanceKm" REAL,
    "tolls" REAL NOT NULL DEFAULT 20,
    "serviceFeePerRider" REAL NOT NULL DEFAULT 6,
    "totalFare" REAL,
    "sharePerRider" REAL,
    "riderCount" INTEGER NOT NULL DEFAULT 2,
    "fareAgreedAt" DATETIME,
    "fareAgreedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "confirmedAt" DATETIME,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    CONSTRAINT "Ride_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CommuteRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RideParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fareShare" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RideParticipant_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RideParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Ride_requestId_status_idx" ON "Ride"("requestId", "status");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "RideParticipant_rideId_userId_key" ON "RideParticipant"("rideId", "userId");

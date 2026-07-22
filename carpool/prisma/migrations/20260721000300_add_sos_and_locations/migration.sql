-- CreateTable
CREATE TABLE "SosEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rideId" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'triggered',
    "notifiedContacts" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" DATETIME,
    CONSTRAINT "SosEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SosEvent_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RideLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RideLocation_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RideLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SosEvent_userId_createdAt_idx" ON "SosEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RideLocation_rideId_createdAt_idx" ON "RideLocation"("rideId", "createdAt");

-- CreateIndex
CREATE INDEX "RideLocation_rideId_userId_createdAt_idx" ON "RideLocation"("rideId", "userId", "createdAt");

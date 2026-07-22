-- AlterTable: add password hash for real authentication
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- AlterTable: add audit trail fields to SosEvent
ALTER TABLE "SosEvent" ADD COLUMN "resolvedAt" DATETIME;
ALTER TABLE "SosEvent" ADD COLUMN "notifyResults" TEXT;

-- CreateTable: sessions for real login (replaces the forgeable plaintext cookie)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable: live location trail for an active SOS event
CREATE TABLE "SosLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sosEventId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SosLocation_sosEventId_fkey" FOREIGN KEY ("sosEventId") REFERENCES "SosEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "SosLocation_sosEventId_createdAt_idx" ON "SosLocation"("sosEventId", "createdAt");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "avatarText" TEXT NOT NULL,
    "rating" REAL NOT NULL DEFAULT 5.0,
    "ridesCompleted" INTEGER NOT NULL DEFAULT 0,
    "memberSince" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "usualRoute" TEXT NOT NULL,
    "chatStyle" TEXT NOT NULL,
    "musicStyle" TEXT NOT NULL,
    "womenOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "willingToDrive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommuteRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" REAL NOT NULL,
    "pickupLng" REAL NOT NULL,
    "destAddress" TEXT NOT NULL,
    "destLat" REAL NOT NULL,
    "destLng" REAL NOT NULL,
    "departureTime" TEXT NOT NULL,
    "flexibilityWindow" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "willingToDrive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommuteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

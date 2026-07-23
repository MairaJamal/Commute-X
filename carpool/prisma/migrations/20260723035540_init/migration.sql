-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "avatarText" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "ridesCompleted" INTEGER NOT NULL DEFAULT 0,
    "memberSince" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usualRoute" TEXT NOT NULL,
    "chatStyle" TEXT NOT NULL,
    "musicStyle" TEXT NOT NULL,
    "womenOnlyMode" BOOLEAN NOT NULL DEFAULT false,
    "willingToDrive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommuteRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DOUBLE PRECISION NOT NULL,
    "pickupLng" DOUBLE PRECISION NOT NULL,
    "destAddress" TEXT NOT NULL,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "departureTime" TEXT NOT NULL,
    "flexibilityWindow" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "daysOfWeek" TEXT NOT NULL,
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "willingToDrive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommuteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Ride" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "requestId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "destAddress" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "womenOnly" BOOLEAN NOT NULL DEFAULT false,
    "vehicleInfo" TEXT,
    "distanceKm" DOUBLE PRECISION,
    "tolls" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "serviceFeePerRider" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "totalFare" DOUBLE PRECISION,
    "sharePerRider" DOUBLE PRECISION,
    "riderCount" INTEGER NOT NULL DEFAULT 2,
    "fareAgreedAt" TIMESTAMP(3),
    "fareAgreedById" TEXT,
    "driverAcceptedAt" TIMESTAMP(3),
    "passengerAcceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RideParticipant" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fareShare" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SosEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rideId" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'triggered',
    "notifiedContacts" TEXT NOT NULL,
    "notifyResults" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SosEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SosLocation" (
    "id" TEXT NOT NULL,
    "sosEventId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SosLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RideLocation" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "public"."UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "Message_senderId_receiverId_idx" ON "public"."Message"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "Message_requestId_createdAt_idx" ON "public"."Message"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "Ride_requestId_status_idx" ON "public"."Ride"("requestId", "status");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "public"."Ride"("driverId");

-- CreateIndex
CREATE UNIQUE INDEX "RideParticipant_rideId_userId_key" ON "public"."RideParticipant"("rideId", "userId");

-- CreateIndex
CREATE INDEX "SosEvent_userId_createdAt_idx" ON "public"."SosEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SosLocation_sosEventId_createdAt_idx" ON "public"."SosLocation"("sosEventId", "createdAt");

-- CreateIndex
CREATE INDEX "RideLocation_rideId_createdAt_idx" ON "public"."RideLocation"("rideId", "createdAt");

-- CreateIndex
CREATE INDEX "RideLocation_rideId_userId_createdAt_idx" ON "public"."RideLocation"("rideId", "userId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationDocument" ADD CONSTRAINT "VerificationDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommuteRequest" ADD CONSTRAINT "CommuteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."CommuteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."CommuteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideParticipant" ADD CONSTRAINT "RideParticipant_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideParticipant" ADD CONSTRAINT "RideParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SosEvent" ADD CONSTRAINT "SosEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SosEvent" ADD CONSTRAINT "SosEvent_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SosLocation" ADD CONSTRAINT "SosLocation_sosEventId_fkey" FOREIGN KEY ("sosEventId") REFERENCES "public"."SosEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideLocation" ADD CONSTRAINT "RideLocation_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "public"."Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RideLocation" ADD CONSTRAINT "RideLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

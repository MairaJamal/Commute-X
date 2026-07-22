import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { computeMatch, haversineDistance, MatchRequest } from '@/lib/matching';
import { splitFare } from '@/lib/splitFare';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active user request
    let activeRequest;
    if (requestId) {
      activeRequest = await db.commuteRequest.findUnique({
        where: { id: requestId },
        include: { user: { include: { userPreferences: true } } },
      });
    } else {
      activeRequest = await db.commuteRequest.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { userPreferences: true } } },
      });
    }

    if (!activeRequest) {
      return NextResponse.json({ matches: [] });
    }

    // Query other requests (not from this user)
    const otherRequests = await db.commuteRequest.findMany({
      where: {
        userId: { not: activeRequest.userId },
      },
      include: {
        user: {
          include: {
            userPreferences: true,
          },
        },
      },
    });

    const matchesList = otherRequests
      .map((req) => {
        // Map Prisma request to MatchRequest interface
        const matchReqA: MatchRequest = {
          userId: activeRequest.userId,
          pickupLat: activeRequest.pickupLat,
          pickupLng: activeRequest.pickupLng,
          destLat: activeRequest.destLat,
          destLng: activeRequest.destLng,
          departureTime: activeRequest.departureTime,
          flexibilityWindow: activeRequest.flexibilityWindow,
          frequency: activeRequest.frequency,
          daysOfWeek: activeRequest.daysOfWeek,
          womenOnly: activeRequest.womenOnly,
          user: {
            id: activeRequest.user.id,
            name: activeRequest.user.name,
            gender: activeRequest.user.gender,
            role: activeRequest.user.role,
            rating: activeRequest.user.rating,
            chatStyle: activeRequest.user.userPreferences?.chatStyle || undefined,
          },
        };

        const matchReqB: MatchRequest = {
          userId: req.userId,
          pickupLat: req.pickupLat,
          pickupLng: req.pickupLng,
          destLat: req.destLat,
          destLng: req.destLng,
          departureTime: req.departureTime,
          flexibilityWindow: req.flexibilityWindow,
          frequency: req.frequency,
          daysOfWeek: req.daysOfWeek,
          womenOnly: req.womenOnly,
          user: {
            id: req.user.id,
            name: req.user.name,
            gender: req.user.gender,
            role: req.user.role,
            rating: req.user.rating,
            chatStyle: req.user.userPreferences?.chatStyle || undefined,
          },
        };

        const score = computeMatch(matchReqA, matchReqB);
        const distance = haversineDistance(
          activeRequest.pickupLat,
          activeRequest.pickupLng,
          req.pickupLat,
          req.pickupLng
        );

        // Estimated per-rider price for the matches list
        const estimatedTripKm = Math.max(distance * 2.4, 3);
        const price = Math.round(
          splitFare({ distanceKm: estimatedTripKm, riderCount: 2, tolls: 20, serviceFeePerRider: 6 })
            .sharePerRider
        );

        return {
          id: req.id,
          score,
          distance: parseFloat(distance.toFixed(1)),
          price,
          user: {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role,
            gender: req.user.gender,
            rating: req.user.rating,
            ridesCompleted: req.user.ridesCompleted,
            memberSince: req.user.memberSince,
            avatarText: req.user.avatarText,
            chatStyle: req.user.userPreferences?.chatStyle || 'Quiet',
            musicStyle: req.user.userPreferences?.musicStyle || 'Any',
            usualRoute: req.user.userPreferences?.usualRoute || `${req.pickupAddress} → ${req.destAddress}`,
            willingToDrive: req.user.userPreferences?.willingToDrive || false,
          },
          request: {
            pickupAddress: req.pickupAddress,
            destAddress: req.destAddress,
            departureTime: req.departureTime,
            flexibilityWindow: req.flexibilityWindow,
            frequency: req.frequency,
            daysOfWeek: req.daysOfWeek,
          },
        };
      })
      .filter((match) => match.score > 0) // Filter hard mismatches
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, 3); // Top 3 matches

    return NextResponse.json({
      matches: matchesList,
      activeRequest: {
        id: activeRequest.id,
        pickupAddress: activeRequest.pickupAddress,
        destAddress: activeRequest.destAddress,
        departureTime: activeRequest.departureTime,
        womenOnly: activeRequest.womenOnly,
        flexibilityWindow: activeRequest.flexibilityWindow,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

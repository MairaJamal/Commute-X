import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { splitFare } from '@/lib/splitFare';
import {
  assertCanConfirm,
  canTransition,
  isRideStatus,
  type RideStatus,
} from '@/lib/rideStatus';

const rideInclude = {
  driver: { select: { id: true, name: true, avatarText: true } },
  participants: {
    include: {
      user: { select: { id: true, name: true, avatarText: true } },
    },
  },
  request: {
    select: {
      id: true,
      pickupAddress: true,
      destAddress: true,
      departureTime: true,
      womenOnly: true,
    },
  },
} as const;

async function getAuthorizedRide(rideId: string, userId: string) {
  const ride = await db.ride.findUnique({
    where: { id: rideId },
    include: rideInclude,
  });
  if (!ride) return { error: 'Ride not found' as const, status: 404 as const };

  const isParticipant =
    ride.driverId === userId ||
    ride.participants.some((p) => p.userId === userId);
  if (!isParticipant) {
    return { error: 'Forbidden' as const, status: 403 as const };
  }

  return { ride };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await getAuthorizedRide(id, userId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ride: result.ride });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH actions:
 * - agree_fare: persist fare split + set fareAgreedAt
 * - set_status: transition status (confirmed requires fareAgreedAt)
 * - confirm: agree fare + move to confirmed in one step
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const result = await getAuthorizedRide(id, userId);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === 'agree_fare') {
      return agreeFare(id, userId, body);
    }
    if (action === 'set_status') {
      return setStatus(id, body.status);
    }
    if (action === 'confirm' || action === 'accept') {
      // 1. Ensure fare is agreed if fare details provided
      if (body.distanceKm) {
        const agreeRes = await agreeFare(id, userId, body);
        if (!agreeRes.ok && 'status' in agreeRes && agreeRes.status >= 400) {
          return agreeRes;
        }
      }

      const currentRide = await db.ride.findUnique({
        where: { id },
        include: { participants: true },
      });
      if (!currentRide) {
        return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
      }

      const isDriver = currentRide.driverId === userId;
      const now = new Date();

      const updateData: any = {};
      if (isDriver) {
        updateData.driverAcceptedAt = now;
      } else {
        updateData.passengerAcceptedAt = now;
      }

      const driverAccepted = isDriver || Boolean(currentRide.driverAcceptedAt);
      const passengerAccepted = !isDriver || Boolean(currentRide.passengerAcceptedAt);

      if (driverAccepted && passengerAccepted) {
        updateData.status = 'confirmed';
        updateData.confirmedAt = now;
      } else if (driverAccepted) {
        updateData.status = 'waiting_for_passenger';
      } else {
        updateData.status = 'waiting_for_driver';
      }

      const updated = await db.ride.update({
        where: { id },
        data: updateData,
        include: rideInclude,
      });

      return NextResponse.json({ success: true, ride: updated });
    }

    return NextResponse.json(
      { error: 'Unknown action. Use agree_fare, set_status, or confirm.' },
      { status: 400 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

async function agreeFare(
  rideId: string,
  userId: string,
  body: {
    distanceKm?: number;
    riderCount?: number;
    tolls?: number;
    serviceFeePerRider?: number;
    extraRiderNames?: string[];
    customFare?: number;
  }
) {
  const distanceKm = Number(body.distanceKm);
  const riderCount = Number(body.riderCount);
  const tolls = body.tolls != null ? Number(body.tolls) : 20;
  const serviceFeePerRider =
    body.serviceFeePerRider != null ? Number(body.serviceFeePerRider) : 6;

  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return NextResponse.json({ error: 'distanceKm is required' }, { status: 400 });
  }
  if (!Number.isFinite(riderCount) || riderCount < 2) {
    return NextResponse.json({ error: 'riderCount must be at least 2' }, { status: 400 });
  }

  let fare;
  try {
    fare = splitFare({ distanceKm, riderCount, tolls, serviceFeePerRider });
    if (body.customFare != null && Number.isFinite(Number(body.customFare)) && Number(body.customFare) >= 0) {
      const customTotal = Number(body.customFare);
      fare = {
        totalCost: customTotal,
        sharePerRider: customTotal / Math.max(1, riderCount),
      };
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const ride = await db.ride.findUnique({
    where: { id: rideId },
    include: { participants: true },
  });
  if (!ride) {
    return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
  }

  // Optionally add extra named riders (e.g. Divya, Sara) for 3–4 person splits
  const extraNames: string[] = Array.isArray(body.extraRiderNames)
    ? body.extraRiderNames
    : [];
  const existingUserIds = new Set(ride.participants.map((p) => p.userId));

  for (const name of extraNames) {
    const user = await db.user.findFirst({
      where: { name: { contains: name.split(' ')[0] } },
    });
    if (user && !existingUserIds.has(user.id) && user.id !== ride.driverId) {
      await db.rideParticipant.create({
        data: {
          rideId,
          userId: user.id,
          role: 'rider',
          fareShare: fare.sharePerRider,
        },
      });
      existingUserIds.add(user.id);
    }
  }

  await db.ride.update({
    where: { id: rideId },
    data: {
      distanceKm,
      tolls,
      serviceFeePerRider,
      riderCount,
      totalFare: fare.totalCost,
      sharePerRider: fare.sharePerRider,
      fareAgreedAt: new Date(),
      fareAgreedById: userId,
    },
  });

  await db.rideParticipant.updateMany({
    where: { rideId },
    data: { fareShare: fare.sharePerRider },
  });

  const updated = await db.ride.findUnique({
    where: { id: rideId },
    include: rideInclude,
  });

  return NextResponse.json({ success: true, ride: updated });
}

async function setStatus(rideId: string, nextStatusRaw: string) {
  if (!isRideStatus(nextStatusRaw)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const nextStatus = nextStatusRaw as RideStatus;

  const ride = await db.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
  }

  const from = ride.status as RideStatus;
  if (!isRideStatus(from) || !canTransition(from, nextStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from "${ride.status}" to "${nextStatus}"` },
      { status: 400 }
    );
  }

  if (nextStatus === 'confirmed') {
    try {
      assertCanConfirm(ride);
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (nextStatus === 'confirmed') timestamps.confirmedAt = now;
  if (nextStatus === 'in_progress') timestamps.startedAt = now;
  if (nextStatus === 'completed') timestamps.completedAt = now;
  if (nextStatus === 'cancelled') timestamps.cancelledAt = now;

  const updated = await db.ride.update({
    where: { id: rideId },
    data: {
      status: nextStatus,
      ...timestamps,
    },
    include: rideInclude,
  });

  if (nextStatus === 'completed') {
    const participantIds = [
      ...new Set([
        updated.driverId,
        ...updated.participants.map((p) => p.userId),
      ]),
    ];
    await db.user.updateMany({
      where: { id: { in: participantIds } },
      data: { ridesCompleted: { increment: 1 } },
    });
  }

  return NextResponse.json({ success: true, ride: updated });
}

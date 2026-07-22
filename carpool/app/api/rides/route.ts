import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

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

function vehicleForDriver(name: string) {
  if (name.includes('Priya')) return 'Hyundai i20 · KA-05-JT-2291';
  if (name.includes('Sara')) return 'Honda City · KA-03-MN-4412';
  return 'Shared car · AC';
}

/**
 * POST — create (or reuse) a matched ride for a commute request + peer.
 * Body: { peerId, requestId }
 */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { peerId, requestId } = body;

    if (!peerId || !requestId) {
      return NextResponse.json(
        { error: 'peerId and requestId are required' },
        { status: 400 }
      );
    }
    if (peerId === userId) {
      return NextResponse.json({ error: 'Cannot ride with yourself' }, { status: 400 });
    }

    const [commuteRequest, peer, me] = await Promise.all([
      db.commuteRequest.findUnique({ where: { id: requestId } }),
      db.user.findUnique({
        where: { id: peerId },
        include: { userPreferences: true },
      }),
      db.user.findUnique({
        where: { id: userId },
        include: { userPreferences: true },
      }),
    ]);

    if (!commuteRequest) {
      return NextResponse.json({ error: 'Commute request not found' }, { status: 404 });
    }
    if (!peer || !me) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Reuse an open ride for this request involving both users
    const existing = await db.ride.findFirst({
      where: {
        requestId,
        status: { in: ['requested', 'matched'] },
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: peerId } } },
        ],
      },
      include: rideInclude,
    });

    if (existing) {
      return NextResponse.json({ success: true, ride: existing, reused: true });
    }

    const peerDrives = peer.userPreferences?.willingToDrive ?? false;
    const iDrive = me.userPreferences?.willingToDrive ?? false;
    const driverId = peerDrives ? peer.id : iDrive ? me.id : peer.id;
    const driver = driverId === peer.id ? peer : me;

    const ride = await db.ride.create({
      data: {
        status: 'matched',
        requestId,
        driverId,
        pickupAddress: commuteRequest.pickupAddress,
        destAddress: commuteRequest.destAddress,
        departureTime: commuteRequest.departureTime,
        womenOnly: commuteRequest.womenOnly,
        vehicleInfo: vehicleForDriver(driver.name),
        participants: {
          create: [
            {
              userId: driverId,
              role: 'driver',
            },
            {
              userId: driverId === userId ? peerId : userId,
              role: 'rider',
            },
          ],
        },
      },
      include: rideInclude,
    });

    return NextResponse.json({ success: true, ride, reused: false });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET — list rides for the current user.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rides = await db.ride.findMany({
      where: {
        OR: [
          { driverId: userId },
          { participants: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: rideInclude,
    });

    return NextResponse.json({ rides });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

type RouteContext = { params: Promise<{ id: string }> };

/** POST — append a live location point while an SOS is active. Owner only. */
export async function POST(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { lat, lng } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const event = await db.sosEvent.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'SOS event not found' }, { status: 404 });
    }
    if (event.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (event.status !== 'triggered') {
      return NextResponse.json({ error: `Event is ${event.status}, no longer tracking` }, { status: 400 });
    }

    const point = await db.sosLocation.create({ data: { sosEventId: id, lat, lng } });
    return NextResponse.json({ success: true, point });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * GET — latest location + short trail for the shared live-tracking link.
 * Intentionally public (no auth): the SOS event id itself is the unguessable
 * capability token shared with emergency contacts via call/WhatsApp.
 */
export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const event = await db.sosEvent.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, avatarText: true } },
        locations: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'SOS event not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: event.status,
      userName: event.user.name,
      createdAt: event.createdAt,
      cancelledAt: event.cancelledAt,
      resolvedAt: event.resolvedAt,
      latest: event.locations[0] ?? { lat: event.lat, lng: event.lng, createdAt: event.createdAt },
      trail: event.locations.slice().reverse(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

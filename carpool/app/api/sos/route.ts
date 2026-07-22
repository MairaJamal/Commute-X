import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { notifyEmergencyContacts } from '@/lib/notify';

/**
 * POST — trigger an SOS. Body: { lat, lng, rideId? }
 * Persists the event, snapshots the user's current emergency contacts, records
 * the first location point, and notifies every contact by call + WhatsApp with
 * a link to the live-tracking page (app/sos/[id]).
 */
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lat, lng, rideId } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
    }

    const [user, contacts] = await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.emergencyContact.findMany({ where: { userId } }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sosEvent = await db.sosEvent.create({
      data: {
        userId,
        rideId: rideId || null,
        lat,
        lng,
        status: 'triggered',
        notifiedContacts: JSON.stringify(contacts.map((c) => ({ name: c.name, phone: c.phone }))),
        locations: { create: [{ lat, lng }] },
      },
    });

    const origin = new URL(request.url).origin;
    const liveLocationUrl = `${origin}/sos/${sosEvent.id}`;

    let notifyResults: Awaited<ReturnType<typeof notifyEmergencyContacts>> = [];
    if (contacts.length > 0) {
      notifyResults = await notifyEmergencyContacts({
        contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
        userName: user.name,
        liveLocationUrl,
      });
      await db.sosEvent.update({
        where: { id: sosEvent.id },
        data: { notifyResults: JSON.stringify(notifyResults) },
      });
    }

    return NextResponse.json({
      success: true,
      sosEventId: sosEvent.id,
      liveLocationUrl,
      contactsNotified: contacts.length,
      notifyResults,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * PATCH — cancel or resolve an SOS event. Body: { sosEventId, action: 'cancel' | 'resolve' }
 */
export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sosEventId, action } = body;

    if (!sosEventId || (action !== 'cancel' && action !== 'resolve')) {
      return NextResponse.json(
        { error: 'sosEventId and action ("cancel" | "resolve") are required' },
        { status: 400 }
      );
    }

    const event = await db.sosEvent.findUnique({ where: { id: sosEventId } });
    if (!event) {
      return NextResponse.json({ error: 'SOS event not found' }, { status: 404 });
    }
    if (event.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (event.status !== 'triggered') {
      return NextResponse.json({ error: `Event is already ${event.status}` }, { status: 400 });
    }

    const now = new Date();
    const updated = await db.sosEvent.update({
      where: { id: sosEventId },
      data:
        action === 'cancel'
          ? { status: 'cancelled', cancelledAt: now }
          : { status: 'resolved', resolvedAt: now },
    });

    return NextResponse.json({ success: true, sosEvent: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** GET — list this user's SOS history (most recent first). */
export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const events = await db.sosEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ events });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

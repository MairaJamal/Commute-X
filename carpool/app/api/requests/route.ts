import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { approximateCoordinates } from '@/lib/geocode';

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requests = await db.commuteRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      pickupAddress,
      destAddress,
      departureTime,
      flexibilityWindow,
      frequency,
      daysOfWeek,
      womenOnly,
      willingToDrive,
    } = body;

    // Validation
    if (!pickupAddress || pickupAddress.trim() === '') {
      return NextResponse.json({ error: 'Pickup location is required' }, { status: 400 });
    }
    if (!destAddress || destAddress.trim() === '') {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }
    if (!departureTime || departureTime.trim() === '') {
      return NextResponse.json({ error: 'Departure time is required' }, { status: 400 });
    }

    // NOTE: There is no real geocoding provider wired in (that needs a Google
    // Maps / Mapbox API key). Until one is added, we approximate coordinates
    // deterministically from the address text so the same address always maps
    // to the same point (unlike the old version, which used Math.random() and
    // gave a different location on every request for the same address).
    const { lat: pickupLat, lng: pickupLng } = approximateCoordinates(pickupAddress);
    const { lat: destLat, lng: destLng } = approximateCoordinates(destAddress);

    const newRequest = await db.commuteRequest.create({
      data: {
        userId,
        pickupAddress,
        pickupLat,
        pickupLng,
        destAddress,
        destLat,
        destLng,
        departureTime,
        flexibilityWindow: flexibilityWindow || '± 15 minutes',
        frequency: frequency || 'daily',
        daysOfWeek: daysOfWeek || 'M,T,W,T,F',
        womenOnly: womenOnly ?? false,
        willingToDrive: willingToDrive ?? false,
      },
    });

    return NextResponse.json({ success: true, request: newRequest });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

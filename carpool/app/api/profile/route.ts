import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        userPreferences: true,
        emergencyContacts: true,
        verificationDocuments: true,
        commuteRequests: true,
      },
      omit: { passwordHash: true },
    });

    if (user) {
      // Calculate usual routes dynamically from completed rides (>= 3 times)
      const completedRides = await db.ride.findMany({
        where: {
          status: 'completed',
          OR: [
            { driverId: userId },
            { participants: { some: { userId } } },
          ],
        },
        select: {
          pickupAddress: true,
          destAddress: true,
        },
      });

      const routeCounts = new Map<string, number>();
      for (const ride of completedRides) {
        const routeKey = `${ride.pickupAddress} → ${ride.destAddress}`;
        routeCounts.set(routeKey, (routeCounts.get(routeKey) || 0) + 1);
      }

      const qualifiedRoutes = Array.from(routeCounts.entries())
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1])
        .map(([route]) => route);

      const computedUsualRoute = qualifiedRoutes.length > 0
        ? qualifiedRoutes.join(' | ')
        : '';

      if (user.userPreferences) {
        user.userPreferences.usualRoute = computedUsualRoute;
      }
    }

    return NextResponse.json({ user });
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
    const { usualRoute, chatStyle, musicStyle, womenOnlyMode, willingToDrive, emergencyContacts } = body;

    // Update preferences
    await db.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        usualRoute: usualRoute || '',
        chatStyle: chatStyle || 'Quiet / headphones',
        musicStyle: musicStyle || "Okay with driver's choice",
        womenOnlyMode: womenOnlyMode ?? true,
        willingToDrive: willingToDrive ?? false,
      },
      update: {
        usualRoute,
        chatStyle,
        musicStyle,
        womenOnlyMode,
        willingToDrive,
      },
    });

    // Update emergency contacts if provided
    if (emergencyContacts && Array.isArray(emergencyContacts)) {
      await db.emergencyContact.deleteMany({ where: { userId } });
      for (const contact of emergencyContacts) {
        if (contact.name && contact.phone) {
          await db.emergencyContact.create({
            data: {
              userId,
              name: contact.name,
              phone: contact.phone,
            },
          });
        }
      }
    }

    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      include: {
        userPreferences: true,
        emergencyContacts: true,
        verificationDocuments: true,
        commuteRequests: true,
      },
      omit: { passwordHash: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

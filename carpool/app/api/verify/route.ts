import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { docType } = body;

    // Create document record
    const verificationDoc = await db.verificationDocument.create({
      data: {
        userId,
        documentType: docType || 'Government ID',
        fileUrl: '/uploads/uploaded_id.jpg',
        status: 'pending',
      },
    });

    // Set user verificationStatus to pending first
    await db.user.update({
      where: { id: userId },
      data: { verificationStatus: 'pending' },
    });

    // Automatically transition to 'verified' to simulate background approval in our prototype
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { verificationStatus: 'verified' },
      include: {
        userPreferences: true,
        emergencyContacts: true,
        verificationDocuments: true,
        commuteRequests: true,
      },
      omit: { passwordHash: true },
    });

    // Update document status to verified as well
    await db.verificationDocument.update({
      where: { id: verificationDoc.id },
      data: { status: 'verified' },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

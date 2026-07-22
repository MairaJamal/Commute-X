import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, destroySession, hashPassword, requireUserId, verifyPassword } from '@/lib/auth';

const userIncludes = {
  userPreferences: true,
  emergencyContacts: true,
  verificationDocuments: true,
  commuteRequests: true,
};

// Applied to every user query below so passwordHash never reaches a JSON response.
const omitPassword = { passwordHash: true } as const;

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: userIncludes,
      omit: omitPassword,
    });

    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, email, password, name, role, gender, phone, docType } = body;

    if (action === 'logout') {
      await destroySession();
      return NextResponse.json({ success: true });
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const user = await db.user.findUnique({
        where: { email },
        include: userIncludes,
      });

      // Same error for "no such user" and "wrong password" so login can't be used
      // to enumerate which emails are registered.
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      await createSession(user.id);
      const { passwordHash, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser });
    }

    if (action === 'signup') {
      if (!email || !password || !name) {
        return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
      }
      if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      if (gender !== 'female' && gender !== 'male') {
        return NextResponse.json({ error: 'Please select a gender' }, { status: 400 });
      }

      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      const avatarText = name
        ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'US';

      const passwordHash = await hashPassword(password);

      const user = await db.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone: phone || '',
          role: role === 'University student' ? 'student' : 'office_worker',
          gender,
          verificationStatus: 'pending',
          avatarText,
          memberSince: new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }),
          userPreferences: {
            create: {
              usualRoute: '',
              chatStyle: 'Quiet / headphones',
              musicStyle: "Okay with driver's choice",
              womenOnlyMode: gender === 'female',
              willingToDrive: false,
            },
          },
        },
        include: { userPreferences: true },
      });

      if (docType) {
        await db.verificationDocument.create({
          data: {
            userId: user.id,
            documentType: docType,
            fileUrl: '/uploads/uploaded_id.jpg',
            status: 'pending',
          },
        });
      }

      await createSession(user.id);
      const { passwordHash: _omit, ...safeUser } = user;
      return NextResponse.json({ success: true, user: safeUser });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

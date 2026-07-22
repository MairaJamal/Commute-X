import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SESSION_COOKIE = 'session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string): string {
  // Session tokens are random + high-entropy, so a fast hash is fine here (unlike passwords)
  // and lets us look sessions up by exact match without storing the raw token.
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Create a new session for a user, set the httpOnly cookie, and return the raw token. */
export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: { userId, tokenHash, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return token;
}

/** Resolve the logged-in user's id from the session cookie. Returns null if not logged in
 *  or the session is invalid/expired. There is NO fallback to a default/demo user — every
 *  caller must handle the null case (typically a 401 response or a redirect to login). */
export async function requireUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    select: { userId: true, expiresAt: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    // Best-effort cleanup of the expired session; ignore failures.
    await db.session.delete({ where: { tokenHash } }).catch(() => {});
    return null;
  }

  return session.userId;
}

/** Destroy the current session (logout) and clear the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.delete({ where: { tokenHash: hashToken(token) } }).catch(() => {});
  }
  cookieStore.delete(SESSION_COOKIE);
}

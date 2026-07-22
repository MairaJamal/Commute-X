import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const peerId = searchParams.get('peerId');
    const requestId = searchParams.get('requestId');

    // Thread: messages between current user and peer (optionally scoped to a request)
    if (peerId) {
      const messages = await db.message.findMany({
        where: {
          AND: [
            {
              OR: [
                { senderId: userId, receiverId: peerId },
                { senderId: peerId, receiverId: userId },
              ],
            },
            ...(requestId ? [{ requestId }] : []),
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, avatarText: true } },
          receiver: { select: { id: true, name: true, avatarText: true } },
        },
      });

      return NextResponse.json({ messages, currentUserId: userId });
    }

    // Conversation list: latest message per peer
    const allMessages = await db.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, avatarText: true } },
        receiver: { select: { id: true, name: true, avatarText: true } },
      },
    });

    const conversationMap = new Map<
      string,
      {
        peerId: string;
        peerName: string;
        peerInitials: string;
        requestId: string;
        lastMessage: string;
        lastMessageAt: string;
      }
    >();

    for (const msg of allMessages) {
      const peer = msg.senderId === userId ? msg.receiver : msg.sender;
      if (conversationMap.has(peer.id)) continue;

      conversationMap.set(peer.id, {
        peerId: peer.id,
        peerName: peer.name,
        peerInitials: peer.avatarText,
        requestId: msg.requestId,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt.toISOString(),
      });
    }

    return NextResponse.json({
      conversations: Array.from(conversationMap.values()),
      currentUserId: userId,
    });
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
    const { receiverId, requestId, content } = body;

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    if (receiverId === userId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const [receiver, commuteRequest] = await Promise.all([
      db.user.findUnique({ where: { id: receiverId } }),
      db.commuteRequest.findUnique({ where: { id: requestId } }),
    ]);

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }
    if (!commuteRequest) {
      return NextResponse.json({ error: 'Commute request not found' }, { status: 404 });
    }

    const message = await db.message.create({
      data: {
        senderId: userId,
        receiverId,
        requestId,
        content: content.trim(),
      },
      include: {
        sender: { select: { id: true, name: true, avatarText: true } },
        receiver: { select: { id: true, name: true, avatarText: true } },
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

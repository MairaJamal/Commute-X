'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Conversation {
  peerId: string;
  peerName: string;
  peerInitials: string;
  requestId: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  requestId: string;
  content: string;
  createdAt: string;
}

const QUICK_CHIPS = [
  'Sounds good, see you then!',
  'Can we meet 5 mins earlier?',
  "I'll wait outside the main gate",
  'Confirming for daily commute',
];

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const paramPeerId = searchParams.get('peerId') || '';
  const paramRequestId = searchParams.get('requestId') || '';
  const paramName = searchParams.get('name') || '';
  const paramInitials = searchParams.get('initials') || '';

  const [currentUserId, setCurrentUserId] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activePeerId, setActivePeerId] = useState(paramPeerId);
  const [activeRequestId, setActiveRequestId] = useState(paramRequestId);
  const [activeName, setActiveName] = useState(paramName || 'Select a conversation');
  const [activeInitials, setActiveInitials] = useState(paramInitials || '?');
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
      return data.conversations as Conversation[];
    } catch (err: any) {
      setError(err.message || 'Error loading conversations');
      return [] as Conversation[];
    }
  }, []);

  const fetchThread = useCallback(async (peerId: string) => {
    if (!peerId) return;
    try {
      // Load full peer thread (requestId is only required when sending)
      const res = await fetch(`/api/messages?peerId=${encodeURIComponent(peerId)}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data.messages || []);
      if (data.currentUserId) setCurrentUserId(data.currentUserId);
    } catch (err: any) {
      setError(err.message || 'Error loading messages');
    }
  }, []);

  // Initial load + select conversation from URL or first in list
  useEffect(() => {
    let cancelled = false;

    const resolveRequestId = async (peerId: string, preferred?: string, convos: Conversation[] = []) => {
      if (preferred) return preferred;
      const fromConvo = convos.find((c) => c.peerId === peerId)?.requestId;
      if (fromConvo) return fromConvo;
      try {
        const res = await fetch('/api/requests');
        if (!res.ok) return '';
        const data = await res.json();
        return data.requests?.[0]?.id || '';
      } catch {
        return '';
      }
    };

    const init = async () => {
      setLoading(true);
      const convos = await fetchConversations();
      if (cancelled) return;

      if (paramPeerId) {
        const resolvedRequestId = await resolveRequestId(paramPeerId, paramRequestId, convos);
        if (cancelled) return;
        setActivePeerId(paramPeerId);
        setActiveRequestId(resolvedRequestId);
        setActiveName(paramName || convos.find((c) => c.peerId === paramPeerId)?.peerName || 'Match');
        setActiveInitials(paramInitials || convos.find((c) => c.peerId === paramPeerId)?.peerInitials || '?');
        await fetchThread(paramPeerId);
      } else if (convos.length > 0) {
        const first = convos[0];
        setActivePeerId(first.peerId);
        setActiveRequestId(first.requestId);
        setActiveName(first.peerName);
        setActiveInitials(first.peerInitials);
        await fetchThread(first.peerId);
      }
      setLoading(false);
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [paramPeerId, paramRequestId, paramName, paramInitials, fetchConversations, fetchThread]);

  // Poll conversations + active thread every 3s
  useEffect(() => {
    const tick = async () => {
      await fetchConversations();
      if (activePeerId) {
        await fetchThread(activePeerId);
      }
    };

    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [activePeerId, fetchConversations, fetchThread]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const selectConversation = (convo: Conversation) => {
    setActivePeerId(convo.peerId);
    setActiveRequestId(convo.requestId);
    setActiveName(convo.peerName);
    setActiveInitials(convo.peerInitials);
    setError('');
    fetchThread(convo.peerId);
    router.replace(
      `/chat?peerId=${convo.peerId}&requestId=${convo.requestId}&name=${encodeURIComponent(convo.peerName)}&initials=${convo.peerInitials}`,
      { scroll: false }
    );
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !activePeerId || !activeRequestId || sending) return;

    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activePeerId,
          requestId: activeRequestId,
          content: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');

      setMessages((prev) => [...prev, data.message]);
      setInputMessage('');
      await fetchConversations();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendTyped = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputMessage);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft animate-pulse">Loading chats...</div>
      </div>
    );
  }

  const hasThread = Boolean(activePeerId && activeRequestId);

  return (
    <div className="section-tight wrap">
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-coral/10 text-coral text-sm font-semibold border border-coral/20">
          {error}
        </div>
      )}

      <div className="chat-shell">
        <div className="chat-list">
          {conversations.length === 0 && !paramPeerId ? (
            <div className="p-4 text-sm text-ink-soft">
              No conversations yet. Message a match from their profile.
            </div>
          ) : (
            <>
              {/* Ensure URL-opened peer appears even before first message */}
              {paramPeerId &&
                !conversations.some((c) => c.peerId === paramPeerId) && (
                  <button
                    onClick={() => {
                      setActivePeerId(paramPeerId);
                      setActiveRequestId(paramRequestId);
                      setActiveName(paramName || 'Match');
                      setActiveInitials(paramInitials || '?');
                    }}
                    className={`chat-item w-full text-left border-none focus:outline-none cursor-pointer ${
                      activePeerId === paramPeerId ? 'active' : ''
                    }`}
                    type="button"
                  >
                    <div className="avatar sm">{paramInitials || '?'}</div>
                    <div>
                      <b>{paramName || 'New match'}</b>
                      <span className="truncate block max-w-[150px]">New match chat</span>
                    </div>
                  </button>
                )}
              {conversations.map((convo) => (
                <button
                  key={convo.peerId}
                  onClick={() => selectConversation(convo)}
                  className={`chat-item w-full text-left border-none focus:outline-none cursor-pointer ${
                    activePeerId === convo.peerId ? 'active' : ''
                  }`}
                  type="button"
                >
                  <div className="avatar sm">{convo.peerInitials}</div>
                  <div>
                    <b>{convo.peerName}</b>
                    <span className="truncate block max-w-[150px]">{convo.lastMessage}</span>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="chat-main">
          <div className="chat-top">
            <div className="avatar sm">{activeInitials}</div>
            <div>
              <b>{activeName}</b>
              <span>● Women-only ride · active now</span>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {!hasThread ? (
              <div className="text-sm text-ink-soft p-2">
                Select a conversation or open chat from a match profile.
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-ink-soft p-2">
                Say hi — use a quick reply or type a message below.
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bubble ${msg.senderId === currentUserId ? 'me' : 'them'}`}
                >
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="chat-quick">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                className="quick-chip cursor-pointer focus:outline-none"
                type="button"
                disabled={!hasThread || sending}
              >
                {chip}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendTyped} className="chat-input">
            <input
              type="text"
              placeholder={hasThread ? 'Type a message…' : 'Select a conversation first…'}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={!hasThread || sending}
            />
            <button
              type="submit"
              className="btn btn-amber btn-sm text-navy-950 cursor-pointer"
              disabled={!hasThread || sending || !inputMessage.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </div>

      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <button
          onClick={async () => {
            if (!activePeerId || !activeRequestId) return;
            try {
              const res = await fetch('/api/rides', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  peerId: activePeerId,
                  requestId: activeRequestId,
                }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to start ride');
              const params = new URLSearchParams({
                rideId: data.ride.id,
                peerId: activePeerId,
                requestId: activeRequestId,
                name: activeName,
              });
              router.push(`/fare-split?${params.toString()}`);
            } catch (err: any) {
              setError(err.message || 'Could not continue to fare split');
            }
          }}
          className="btn btn-teal cursor-pointer"
          disabled={!activePeerId || !activeRequestId}
        >
          Agree fare &amp; continue →
        </button>
      </div>
    </div>
  );
}

export default function Chat() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg font-medium text-ink-soft">Loading chats...</div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

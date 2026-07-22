'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface RideTicket {
  id: string;
  status: string;
  pickupAddress: string;
  destAddress: string;
  departureTime: string;
  womenOnly: boolean;
  vehicleInfo: string | null;
  sharePerRider: number | null;
  riderCount: number;
  driver: { id: string; name: string; avatarText: string };
  participants: {
    role: string;
    user: { id: string; name: string; avatarText: string };
  }[];
}

function formatPickupTime(time: string) {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr || '8', 10);
  const m = mStr || '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${suffix}, tomorrow`;
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const rideId = searchParams.get('rideId');

  // Legacy query-param fallbacks
  const legacyDriver = searchParams.get('driver') || 'Priya Menon';
  const legacyShare = searchParams.get('share') || '46';
  const legacyRiders = parseInt(searchParams.get('riders') || '3', 10);

  const [ride, setRide] = useState<RideTicket | null>(null);
  const [loading, setLoading] = useState(Boolean(rideId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rideId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/rides/${rideId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load ride');
        if (!cancelled) setRide(data.ride);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not load confirmation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rideId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft animate-pulse">Confirming booking...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="confirm-wrap">
        <p className="text-coral font-semibold">{error}</p>
        <Link href="/dashboard" className="btn btn-amber text-navy-950 no-underline cursor-pointer">
          Go to my dashboard →
        </Link>
      </div>
    );
  }

  const driverName = ride?.driver.name || legacyDriver;
  const share = ride?.sharePerRider != null ? Math.round(ride.sharePerRider) : legacyShare;
  const route = ride
    ? `${ride.pickupAddress} → ${ride.destAddress}`
    : 'Sector 17 Hostel → Tech Park, Gate 3';
  const pickupTime = ride ? formatPickupTime(ride.departureTime) : '8:10 AM, tomorrow';
  const vehicle = ride?.vehicleInfo || 'Hyundai i20 · KA-05-JT-2291';
  const womenOnly = ride?.womenOnly ?? true;

  let ridersList: string;
  if (ride) {
    const others = ride.participants
      .filter((p) => p.user.name !== driverName)
      .map((p) => p.user.name);
    // Prefer "You" for current viewer when name is Aisha (demo default)
    const labeled = others.map((n) => (n.includes('Aisha') ? 'You' : n));
    ridersList = labeled.length ? labeled.join(', ') : 'You';
  } else {
    ridersList =
      legacyRiders === 4
        ? 'You, Divya Rao, Sara Fernandes'
        : legacyRiders === 3
          ? 'You, Divya Rao'
          : 'You';
  }

  const firstNames = [driverName.split(' ')[0]];
  if (ride) {
    ride.participants
      .filter((p) => p.role === 'rider')
      .slice(0, 2)
      .forEach((p) => {
        const n = p.user.name.includes('Aisha') ? 'you' : p.user.name.split(' ')[0];
        if (!firstNames.map((f) => f.toLowerCase()).includes(n.toLowerCase())) {
          firstNames.push(n);
        }
      });
  } else {
    firstNames.push('Divya', 'you');
  }



  const isConfirmed = ride?.status === 'confirmed';
  const isWaitingPassenger = ride?.status === 'waiting_for_passenger';
  const isWaitingDriver = ride?.status === 'waiting_for_driver';
  const isPending = isWaitingPassenger || isWaitingDriver;

  const statusTitle = isConfirmed
    ? 'Ride confirmed'
    : isWaitingPassenger
      ? 'Waiting for Passenger Confirmation'
      : isWaitingDriver
        ? 'Waiting for Driver Confirmation'
        : 'Ride Requested';

  const blurb = isConfirmed
    ? (firstNames.length >= 3
        ? `${firstNames[0]}, ${firstNames[1]} and ${firstNames[2]} are locked in for tomorrow's commute.`
        : `${firstNames[0]} and you are locked in for tomorrow's commute.`)
    : isPending
      ? 'Ride request sent! Messaging remains available while waiting for mutual acceptance. Either party may cancel before final confirmation.'
      : 'Your ride request is pending confirmation.';

  return (
    <div className="confirm-wrap">
      <div className="check-circle" style={isPending ? { backgroundColor: '#fff3dd', color: 'var(--amber-ink)' } : {}}>
        {isConfirmed ? '✓' : '⏳'}
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>
        {statusTitle}
      </h2>
      <p style={{ color: 'var(--ink-soft)', fontSize: '14px', margin: 0 }}>{blurb}</p>

      <div className="card ticket">
        <div className="ticket-row">
          <span>Route</span>
          <b>{route}</b>
        </div>
        <div className="ticket-row">
          <span>Pickup time</span>
          <b>{pickupTime}</b>
        </div>
        <div className="ticket-row">
          <span>Driver</span>
          <b>
            {driverName} · {vehicle}
          </b>
        </div>
        <div className="ticket-row">
          <span>Riders</span>
          <b>{ridersList}</b>
        </div>
        <div className="ticket-row">
          <span>Your share</span>
          <b className="mono">PKR {share}</b>
        </div>
        <div className="ticket-row">
          <span>Mode</span>
          <b className={womenOnly ? 'text-pink' : ''}>
            {womenOnly ? '♀ Women-only ride' : 'Open ride'}
          </b>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/chat" className="btn btn-outline text-ink no-underline cursor-pointer">
          💬 Chat with ride match
        </Link>
        {rideId && ride?.status !== 'cancelled' && ride?.status !== 'completed' && (
          <button
            onClick={async () => {
              if (confirm('Are you sure you want to cancel this ride request?')) {
                await fetch(`/api/rides/${rideId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'set_status', status: 'cancelled' }),
                });
                window.location.reload();
              }
            }}
            className="btn btn-coral text-white cursor-pointer"
            type="button"
          >
            Cancel ride
          </button>
        )}
        <Link href="/dashboard" className="btn btn-amber text-navy-950 no-underline cursor-pointer">
          Go to my dashboard →
        </Link>
      </div>
    </div>
  );
}

export default function Confirmation() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg font-medium text-ink-soft">Confirming booking...</div>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

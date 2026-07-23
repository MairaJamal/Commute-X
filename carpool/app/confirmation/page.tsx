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
  hasDriver: boolean;
  vehicleInfo: string | null;
  tripDriverName: string | null;
  tripVehicleNumber: string | null;
  cancelledById: string | null;
  driverAcceptedAt: string | null;
  passengerAcceptedAt: string | null;
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
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(rideId));
  const [error, setError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [tripDriverName, setTripDriverName] = useState('');
  const [tripVehicleNumber, setTripVehicleNumber] = useState('');
  const [savingTrip, setSavingTrip] = useState(false);

  const loadRide = async () => {
    if (!rideId) return;
    try {
      const res = await fetch(`/api/rides/${rideId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load ride');
      setRide(data.ride);
      setTripDriverName(data.ride.tripDriverName || '');
      setTripVehicleNumber(data.ride.tripVehicleNumber || '');
    } catch (err: any) {
      setError(err.message || 'Could not load confirmation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        setMyId(data.user?.id || null);
      } catch {
        setMyId(null);
      }
    })();
    loadRide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const hasDriver = ride ? ride.hasDriver : true;
  const vehicle = ride?.vehicleInfo || 'Hyundai i20 · KA-05-JT-2291';
  const womenOnly = ride?.womenOnly ?? true;

  let ridersList: string;
  if (ride) {
    const others = ride.participants
      .filter((p) => p.user.name !== driverName)
      .map((p) => p.user.name);
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
  const isCancelled = ride?.status === 'cancelled';

  // Who am I in this ride, and has the OTHER person already accepted / declined?
  const isMeDriver = Boolean(ride && myId && ride.driver.id === myId);
  const myAccepted = ride
    ? isMeDriver
      ? Boolean(ride.driverAcceptedAt)
      : Boolean(ride.passengerAcceptedAt)
    : false;

  // Resolve a display name for whoever cancelled, so the other person sees who.
  let cancelledByName = '';
  if (ride?.cancelledById) {
    if (ride.cancelledById === ride.driver.id) {
      cancelledByName = ride.driver.name;
    } else {
      const p = ride.participants.find((p) => p.user.id === ride.cancelledById);
      cancelledByName = p?.user.name || 'the other partner';
    }
  }

  const statusTitle = isCancelled
    ? 'Ride sharing cancelled'
    : isConfirmed
      ? 'Ride confirmed'
      : isWaitingPassenger
        ? 'Waiting for Passenger Confirmation'
        : isWaitingDriver
          ? 'Waiting for Driver Confirmation'
          : 'Ride Requested';

  const blurb = isCancelled
    ? `Ride sharing cancelled by ${cancelledByName || 'the other partner'}.`
    : isConfirmed
      ? (firstNames.length >= 3
          ? `${firstNames[0]}, ${firstNames[1]} and ${firstNames[2]} are locked in for tomorrow's commute.`
          : `${firstNames[0]} and you are locked in for tomorrow's commute.`)
      : isPending
        ? (myAccepted
            ? 'You\u2019ve confirmed. Waiting for the other partner to confirm too. Either party may still cancel before it\u2019s final.'
            : 'Your match sent a ride request. Confirm below to lock it in, or decline if it doesn\u2019t work for you.')
        : 'Your ride request is pending confirmation.';

  const handleConfirm = async () => {
    if (!rideId) return;
    setActionBusy(true);
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      await loadRide();
    } finally {
      setActionBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!rideId) return;
    if (!confirm('Are you sure you want to cancel this ride request?')) return;
    setActionBusy(true);
    try {
      await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', status: 'cancelled' }),
      });
      await loadRide();
    } finally {
      setActionBusy(false);
    }
  };

  const handleSaveTripDetails = async () => {
    if (!rideId) return;
    setSavingTrip(true);
    try {
      const res = await fetch(`/api/rides/${rideId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_trip_details',
          tripDriverName,
          tripVehicleNumber,
        }),
      });
      const data = await res.json();
      if (res.ok) setRide(data.ride);
    } finally {
      setSavingTrip(false);
    }
  };

  return (
    <div className="confirm-wrap">
      <div
        className="check-circle"
        style={
          isCancelled
            ? { backgroundColor: '#fde2e2', color: 'var(--coral)' }
            : isPending
              ? { backgroundColor: '#fff3dd', color: 'var(--amber-ink)' }
              : {}
        }
      >
        {isCancelled ? '✕' : isConfirmed ? '✓' : '⏳'}
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
          <span>{hasDriver ? 'Driver' : 'Ride partner'}</span>
          <b>
            {hasDriver ? `${driverName} · ${vehicle}` : driverName}
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

      {ride && !isCancelled && (
        <div className="card" style={{ padding: '20px', marginTop: '14px', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>Actual trip details</div>
          <p style={{ color: 'var(--ink-soft)', fontSize: '13px', margin: '0 0 14px' }}>
            Once you've booked your own ride (Yango, Careem, or your own car), share the
            real driver's name and car number here so you both know who to look for.
          </p>
          <div className="field">
            <label>Driver name</label>
            <input
              type="text"
              placeholder="e.g. Ahmed Khan"
              value={tripDriverName}
              onChange={(e) => setTripDriverName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Car number</label>
            <input
              type="text"
              placeholder="e.g. ICT-4521"
              value={tripVehicleNumber}
              onChange={(e) => setTripVehicleNumber(e.target.value)}
            />
          </div>
          <button
            onClick={handleSaveTripDetails}
            className="btn btn-outline text-ink cursor-pointer"
            type="button"
            disabled={savingTrip}
          >
            {savingTrip ? 'Saving…' : 'Save trip details'}
          </button>
          {(ride.tripDriverName || ride.tripVehicleNumber) && (
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', marginTop: '10px' }}>
              Currently shared: <b>{ride.tripDriverName || '—'}</b> · <b>{ride.tripVehicleNumber || '—'}</b>
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
        <Link href="/chat" className="btn btn-outline text-ink no-underline cursor-pointer">
          💬 Chat with ride match
        </Link>

        {rideId && isPending && !myAccepted && (
          <button
            onClick={handleConfirm}
            className="btn btn-amber text-navy-950 cursor-pointer"
            type="button"
            disabled={actionBusy}
          >
            {actionBusy ? 'Confirming…' : '✓ Confirm ride'}
          </button>
        )}

        {rideId && !isCancelled && ride?.status !== 'completed' && (
          <button
            onClick={handleCancel}
            className="btn btn-coral text-white cursor-pointer"
            type="button"
            disabled={actionBusy}
          >
            {isPending ? 'Decline ride' : 'Cancel ride'}
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
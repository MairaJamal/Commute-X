'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { splitFare, FARE_RATE_PER_KM } from '@/lib/splitFare';

const TOLLS = 20;
const SERVICE_FEE_PER_RIDER = 6;

const EXTRA_RIDER_LABELS = ['Divya Rao', 'Sara Fernandes'];

function FareSplitContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const driverName = searchParams.get('name') || 'Priya Menon';
  const rideId = searchParams.get('rideId') || '';
  const peerId = searchParams.get('peerId') || '';
  const requestId = searchParams.get('requestId') || '';

  const [dist, setDist] = useState(8.4);
  const [riders, setRiders] = useState(3);
  const [customFare, setCustomFare] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const adjFare = (type: 'dist' | 'riders', dir: number) => {
    if (type === 'dist') {
      setDist((prev) => Math.max(1, parseFloat((prev + dir * 0.5).toFixed(1))));
    } else if (type === 'riders') {
      setRiders((prev) => Math.min(4, Math.max(2, prev + dir)));
    }
  };

  const { totalCost, sharePerRider } = splitFare({
    distanceKm: dist,
    riderCount: riders,
    tolls: TOLLS,
    serviceFeePerRider: SERVICE_FEE_PER_RIDER,
  });

  const parsedCustom = customFare !== '' ? parseFloat(customFare) : NaN;
  const displayTotal = !isNaN(parsedCustom) && parsedCustom >= 0 ? Math.round(parsedCustom) : Math.round(totalCost);
  const displayShare = Math.round(displayTotal / Math.max(1, riders));

  const riderRows = [
    { label: `${driverName} (driver)`, share: displayShare },
    { label: 'You', share: displayShare },
    ...EXTRA_RIDER_LABELS.slice(0, Math.max(0, riders - 2)).map((label) => ({
      label,
      share: displayShare,
    })),
  ];

  const ensureRide = async (): Promise<string> => {
    if (rideId) return rideId;
    if (!peerId || !requestId) {
      throw new Error('Missing ride context — open fare split from chat after a match');
    }
    const res = await fetch('/api/rides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId, requestId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create ride');
    return data.ride.id as string;
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const id = await ensureRide();
      const extraRiderNames = EXTRA_RIDER_LABELS.slice(0, Math.max(0, riders - 2));

      // Agree fare + confirm in one server action
      const res = await fetch(`/api/rides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          distanceKm: dist,
          riderCount: riders,
          tolls: TOLLS,
          serviceFeePerRider: SERVICE_FEE_PER_RIDER,
          extraRiderNames,
          customFare: !isNaN(parsedCustom) ? parsedCustom : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm ride');

      router.push(`/confirmation?rideId=${id}`);
    } catch (err: any) {
      setError(err.message || 'Could not confirm ride');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section-tight wrap">
      <div className="section-head">
        <div className="eyebrow">◆ Fare split calculator</div>
        <h2>Split the cost, not the friction</h2>
        <p>Adjust riders, distance, or enter your own custom fare in PKR.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-coral/10 text-coral text-sm font-semibold border border-coral/20">
          {error}
        </div>
      )}

      <div className="fare-grid">
        <div className="card" style={{ padding: '24px' }}>
          <div className="fare-input-row mb-3">
            <span className="font-bold text-navy-950">Enter Custom Total Fare (PKR)</span>
            <input
              type="number"
              placeholder="e.g. 400 (Optional)"
              value={customFare}
              onChange={(e) => setCustomFare(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', width: '150px', fontFamily: 'var(--font-jetbrains-mono)' }}
              min="0"
            />
          </div>

          <div className="fare-input-row">
            <span>Total trip distance</span>
            <div className="stepper">
              <button onClick={() => adjFare('dist', -1)} type="button" className="cursor-pointer">
                −
              </button>
              <span className="mono" id="dist-val">
                {dist} km
              </span>
              <button onClick={() => adjFare('dist', 1)} type="button" className="cursor-pointer">
                +
              </button>
            </div>
          </div>
          <div className="fare-input-row">
            <span>Base fare rate</span>
            <span className="mono">PKR {FARE_RATE_PER_KM} / km</span>
          </div>
          <div className="fare-input-row">
            <span>Riders sharing this trip</span>
            <div className="stepper">
              <button onClick={() => adjFare('riders', -1)} type="button" className="cursor-pointer">
                −
              </button>
              <span className="mono" id="riders-val">
                {riders}
              </span>
              <button onClick={() => adjFare('riders', 1)} type="button" className="cursor-pointer">
                +
              </button>
            </div>
          </div>
          <div className="fare-input-row">
            <span>Tolls / parking (split evenly)</span>
            <span className="mono">PKR {TOLLS}</span>
          </div>
          <div className="fare-input-row">
            <span>CommuteX service fee</span>
            <span className="mono">PKR {SERVICE_FEE_PER_RIDER} / rider</span>
          </div>
        </div>

        <div className="fare-total">
          <div style={{ fontSize: '12.5px', color: 'rgba(255,255,255,.6)' }}>Total trip cost</div>
          <div className="big mono" id="fare-total-val">
            PKR {displayTotal}
          </div>

          {riderRows.map((row) => (
            <div className="split-row" key={row.label}>
              <span>{row.label}</span>
              <span className="mono">PKR {row.share}</span>
            </div>
          ))}

          <button
            onClick={handleConfirm}
            className="btn btn-amber btn-block text-navy-950 cursor-pointer"
            style={{ marginTop: '18px' }}
            type="button"
            disabled={submitting}
          >
            {submitting ? 'Confirming…' : 'Confirm this ride →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FareSplit() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg font-medium text-ink-soft">Loading calculator...</div>
        </div>
      }
    >
      <FareSplitContent />
    </Suspense>
  );
}

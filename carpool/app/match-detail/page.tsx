'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[240px] bg-paper rounded-xl flex items-center justify-center text-sm text-ink-soft">Loading map...</div>,
});

function MatchDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get dynamic parameters with default fallback values (Priya Menon)
  const name = searchParams.get('name') || 'Priya Menon';
  const initials = searchParams.get('initials') || 'PM';
  const score = searchParams.get('score') || '92';
  const rating = searchParams.get('rating') || '4.8';
  const rides = searchParams.get('rides') || '203';
  const role = searchParams.get('role') || 'Marketing analyst · Tech Park, Wing B';
  const route = searchParams.get('route') || 'Hostel Sector 17 → Tech Park';
  const chat = searchParams.get('chat') || 'Friendly';
  const music = searchParams.get('music') || 'Quiet';
  const willingToDrive = searchParams.get('drive') || 'Yes';
  const peerId = searchParams.get('peerId') || '';
  const requestId = searchParams.get('requestId') || '';

  const handleMessage = () => {
    const params = new URLSearchParams({
      name,
      initials,
    });
    if (peerId) params.set('peerId', peerId);
    if (requestId) params.set('requestId', requestId);
    router.push(`/chat?${params.toString()}`);
  };

  const handleFare = () => {
    const params = new URLSearchParams({
      name,
    });
    if (peerId) params.set('peerId', peerId);
    if (requestId) params.set('requestId', requestId);
    router.push(`/fare-split?${params.toString()}`);
  };

  return (
    <div className="section-tight wrap" style={{ maxWidth: '820px' }}>
      <div className="profile-hero">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <h2>{name}</h2>
          <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px' }}>
            {role}
          </div>
          <div className="badges">
            <span className="badge badge-verified">✓ ID Verified</span>
            <span className="badge badge-amber">✓ Phone Verified</span>
            <span className="badge badge-women">♀ Women-only</span>
          </div>
          <div className="stat-row">
            <div>
              <span>Compatibility</span>
              <b>{score}%</b>
            </div>
            <div>
              <span>Rating</span>
              <b>{rating} ★</b>
            </div>
            <div>
              <span>Rides</span>
              <b>{rides}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Real Map View */}
      <div className="card my-4 p-4">
        <h3 className="font-bold text-sm text-navy-950 mb-3">📍 Route &amp; Pickup Map</h3>
        <LocationMap
          pickupLat={11.25}
          pickupLng={75.78}
          destLat={11.35}
          destLng={75.88}
          pickupAddress="Pickup Location"
          destAddress="Destination"
          height="240px"
        />
      </div>

      <div className="info-grid">
        <div className="card info-card">
          <h3>Route overlap</h3>
          <ul className="info-list">
            <li>
              Pickup distance <b>0.4 km from you</b>
            </li>
            <li>
              Route overlap <b>88%</b>
            </li>
            <li>
              Usual departure <b>8:05 – 8:15 AM</b>
            </li>
            <li>
              Vehicle <b>{willingToDrive === 'Yes' ? 'Hyundai i20 · AC' : 'None (Rider only)'}</b>
            </li>
          </ul>
        </div>
        <div className="card info-card">
          <h3>Recent reviews</h3>
          <ul className="info-list">
            <li>
              "Always on time" <b>★★★★★</b>
            </li>
            <li>
              "Safe, calm driver" <b>★★★★★</b>
            </li>
            <li>
              "Great for early mornings" <b>★★★★☆</b>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={handleMessage} className="btn btn-amber text-navy-950 cursor-pointer">
          Message {name.split(' ')[0]} →
        </button>
        <button onClick={handleFare} className="btn btn-outline text-ink cursor-pointer">
          Preview fare split
        </button>
        <Link href="/matches" className="btn btn-outline text-ink no-underline cursor-pointer">
          ← Back to matches
        </Link>
      </div>
    </div>
  );
}

export default function MatchDetail() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft">Loading match details...</div>
      </div>
    }>
      <MatchDetailContent />
    </Suspense>
  );
}

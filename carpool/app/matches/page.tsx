'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Match {
  id: string;
  score: number;
  distance: number;
  destDistance: number;
  sameDestination: boolean;
  price: number;
  user: {
    id: string;
    name: string;
    role: string;
    gender: string;
    rating: number;
    ridesCompleted: number;
    memberSince: string;
    avatarText: string;
    chatStyle: string;
    musicStyle: string;
    usualRoute: string;
    willingToDrive: boolean;
  };
  request: {
    pickupAddress: string;
    destAddress: string;
    pickupLat: number;
    pickupLng: number;
    destLat: number;
    destLng: number;
    departureTime: string;
    flexibilityWindow: string;
    frequency: string;
    daysOfWeek: string;
  };
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMatches();
  }, [requestId]);

  const fetchMatches = async () => {
    try {
      const url = requestId ? `/api/matches?requestId=${requestId}` : '/api/matches';
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch matches');
      }
      const data = await res.json();
      setMatches(data.matches || []);
      if (data.activeRequest) {
        setActiveRequest(data.activeRequest);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching matches');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (match: Match) => {
    const params = new URLSearchParams({
      name: match.user.name,
      initials: match.user.avatarText,
      score: match.score.toString(),
      rating: match.user.rating.toFixed(1),
      rides: match.user.ridesCompleted.toString(),
      role: match.user.role === 'student' ? 'Student' : 'Analyst',
      route: match.user.usualRoute,
      chat: match.user.chatStyle,
      music: match.user.musicStyle,
      drive: match.user.willingToDrive ? 'Yes' : 'No',
      peerId: match.user.id,
      requestId: requestId || match.id,
      pickupLat: match.request.pickupLat.toString(),
      pickupLng: match.request.pickupLng.toString(),
      destLat: match.request.destLat.toString(),
      destLng: match.request.destLng.toString(),
    });
    router.push(`/match-detail?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft animate-pulse">Running AI matching engine...</div>
      </div>
    );
  }

  return (
    <div className="section-tight wrap">
      <div className="match-head">
        <div>
          <div className="ai-pill">✦ AI Matching complete</div>
          <h2 style={{ margin: '10px 0 4px', fontSize: '26px' }}>
            {matches.length} commuters match your route
          </h2>
          <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '14px' }}>
            {activeRequest
              ? `${activeRequest.pickupAddress} → ${activeRequest.destAddress} · ${activeRequest.departureTime}${activeRequest.womenOnly ? ' · Women-only' : ''}`
              : 'Active Commute Request'}
          </p>
        </div>
        <Link href="/create-request" className="btn btn-outline text-ink no-underline cursor-pointer">
          ← Edit request
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-coral/10 text-coral text-sm font-semibold border border-coral/20">
          {error}
        </div>
      )}

      {matches.length > 0 ? (
        <div>
          {matches.map((match) => (
            <div 
              key={match.id} 
              className="card match-card" 
              style={{ contentVisibility: 'auto' }}
            >
              <div 
                className="match-score" 
                style={{ 
                  backgroundImage: `conic-gradient(var(--teal) ${match.score}%, var(--paper-dim) 0)` 
                }}
              >
                <b>{match.score}%</b>
                <span>MATCH</span>
              </div>
              <div>
                <div className="match-name-row">
                  <h3>{match.user.name}</h3>
                  <span className="rating">★ {match.user.rating.toFixed(1)} ({match.user.ridesCompleted} rides)</span>
                  <span className="badge badge-verified">✓ Verified</span>
                  <span className="badge badge-women">♀ Women-only</span>
                </div>
                <div className="match-route">
                  📍 {match.distance} km from your pickup
                  {match.sameDestination
                    ? ' · same destination block'
                    : ` · ${match.destDistance} km from your destination`}
                  {' '}· leaves {match.request.departureTime}
                </div>
                <div className="match-tags">
                  <span className="badge badge-amber">{match.user.role === 'student' ? 'Same college' : 'Same office park'}</span>
                  <span className="badge badge-amber">{match.user.chatStyle}</span>
                  {match.user.willingToDrive && <span className="badge badge-amber">Driver · has car</span>}
                </div>
              </div>
              <div className="match-actions">
                <div className="match-price">
                  PKR {match.price}
                  <span>your share / ride</span>
                </div>
                <button 
                  onClick={() => handleViewProfile(match)}
                  className="btn btn-amber btn-sm text-navy-950 cursor-pointer"
                >
                  View profile
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-line my-6">
          <h3 className="font-bold text-lg mb-2">No Matches Found</h3>
          <p className="text-ink-soft mb-6">Create a request with coordinates closer to campus or disable strict filters.</p>
          <Link href="/create-request" className="btn btn-amber text-navy-950 no-underline cursor-pointer">
            Create Commute Request
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft">Loading matches...</div>
      </div>
    }>
      <MatchesContent />
    </Suspense>
  );
}
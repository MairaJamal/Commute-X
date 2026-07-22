'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Map as LeafletMap, Marker, Circle } from 'leaflet';

interface TrackResponse {
  status: 'triggered' | 'cancelled' | 'resolved';
  userName: string;
  createdAt: string;
  cancelledAt: string | null;
  resolvedAt: string | null;
  latest: { lat: number; lng: number; createdAt: string };
  trail: { lat: number; lng: number; createdAt: string }[];
  error?: string;
}

const POLL_MS = 5000;

export default function SosTrackingPage() {
  const params = useParams();
  const id = params.id as string;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);

  const [data, setData] = useState<TrackResponse | null>(null);
  const [error, setError] = useState('');

  // Initialize the Leaflet map once.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current).setView([11.3, 75.83], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Poll the location endpoint and update the marker.
  useEffect(() => {
    if (!id) return;
    let stopped = false;

    async function tick() {
      try {
        const res = await fetch(`/api/sos/${id}/location`);
        const json = await res.json();
        if (!res.ok) {
          if (!stopped) setError(json.error || 'Could not load this SOS link');
          return;
        }
        if (stopped) return;
        setData(json);
        setError('');

        const L = (await import('leaflet')).default;
        const map = mapRef.current;
        if (!map) return;

        const { lat, lng } = json.latest;
        map.setView([lat, lng], map.getZoom() < 14 ? 15 : map.getZoom());

        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }

        if (!circleRef.current) {
          circleRef.current = L.circle([lat, lng], {
            radius: 60,
            color: '#ff5a5f',
            fillColor: '#ff5a5f',
            fillOpacity: 0.15,
          }).addTo(map);
        } else {
          circleRef.current.setLatLng([lat, lng]);
        }
      } catch {
        if (!stopped) setError('Could not reach the tracking service');
      }
    }

    tick();
    const interval = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [id]);

  const isActive = data?.status === 'triggered';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)', color: 'var(--white)' }}>
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div
          className="card"
          style={{
            padding: '18px 22px',
            marginBottom: 16,
            background: isActive ? 'rgba(255,90,95,.12)' : 'rgba(31,182,166,.12)',
            border: `1px solid ${isActive ? 'var(--coral)' : 'var(--teal)'}`,
          }}
        >
          {error ? (
            <p style={{ margin: 0, color: 'var(--coral)' }}>{error}</p>
          ) : !data ? (
            <p style={{ margin: 0 }}>Loading live location…</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: isActive ? 'var(--coral)' : 'var(--teal)',
                    display: 'inline-block',
                    animation: isActive ? 'pulse 1.4s infinite' : undefined,
                  }}
                />
                <strong style={{ fontSize: 16 }}>
                  {isActive
                    ? `${data.userName} triggered an SOS alert`
                    : `This alert was ${data.status} by ${data.userName}`}
                </strong>
              </div>
              <p style={{ margin: '6px 0 0', color: 'var(--paper-dim)', fontSize: 13.5 }}>
                {isActive
                  ? 'This page updates automatically with their live location.'
                  : 'Location is no longer being updated.'}
              </p>
            </>
          )}
        </div>

        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '60vh',
            minHeight: 360,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow)',
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

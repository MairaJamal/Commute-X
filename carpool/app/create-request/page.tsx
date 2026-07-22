'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('@/components/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[260px] bg-paper rounded-xl flex items-center justify-center text-sm text-ink-soft">Loading map...</div>,
});

export default function CreateRequest() {
  const [frequency, setFrequency] = useState<'daily' | 'once'>('daily');
  const [pickup, setPickup] = useState('Sector 17 Hostel, Block C');
  const [destination, setDestination] = useState('Tech Park, Gate 3');
  const [departureTime, setDepartureTime] = useState('08:10');
  const [flexibility, setFlexibility] = useState('± 15 minutes');
  const [days, setDays] = useState<string[]>(['M', 'T', 'W', 'T', 'F']);
  const [womenOnly, setWomenOnly] = useState(true);
  const [willingToDrive, setWillingToDrive] = useState(false);
  const [pickupCoords, setPickupCoords] = useState({ lat: 11.25, lng: 75.78 });
  const [destCoords, setDestCoords] = useState({ lat: 11.35, lng: 75.88 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const toggleDay = (day: string) => {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic Validation
    if (!pickup.trim()) {
      setError('Pickup location is required.');
      setLoading(false);
      return;
    }
    if (!destination.trim()) {
      setError('Destination is required.');
      setLoading(false);
      return;
    }
    if (!departureTime.trim()) {
      setError('Departure time is required.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: pickup,
          pickupLat: pickupCoords.lat,
          pickupLng: pickupCoords.lng,
          destAddress: destination,
          destLat: destCoords.lat,
          destLng: destCoords.lng,
          departureTime,
          flexibilityWindow: flexibility,
          frequency,
          daysOfWeek: frequency === 'daily' ? days.join(',') : '',
          womenOnly,
          willingToDrive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      // Success, route to matches page
      router.push(`/matches?requestId=${data.request.id}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="section-tight wrap">
      <div className="section-head">
        <div className="eyebrow">◆ Step 1 of 4</div>
        <h2>Post your commute</h2>
        <p>Tell CommuteX where you're headed — the AI matcher takes it from here.</p>
      </div>

      <div className="card form-card">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 text-coral text-sm font-medium border border-coral/25">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="freq-toggle">
            <button
              type="button"
              className={frequency === 'daily' ? 'active' : ''}
              onClick={() => setFrequency('daily')}
            >
              Daily commute
            </button>
            <button
              type="button"
              className={frequency === 'once' ? 'active' : ''}
              onClick={() => setFrequency('once')}
            >
              One-time ride
            </button>
          </div>

          <div className="field">
            <label>Pickup location</label>
            <input
              type="text"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Enter pickup address"
              required
            />
          </div>

          <div className="field">
            <label>Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Enter destination address"
              required
            />
          </div>

          {/* Interactive OpenStreetMap Leaflet Map */}
          <div className="field">
            <label>Interactive Route Preview</label>
            <LocationMap
              pickupLat={pickupCoords.lat}
              pickupLng={pickupCoords.lng}
              destLat={destCoords.lat}
              destLng={destCoords.lng}
              pickupAddress={pickup}
              destAddress={destination}
              interactive={true}
              onLocationSelect={(p, d) => {
                setPickupCoords(p);
                setDestCoords(d);
              }}
              height="260px"
            />
            <span className="text-[11px] text-ink-soft mt-1 block">
              Drag pins or click map to refine exact pickup (P) and destination (D) positions.
            </span>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Departure time</label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Flexibility window</label>
              <select value={flexibility} onChange={(e) => setFlexibility(e.target.value)}>
                <option>± 5 minutes</option>
                <option>± 15 minutes</option>
                <option>± 30 minutes</option>
              </select>
            </div>
          </div>

          {frequency === 'daily' && (
            <div className="field" id="days-field">
              <label>Repeats on</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {weekdays.map((day, idx) => {
                  const isActive = days.includes(day);
                  // Workaround for duplicate keys in M, T, W, T, F, S, S (use index + day)
                  return (
                    <button
                      key={`${day}-${idx}`}
                      type="button"
                      className={`btn btn-outline btn-sm day ${isActive ? 'active' : ''}`}
                      style={{ flex: 1, borderStyle: 'solid' }}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="switch-row pink">
            <div className="txt">
              <b>Women-only matching</b>
              <span>Only match with verified women riders &amp; drivers</span>
            </div>
            <button
              type="button"
              className={`switch ${womenOnly ? 'on pink-on' : ''}`}
              onClick={() => setWomenOnly(!womenOnly)}
            ></button>
          </div>

          <div className="switch-row">
            <div className="txt">
              <b>Willing to drive</b>
              <span>Offer your car instead of only riding along</span>
            </div>
            <button
              type="button"
              className={`switch ${willingToDrive ? 'on' : ''}`}
              onClick={() => setWillingToDrive(!willingToDrive)}
            ></button>
          </div>

          <button
            type="submit"
            className="btn btn-amber btn-block text-navy-950 mt-4 cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Submitting request...' : 'Find my AI matches →'}
          </button>
        </form>
      </div>
    </div>
  );
}

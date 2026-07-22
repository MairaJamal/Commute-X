'use client';

import { useState, useEffect, useRef } from 'react';

interface Contact {
  id?: string;
  name: string;
  phone: string;
}

export default function Safety() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [loading, setLoading] = useState(true);

  // SOS hold state
  const [sosProgress, setSosProgress] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosEventId, setSosEventId] = useState<string | null>(null);
  const [sosLiveUrl, setSosLiveUrl] = useState<string | null>(null);
  const [sosError, setSosError] = useState('');
  const [sosContactsNotified, setSosContactsNotified] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchProfileData();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.user?.emergencyContacts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    try {
      const updatedContacts = [...contacts, { name: newContactName, phone: newContactPhone }];
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyContacts: updatedContacts }),
      });

      if (res.ok) {
        const data = await res.json();
        setContacts(data.user.emergencyContacts || []);
        setNewContactName('');
        setNewContactPhone('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  function getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not available in this browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
      });
    });
  }

  const triggerSos = async () => {
    setSosError('');
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;

      const res = await fetch('/api/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send SOS alert');
      }

      setSosEventId(data.sosEventId);
      setSosLiveUrl(data.liveLocationUrl);
      setSosContactsNotified(data.contactsNotified);
      setSosTriggered(true);

      // Keep sharing live location while the alert is active.
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => {
            fetch(`/api/sos/${data.sosEventId}/location`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: p.coords.latitude, lng: p.coords.longitude }),
            }).catch(() => {});
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
      }
    } catch (err: any) {
      setSosError(err.message || 'Could not send SOS alert. Check location permissions.');
      setSosTriggered(false);
    }
  };

  const cancelSos = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sosEventId) {
      try {
        await fetch('/api/sos', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sosEventId, action: 'cancel' }),
        });
      } catch {
        // best-effort; UI resets regardless
      }
    }
    setSosTriggered(false);
    setSosProgress(0);
    setSosEventId(null);
    setSosLiveUrl(null);
  };

  // SOS Mouse/Touch Handlers
  const startHold = () => {
    if (sosTriggered) return;
    setSosActive(true);
    setSosProgress(0);

    holdIntervalRef.current = setInterval(() => {
      setSosProgress((prev) => {
        if (prev >= 100) {
          if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
          setSosActive(false);
          triggerSos();
          return 100;
        }
        return prev + 10; // Increase by 10% every 100ms (1 second total hold time)
      });
    }, 100);
  };

  const endHold = () => {
    setSosActive(false);
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
    }
    if (!sosTriggered) {
      setSosProgress(0);
    }
  };

  return (
    <div className="section-tight wrap">
      <div className="section-head">
        <div className="eyebrow">◆ Built-in safety</div>
        <h2>Safety runs quietly under every ride</h2>
      </div>

      {/* SOS Panel */}
      <div 
        className="sos-card relative overflow-hidden" 
        style={{
          border: sosActive ? '2px solid rgba(255, 255, 255, 0.4)' : 'none'
        }}
      >
        {/* Progress Background Overlay */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-100 pointer-events-none" 
          style={{ width: `${sosProgress}%` }}
        />

        <div className="relative z-10">
          <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>
            {sosTriggered ? '🚨 EMERGENCY SOS INITIATED' : 'SOS — press &amp; hold in an emergency'}
          </h3>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.75)', fontSize: '13.5px', maxWidth: '380px' }}>
            {sosTriggered
              ? sosContactsNotified > 0
                ? `Calling and WhatsApp-messaging your ${sosContactsNotified} emergency contact${sosContactsNotified === 1 ? '' : 's'} with your live location.`
                : 'No emergency contacts on file — add some below so SOS can actually reach someone.'
              : 'Alerts your emergency contacts by call and WhatsApp with your live location instantly.'}
          </p>
          {sosError && (
            <p style={{ margin: '8px 0 0', color: '#ffd9d9', fontSize: '12.5px' }}>{sosError}</p>
          )}
          {sosTriggered && sosLiveUrl && (
            <a
              href={sosLiveUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-block', margin: '8px 0 0', fontSize: '12.5px', color: '#fff', textDecoration: 'underline' }}
            >
              View the live tracking link your contacts received →
            </a>
          )}
          {sosTriggered && (
            <button
              onClick={cancelSos}
              className="mt-3 text-xs bg-white/20 hover:bg-white/30 text-white border-none py-1.5 px-3 rounded-lg font-bold cursor-pointer block"
            >
              Cancel Alert
            </button>
          )}
        </div>

        <button 
          className="sos-btn relative z-10 cursor-pointer select-none"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          style={{
            transform: sosActive ? 'scale(0.95)' : 'scale(1)',
            backgroundColor: sosTriggered ? '#fff3dd' : '#ffffff',
            color: '#a3232f',
          }}
        >
          {sosActive ? `${sosProgress}%` : sosTriggered ? 'SENT' : 'HOLD SOS'}
        </button>
      </div>

      {/* Core Safety Grid */}
      <div className="safety-grid">
        <div className="card safety-card">
          <div className="ic" style={{ backgroundColor: '#e6f8f5' }}>📍</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '15.5px' }}>Live location sharing</h3>
          <p style={{ margin: 0, fontSize: '13.3px', color: 'var(--ink-soft)' }}>
            Share your real-time trip with up to 5 trusted contacts, automatically, for every ride.
          </p>
        </div>
        <div className="card safety-card">
          <div className="ic" style={{ backgroundColor: '#fbe6ef' }}>♀</div>
          <h3 style={{ margin: '0 0 6px', fontSize: '15.5px' }}>Women-only matching</h3>
          <p style={{ margin: 0, fontSize: '13.3px', color: 'var(--ink-soft)' }}>
            Restrict all matches — riders and drivers — to verified women only, toggle on any request.
          </p>
        </div>
      </div>

      {/* Database Emergency Contacts List */}
      <div className="card my-6 p-6">
        <h3 className="font-bold text-base mb-4 text-navy-950">📞 Emergency Contacts</h3>
        
        {loading ? (
          <div className="text-sm text-ink-soft animate-pulse">Loading emergency contacts...</div>
        ) : contacts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {contacts.map((contact, idx) => (
              <div key={idx} className="contact-row flex justify-between items-center py-2 border-b border-line">
                <div>
                  <span className="font-semibold text-navy-950">{contact.name}</span>
                  <span className="text-xs text-ink-soft ml-2">({contact.phone})</span>
                </div>
                <span className="text-xs text-teal-dark font-medium bg-[#e6f8f5] px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-ink-soft my-4">No emergency contacts set up yet. Add some below.</div>
        )}

        <form onSubmit={handleAddContact} className="mt-6 border-t border-dashed border-line pt-4">
          <h4 className="text-sm font-semibold mb-3">Add Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="field mb-2">
              <input
                type="text"
                placeholder="Contact Name (e.g. Papa)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                required
                className="w-full text-sm"
              />
            </div>
            <div className="field mb-2">
              <input
                type="tel"
                placeholder="Phone Number (e.g. +91 9988776655)"
                value={newContactPhone}
                onChange={(e) => setNewContactPhone(e.target.value)}
                required
                className="w-full text-sm"
              />
            </div>
          </div>
          <button type="submit" className="btn btn-amber btn-sm text-navy-950 mt-2 cursor-pointer font-bold">
            + Add to List
          </button>
        </form>
      </div>
    </div>
  );
}

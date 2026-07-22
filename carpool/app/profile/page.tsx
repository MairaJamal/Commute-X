'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Preference {
  usualRoute: string;
  chatStyle: string;
  musicStyle: string;
  womenOnlyMode: boolean;
  willingToDrive: boolean;
}

interface CommuteRequest {
  id: string;
  pickupAddress: string;
  destAddress: string;
  departureTime: string;
  flexibilityWindow: string;
  frequency: string;
  daysOfWeek: string;
  womenOnly: boolean;
  willingToDrive: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gender: string;
  verificationStatus: string;
  avatarText: string;
  rating: number;
  ridesCompleted: number;
  memberSince: string;
  userPreferences?: Preference;
  emergencyContacts?: any[];
  verificationDocuments?: any[];
  commuteRequests?: CommuteRequest[];
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [editChatStyle, setEditChatStyle] = useState('Quiet / headphones');
  const [editMusicStyle, setEditMusicStyle] = useState("Okay with driver's choice");
  const [editWomenOnly, setEditWomenOnly] = useState(false);
  const [editWillingToDrive, setEditWillingToDrive] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatStyle: editChatStyle,
          musicStyle: editMusicStyle,
          womenOnlyMode: editWomenOnly,
          willingToDrive: editWillingToDrive,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsEditingPrefs(false);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/signup-login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg font-medium text-ink-soft animate-pulse">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="center-card text-center my-12">
        <h2 className="text-xl font-bold mb-2">No Profile Found</h2>
        <p className="text-ink-soft mb-6">Please sign up or log in to access your profile.</p>
        <Link href="/signup-login" className="btn btn-amber text-navy-950 no-underline">
          Go to Sign up / Login
        </Link>
      </div>
    );
  }

  return (
    <div className="section-tight wrap" style={{ maxWidth: '920px' }}>
      <div className="profile-hero">
        <div className="avatar">{user.avatarText}</div>
        <div style={{ flex: 1 }}>
          <h2>{user.name}</h2>
          <div style={{ color: 'rgba(255,255,255,.65)', fontSize: '13px' }}>
            {user.role === 'student' ? 'Student' : 'Office Worker'} · {user.email}
          </div>
          <div className="badges">
            <span className={`badge ${user.verificationStatus === 'verified' ? 'badge-verified' : 'badge-amber'}`}>
              {user.verificationStatus === 'verified' ? '✓ ID Verified' : '⚠ ID Verification Pending'}
            </span>
            <span className="badge badge-amber">✓ Phone Verified</span>
            {user.gender === 'female' && <span className="badge badge-women">♀ Women-only eligible</span>}
          </div>
          <div className="stat-row">
            <div>
              <span>Rating</span>
              <b>{user.rating.toFixed(1)} ★</b>
            </div>
            <div>
              <span>Rides completed</span>
              <b>{user.ridesCompleted}</b>
            </div>
            <div>
              <span>Member since</span>
              <b>{user.memberSince}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="info-grid">
        <div className="card info-card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="m-0">Commute preferences</h3>
            <button
              onClick={() => {
                setEditChatStyle(user.userPreferences?.chatStyle || 'Quiet / headphones');
                setEditMusicStyle(user.userPreferences?.musicStyle || "Okay with driver's choice");
                setEditWomenOnly(user.userPreferences?.womenOnlyMode ?? (user.gender === 'female'));
                setEditWillingToDrive(user.userPreferences?.willingToDrive ?? false);
                setIsEditingPrefs(true);
              }}
              className="btn btn-outline btn-sm cursor-pointer text-xs py-1 px-3"
              type="button"
            >
              ✎ Edit
            </button>
          </div>
          <ul className="info-list">
            <li>
              Usual route <b>{user.userPreferences?.usualRoute || 'None yet (requires 3+ completed rides)'}</b>
            </li>
            <li>
              Chat style <b>{user.userPreferences?.chatStyle || 'Quiet / headphones'}</b>
            </li>
            <li>
              Music <b>{user.userPreferences?.musicStyle || "Okay with driver's choice"}</b>
            </li>
            <li>
              Women-only mode <b>{user.userPreferences?.womenOnlyMode ? 'On' : 'Off'}</b>
            </li>
            <li>
              Willing to drive <b>{user.userPreferences?.willingToDrive ? 'Yes' : 'No'}</b>
            </li>
          </ul>
        </div>
        <div className="card info-card">
          <h3>Verification &amp; Security</h3>
          <ul className="info-list">
            <li>
              Government ID <b>{user.verificationStatus === 'verified' ? '✓ Verified' : 'Pending'}</b>
            </li>
            <li>
              Student / work ID <b>{user.verificationDocuments && user.verificationDocuments.length > 0 ? '✓ Uploaded' : 'Not Uploaded'}</b>
            </li>
            <li>
              Phone number <b>✓ Verified</b>
            </li>
            <li>
              Emergency contacts <b>{user.emergencyContacts?.length || 0} added</b>
            </li>
            <li>
              Background check <b>✓ Clear</b>
            </li>
          </ul>
        </div>
      </div>

      {/* Active Requests List */}
      <div className="card my-6 p-6">
        <h3 className="font-bold text-lg mb-4 text-navy-950 flex items-center gap-2">
          <span>📍</span> Active Commute Requests
        </h3>
        
        {user.commuteRequests && user.commuteRequests.length > 0 ? (
          <div className="flex flex-col gap-4">
            {user.commuteRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-line bg-paper/20 flex justify-between items-center flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="badge badge-amber text-xs font-bold capitalize">{req.frequency}</span>
                    {req.womenOnly && <span className="badge badge-women text-xs">♀ Women-only</span>}
                    {req.willingToDrive && <span className="badge badge-verified text-xs">🚗 Willing to Drive</span>}
                  </div>
                  <div className="route-line my-1 py-0 pl-5 text-sm text-ink font-medium relative">
                    <div className="absolute left-[5px] top-[6px] bottom-[6px] w-[2px] bg-dashed border-l border-amber"></div>
                    <div className="relative mb-2 before:content-[''] before:absolute before:left-[-20px] before:top-[4px] before:w-[8px] before:height-[8px] before:rounded-full before:bg-amber">
                      <b>Pickup:</b> {req.pickupAddress}
                    </div>
                    <div className="relative before:content-[''] before:absolute before:left-[-20px] before:top-[4px] before:w-[8px] before:height-[8px] before:rounded-full before:bg-teal">
                      <b>Drop:</b> {req.destAddress}
                    </div>
                  </div>
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="font-bold text-navy-950 text-base">{req.departureTime}</div>
                  <div className="text-xs text-ink-soft">{req.flexibilityWindow}</div>
                  <div className="text-[10px] text-ink-soft mt-1">{req.daysOfWeek}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-ink-soft bg-paper/20 rounded-xl border border-dashed border-line">
            No active commute requests. Post one below to start matching!
          </div>
        )}
      </div>

      <div style={{ marginTop: '22px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/create-request" className="btn btn-amber text-navy-950 no-underline cursor-pointer">
          Post a new commute request →
        </Link>
        <Link href="/dashboard" className="btn btn-outline text-ink no-underline cursor-pointer">
          View my dashboard
        </Link>
        <button onClick={handleLogout} className="btn btn-coral text-white cursor-pointer ml-auto">
          Log out
        </button>
      </div>

      {isEditingPrefs && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-line shadow-2xl animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-xl mb-4 text-navy-950">Edit Commute Preferences</h3>
            <form onSubmit={handleSavePrefs}>
              <div className="field">
                <label>Chat Style</label>
                <select
                  value={editChatStyle}
                  onChange={(e) => setEditChatStyle(e.target.value)}
                >
                  <option value="Quiet / headphones">Quiet / headphones</option>
                  <option value="Chatty & friendly">Chatty & friendly</option>
                  <option value="Selective / as needed">Selective / as needed</option>
                </select>
              </div>

              <div className="field">
                <label>Music Preference</label>
                <select
                  value={editMusicStyle}
                  onChange={(e) => setEditMusicStyle(e.target.value)}
                >
                  <option value="Okay with driver's choice">Okay with driver's choice</option>
                  <option value="No music / quiet">No music / quiet</option>
                  <option value="Pop / Rock / Hits">Pop / Rock / Hits</option>
                  <option value="Podcasts / News">Podcasts / News</option>
                </select>
              </div>

              <div className="switch-row pink my-3">
                <div className="txt">
                  <b>Women-only mode</b>
                  <span>Prefer matches with verified women</span>
                </div>
                <button
                  type="button"
                  className={`switch ${editWomenOnly ? 'on pink-on' : ''}`}
                  onClick={() => setEditWomenOnly(!editWomenOnly)}
                ></button>
              </div>

              <div className="switch-row my-3">
                <div className="txt">
                  <b>Willing to drive</b>
                  <span>Offer your car for shared rides</span>
                </div>
                <button
                  type="button"
                  className={`switch ${editWillingToDrive ? 'on' : ''}`}
                  onClick={() => setEditWillingToDrive(!editWillingToDrive)}
                ></button>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditingPrefs(false)}
                  className="btn btn-outline btn-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="btn btn-amber btn-sm text-navy-950 cursor-pointer font-bold"
                >
                  {saveLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

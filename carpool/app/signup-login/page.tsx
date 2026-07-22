'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupLogin() {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('female');
  const [role, setRole] = useState('University student');
  const [phone, setPhone] = useState('');
  const [docType, setDocType] = useState('Student Card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mode === 'signup' 
        ? { action: 'signup', email, password, name, gender, role, phone, docType }
        : { action: 'login', email, password };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // If signup with ID file, let's simulate ID verification by calling verify
      if (mode === 'signup' && docType) {
        await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docType }),
        });
      }

      router.push('/profile');
      // Refresh to update active navbar state if any
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center-card">
      <div className="auth-toggle">
        <button 
          className={mode === 'signup' ? 'active' : ''} 
          onClick={() => { setMode('signup'); setError(''); }}
          type="button"
        >
          Sign up
        </button>
        <button 
          className={mode === 'login' ? 'active' : ''} 
          onClick={() => { setMode('login'); setError(''); }}
          type="button"
        >
          Log in
        </button>
      </div>

      <div className="card form-card" style={{ padding: '26px' }}>
        <h2 style={{ margin: '0 0 4px', fontSize: '21px' }}>
          {mode === 'signup' ? 'Create your CommuteX profile' : 'Log in to CommuteX'}
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '13.3px', margin: '0 0 22px' }}>
          {mode === 'signup' 
            ? 'We verify every rider before they can be matched.' 
            : 'Enter your registered email to resume commuting.'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-coral/10 text-coral text-sm font-medium border border-coral/25">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label>Full name</label>
              <input 
                type="text" 
                placeholder="Aisha Kapoor" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label>{mode === 'signup' ? 'College / company email' : 'Email address'}</label>
            <input 
              type="email" 
              placeholder="aisha@nitc.ac.in" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
          </div>

          {mode === 'signup' && (
            <>
              <div className="field">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div className="field">
                <label>I am a</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option>University student</option>
                  <option>Office worker</option>
                </select>
              </div>

              <div className="field">
                <label>Phone number</label>
                <input 
                  type="tel" 
                  placeholder="+91 9876543210" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Verification Document Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option>Student Card</option>
                  <option>Company ID Card</option>
                  <option>Government ID (Aadhaar / DL)</option>
                </select>
              </div>

              <div className="field">
                <label>Upload Verification ID file</label>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  className="file-input"
                  required
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="btn btn-amber btn-block text-navy-950 mt-4 cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : mode === 'signup' ? 'Create account →' : 'Log in →'}
          </button>
        </form>

        <p className="helper text-ink-soft">
          By continuing you agree to ID verification &amp; background-safe matching.
        </p>
      </div>
    </div>
  );
}

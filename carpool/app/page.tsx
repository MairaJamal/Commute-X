'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleFindCarpool = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoggedIn) {
      router.push('/create-request');
    } else {
      router.push('/signup-login');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow">● AI-matched carpooling for campuses &amp; offices</div>
            <h1>
              Same route.<br />
              Same commute.<br />
              <span>Split three ways.</span>
            </h1>
            <p className="lead">
              CommuteX matches students and office workers heading the same direction at the same time — so every ride costs less, pollutes less, and never feels like a stranger's car.
            </p>
            <div className="hero-ctas">
              <button onClick={handleFindCarpool} className="btn btn-amber text-navy-950 no-underline cursor-pointer">
                Find my carpool →
              </button>
              <Link href={isLoggedIn ? "/matches" : "/signup-login"} className="btn btn-outline-dark text-white no-underline">
                See how matching works
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <b>PKR 2,400</b>
                <span>avg. saved / month</span>
              </div>
              <div>
                <b>1.8 t</b>
                <span>CO₂ saved / rider / yr</span>
              </div>
              <div>
                <b>94%</b>
                <span>ID + campus verified</span>
              </div>
            </div>
          </div>
          <div className="route-card">
            <div className="ai-pill" style={{ backgroundColor: 'rgba(255,178,56,.12)', color: 'var(--amber)' }}>
              ✦ AI Match Score 92%
            </div>
            <div className="route-line text-white">
              <div className="route-stop">
                <b>Pickup — Sector 17 Hostel</b>
                <span>Today, 8:10 AM</span>
              </div>
              <div className="route-stop end">
                <b>Drop — Tech Park, Gate 3</b>
                <span>ETA 8:42 AM · 4 stops shared</span>
              </div>
            </div>
            <div className="route-meta">
              Fare split 3 ways <b className="text-amber">PKR 42 each</b>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">◆ Why riders switch</div>
            <h2>Built for the daily grind, not one-off trips</h2>
            <p>
              CommuteX is tuned for recurring commutes — the same 20 minutes, five days a week — so matching gets smarter the more you ride.
            </p>
          </div>
          <div className="grid-3">
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#fff3dd' }}>💸</div>
              <h3>Real fare splitting</h3>
              <p>Costs divide automatically by distance and headcount — no awkward math at drop-off.</p>
            </div>
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#e6f8f5' }}>🧠</div>
              <h3>AI compatibility scoring</h3>
              <p>Matches weigh route overlap, timing, ratings, and pace preferences, not just proximity.</p>
            </div>
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#fbe6ef' }}>🛡️</div>
              <h3>Women-only matching</h3>
              <p>An optional toggle restricts matches to verified women riders and drivers only.</p>
            </div>
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#eef1ff' }}>✅</div>
              <h3>ID &amp; campus verification</h3>
              <p>Student ID, company email, or government ID checks happen before your first ride.</p>
            </div>
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#fff3dd' }}>🌍</div>
              <h3>Carbon tracking</h3>
              <p>Every shared ride logs the emissions avoided versus driving solo.</p>
            </div>
            <div className="benefit">
              <div className="ic" style={{ backgroundColor: '#e6f8f5' }}>📍</div>
              <h3>Live safety net</h3>
              <p>SOS button, trip sharing, and emergency contacts run in the background of every ride.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="howit">
        <div className="section">
          <div className="wrap">
            <div className="section-head">
              <div className="eyebrow">◆ How it works</div>
              <h2>Four steps, then it repeats itself</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="num">STOP 01</div>
                <h3>Post your commute</h3>
                <p>Pickup, destination, time window, and whether it's daily or one-time.</p>
              </div>
              <div className="step">
                <div className="num">STOP 02</div>
                <h3>Get AI matches</h3>
                <p>See 2–3 ranked commuters with a compatibility score and price.</p>
              </div>
              <div className="step">
                <div className="num">STOP 03</div>
                <h3>Chat &amp; confirm</h3>
                <p>Message inside the app, agree on a pickup point, lock the ride in.</p>
              </div>
              <div className="step">
                <div className="num">STOP 04</div>
                <h3>Ride &amp; track savings</h3>
                <p>Money and carbon saved land on your dashboard automatically.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Get Started Section */}
      <div className="section" style={{ paddingBottom: '40px' }}>
        <div className="wrap" style={{ backgroundColor: 'var(--navy-950)', color: '#fff', borderRadius: '20px', padding: '44px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '24px' }}>Your commute already exists. Someone's doing it next to you.</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.6)', fontSize: '14px' }}>Set up your profile in under two minutes.</p>
          </div>
          <button onClick={handleFindCarpool} className="btn btn-amber text-navy-950 no-underline cursor-pointer">
            Get started free →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const history = [
    { route: 'Sector 17 Hostel → Tech Park', meta: 'Today · with Priya M., Divya R.', price: 'PKR 46' },
    { route: 'Sector 17 Hostel → Tech Park', meta: 'Yesterday · with Sara F.', price: 'PKR 52' },
    { route: 'Campus → City Mall', meta: '3 days ago · one-time · with Divya R.', price: 'PKR 34' },
    { route: 'Sector 17 Hostel → Tech Park', meta: 'Last week · with Priya M.', price: 'PKR 49' },
  ];

  return (
    <div className="section-tight wrap">
      <div className="section-head">
        <div className="eyebrow">◆ Your impact</div>
        <h2>Every shared ride adds up</h2>
      </div>

      <div className="dash-kpis">
        <div className="kpi teal">
          <div className="lbl">MONEY SAVED THIS MONTH</div>
          <div className="val">PKR 2,410</div>
        </div>
        <div className="kpi amber">
          <div className="lbl">CO₂ SAVED THIS MONTH</div>
          <div className="val">64 kg</div>
        </div>
        <div className="kpi navy">
          <div className="lbl">RIDES SHARED</div>
          <div className="val">37</div>
        </div>
        <div className="kpi pink">
          <div className="lbl">WOMEN-ONLY RIDES</div>
          <div className="val">29</div>
        </div>
      </div>

      <div className="card chart-card">
        <h3 style={{ margin: '0 0 4px', fontSize: '15.5px' }}>Savings by week</h3>
        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ink-soft)' }}>
          Compared to your usual solo cab fare
        </p>
        <div className="bars">
          <div className="bar" style={{ height: '48%' }}>
            <span>W1</span>
          </div>
          <div className="bar" style={{ height: '62%' }}>
            <span>W2</span>
          </div>
          <div className="bar" style={{ height: '55%' }}>
            <span>W3</span>
          </div>
          <div className="bar" style={{ height: '88%' }}>
            <span>W4</span>
          </div>
          <div className="bar" style={{ height: '100%', background: 'linear-gradient(to top, var(--amber), #ffd88a)' }}>
            <span>W5</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '15.5px' }}>Ride history</h3>
        {history.map((ride, idx) => (
          <div key={idx} className="history-row">
            <div>
              <div className="history-route">{ride.route}</div>
              <div className="history-meta">{ride.meta}</div>
            </div>
            <b className="mono">{ride.price}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

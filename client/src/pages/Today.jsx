import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, localToday } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Icon, Ring, fmt } from '../ui.jsx';

export default function Today() {
  const { user } = useAuth();
  const [today] = useState(localToday);
  const [habits, setHabits] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => api(`/habits?today=${today}`).then(setHabits).catch((e) => setError(e.message)), [today]);
  useEffect(() => { load(); }, [load]);

  const bump = async (h, dir) => {
    const v = Math.max(0, +(h.today_value + dir * h.step).toFixed(2));
    setHabits((hs) => hs.map((x) => (x.id === h.id ? { ...x, today_value: v } : x)));
    try { await api(`/habits/${h.id}/log`, { method: 'PUT', body: { date: today, value: v } }); load(); }
    catch (e) { setError(e.message); load(); }
  };

  if (error && !habits) return <p className="error" role="alert">{error}</p>;
  if (!habits) return <p className="muted">Loading your day…</p>;

  const pct = habits.length ? habits.reduce((s, h) => s + Math.min(1, h.today_value / h.goal), 0) / habits.length : 0;
  const done = habits.filter((h) => h.today_value >= h.goal).length;
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const line = !habits.length ? 'Add your first habit to begin.' : pct >= 1 ? 'Everything done. Beautifully played.' : pct >= 0.5 ? 'More than halfway. Keep the momentum.' : 'A small step now keeps the streak alive.';
  const date = new Date().toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <section className="hero-card glass">
        <Ring value={pct} size={150} stroke={11}>
          <div className="ring-big"><strong>{Math.round(pct * 100)}%</strong><span>of today</span></div>
        </Ring>
        <div>
          <p className="eyebrow">{date}</p>
          <h1 className="display">{hello}, <em>{user.name.split(' ')[0]}</em></h1>
          <p className="muted">{line} {habits.length > 0 && <b className="ink">{done} of {habits.length} habits complete.</b>}</p>
        </div>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {!habits.length && <Link className="btn primary" to="/app/habits">Add a habit</Link>}

      <div className="cards">
        {habits.map((h) => {
          const full = h.today_value >= h.goal;
          return (
            <article key={h.id} className={`hcard glass ${full ? 'done' : ''}`} style={{ '--c': h.color }}>
              <div className="hcard-top">
                <span className="bubble"><Icon name={h.icon} /></span>
                <div className="grow"><h3>{h.name}</h3>
                  <p className="muted small">Goal {fmt(h.goal)} {h.unit}</p></div>
                {h.streak.current > 0 && <span className="streak"><Icon name="flame" size={14} />{h.streak.current}d</span>}
              </div>
              <div className="hcard-mid">
                <Ring value={h.today_value / h.goal} size={84} stroke={8} color={h.color}>
                  {full ? <Icon name="check" size={26} /> : <span className="ring-pct">{Math.round((h.today_value / h.goal) * 100)}%</span>}
                </Ring>
                <div className="grow">
                  <p className="amount"><strong>{fmt(h.today_value)}</strong> <span className="muted">/ {fmt(h.goal)} {h.unit}</span></p>
                  <div className="spark" aria-label="Last 7 days">
                    {h.week.map((v, i) => <i key={i} className={i === 6 ? 'now' : ''} style={{ height: `${Math.max(8, Math.min(1, v / h.goal) * 100)}%`, opacity: v >= h.goal ? 1 : 0.45 }} />)}
                  </div>
                </div>
              </div>
              <div className="stepper">
                <button className="round" onClick={() => bump(h, -1)} disabled={h.today_value <= 0} aria-label={`Remove ${fmt(h.step)} ${h.unit}`}><Icon name="minus" /></button>
                <span className="muted small">{fmt(h.step)} {h.unit} per tap</span>
                <button className="round add" onClick={() => bump(h, 1)} aria-label={`Add ${fmt(h.step)} ${h.unit}`}><Icon name="plus" /></button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

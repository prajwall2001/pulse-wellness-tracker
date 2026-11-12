import { useEffect, useState } from 'react';
import { api, localToday } from '../api.js';
import { Icon } from '../ui.jsx';

const level = (r) => (r.total === 0 || r.done === 0 ? 0 : Math.min(4, Math.ceil((r.done / r.total) * 4)));

export default function Insights() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api(`/overview?today=${localToday()}`).then(setD).catch((e) => setError(e.message)); }, []);
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!d) return <p className="muted">Crunching your numbers…</p>;

  const pad = d.series.length ? new Date(d.series[0].day + 'T00:00:00').getDay() : 0;
  const last14 = d.series.slice(-14);

  return (
    <>
      <p className="eyebrow">Last 12 weeks</p>
      <h1 className="display">Your <em>insights</em></h1>

      <div className="kpis">
        <div className="glass kpi"><strong>{d.consistency}%</strong><span>14-day consistency</span></div>
        <div className="glass kpi"><strong>{d.bestStreak}</strong><span>Best streak (days)</span></div>
        <div className="glass kpi"><strong>{d.activeStreaks}</strong><span>Active streaks</span></div>
        <div className="glass kpi"><strong>{d.perfectDays}</strong><span>Perfect days</span></div>
      </div>

      <section className="glass block">
        <h2>Consistency heatmap</h2>
        <div className="heat-wrap">
          <div className="heat">
            {Array.from({ length: pad }).map((_, i) => <i key={'p' + i} className="cell blank" />)}
            {d.series.map((r) => <i key={r.day} className={`cell l${level(r)}`} title={`${r.day}: ${r.done}/${r.total} habits`} />)}
          </div>
        </div>
        <p className="muted small legend">Less <i className="cell l0" /><i className="cell l1" /><i className="cell l2" /><i className="cell l3" /><i className="cell l4" /> More</p>
      </section>

      <div className="two">
        <section className="glass block">
          <h2>Habits completed, last 14 days</h2>
          <div className="bars">
            {last14.map((r) => (
              <div className="bar-col" key={r.day}>
                <span className="bar-val">{r.done}</span>
                <div className="bar-track"><div className="bar" style={{ height: `${r.total ? (r.done / r.total) * 100 : 0}%` }} /></div>
                <span className="bar-label">{r.label[0]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="glass block">
          <h2>Per habit, last 30 days</h2>
          {d.habits.map((h) => (
            <div className="prow" key={h.id} style={{ '--c': h.color }}>
              <span className="bubble sm"><Icon name={h.icon} size={16} /></span>
              <div className="grow">
                <div className="prow-top"><b>{h.name}</b><span className="muted small">{h.rate}% · best {h.streak.best}d</span></div>
                <div className="meter"><i style={{ width: `${h.rate}%` }} /></div>
              </div>
            </div>
          ))}
          {!d.habits.length && <p className="muted">No habits yet.</p>}
        </section>
      </div>
    </>
  );
}

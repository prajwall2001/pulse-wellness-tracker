import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { ICONS, Icon, fmt } from '../ui.jsx';
import { localToday } from '../api.js';

const COLORS = ['#c6ff3d', '#5ec8ff', '#a78bfa', '#ff7a6b', '#ffc24b', '#4be3b0'];
const PRESETS = [
  { name: 'Hydrate', unit: 'glasses', goal: 8, step: 1, icon: 'water', color: '#5ec8ff' },
  { name: 'Sleep', unit: 'hours', goal: 8, step: 0.5, icon: 'moon', color: '#a78bfa' },
  { name: 'Walk', unit: 'steps', goal: 8000, step: 1000, icon: 'activity', color: '#c6ff3d' },
  { name: 'Read', unit: 'minutes', goal: 20, step: 5, icon: 'book', color: '#ffc24b' },
  { name: 'Meditate', unit: 'minutes', goal: 10, step: 5, icon: 'leaf', color: '#4be3b0' },
];
const EMPTY = { name: '', unit: 'times', goal: 1, step: 1, icon: 'heart', color: '#c6ff3d' };

export default function Habits() {
  const [list, setList] = useState([]);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const load = () => api(`/habits?today=${localToday()}`).then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault(); setError('');
    try { await api('/habits', { method: 'POST', body: { ...f, goal: Number(f.goal), step: Number(f.step) } }); setF(EMPTY); load(); }
    catch (err) { setError(err.message); }
  };
  const remove = async (h) => { if (confirm(`Archive "${h.name}"? Its history stays saved.`)) { await api(`/habits/${h.id}`, { method: 'DELETE' }); load(); } };

  return (
    <>
      <p className="eyebrow">Your routine</p>
      <h1 className="display">Shape your <em>habits</em></h1>
      {error && <p className="error" role="alert">{error}</p>}

      <form className="glass block" onSubmit={add} style={{ '--c': f.color }}>
        <h2>New habit</h2>
        <div className="chips">
          {PRESETS.map((p) => <button type="button" className="chip" key={p.name} onClick={() => setF(p)}><Icon name={p.icon} size={14} />{p.name}</button>)}
        </div>
        <div className="form-grid">
          <label>Name<input value={f.name} onChange={set('name')} required maxLength="40" /></label>
          <label>Unit<input value={f.unit} onChange={set('unit')} required maxLength="20" /></label>
          <label>Daily goal<input type="number" min="0.5" step="any" value={f.goal} onChange={set('goal')} required /></label>
          <label>Amount per tap<input type="number" min="0.5" step="any" value={f.step} onChange={set('step')} required /></label>
        </div>
        <div className="pickers">
          <div className="swatches" role="radiogroup" aria-label="Color">
            {COLORS.map((c) => <button type="button" key={c} className={`sw ${f.color === c ? 'on' : ''}`} style={{ background: c }} onClick={() => setF({ ...f, color: c })} aria-label={c} />)}
          </div>
          <div className="swatches" role="radiogroup" aria-label="Icon">
            {ICONS.map((i) => <button type="button" key={i} className={`ico ${f.icon === i ? 'on' : ''}`} onClick={() => setF({ ...f, icon: i })} aria-label={i}><Icon name={i} size={18} /></button>)}
          </div>
        </div>
        <button className="btn primary">Add habit</button>
      </form>

      <div className="list">
        {list.map((h) => (
          <div className="glass lrow" key={h.id} style={{ '--c': h.color }}>
            <span className="bubble"><Icon name={h.icon} /></span>
            <div className="grow"><b>{h.name}</b><p className="muted small">{fmt(h.goal)} {h.unit} a day · {fmt(h.step)} per tap</p></div>
            {h.streak.current > 0 && <span className="streak"><Icon name="flame" size={14} />{h.streak.current}d</span>}
            <button className="icon-btn" onClick={() => remove(h)} aria-label={`Archive ${h.name}`}><Icon name="trash" size={18} /></button>
          </div>
        ))}
        {!list.length && <p className="muted">No habits yet. Pick a preset above to start.</p>}
      </div>
    </>
  );
}

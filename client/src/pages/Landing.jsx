import { Link } from 'react-router-dom';
import { Icon, Ring } from '../ui.jsx';

const DEVICE = [
  ['Hydrate', '7 / 8 glasses', 0.88, '#5ec8ff', 'water'],
  ['Sleep', '7.5 / 8 hours', 0.94, '#a78bfa', 'moon'],
  ['Walk', '8,200 steps', 1, '#c6ff3d', 'activity'],
  ['Read', '12 / 20 minutes', 0.6, '#ffc24b', 'book'],
];
const WORDS = ['Hydrate', 'Sleep', 'Move', 'Read', 'Breathe', 'Repeat'];
const heat = Array.from({ length: 84 }, (_, i) => Math.floor(((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 5));

export default function Landing() {
  return (
    <div className="landing">
      <header className="l-nav">
        <div className="logo"><span className="dot" />Pulse</div>
        <div className="l-nav-r"><Link to="/login" className="btn ghost">Sign in</Link><Link to="/login" className="btn primary">Get started</Link></div>
      </header>

      <section className="l-hero">
        <div>
          <p className="eyebrow">Wellness, measured daily</p>
          <h1 className="mega">Small habits,<br /><em>beautifully</em> measured.</h1>
          <p className="lead">Track water, sleep, movement and mindfulness. Watch streaks grow, see your consistency in a heatmap, and let the numbers keep you honest.</p>
          <div className="cta"><Link to="/login" className="btn primary big">Start free</Link><span className="muted small">Try the demo: demo@pulse.app</span></div>
        </div>

        <div className="device-wrap" aria-hidden="true">
          <div className="device glass">
            <div className="device-head"><b>Today</b><span className="pill">3 / 4 on track</span></div>
            {DEVICE.map(([n, v, p, c, ic]) => (
              <div className="drow" key={n}>
                <Ring value={p} size={46} stroke={5} color={c}><Icon name={ic} size={16} /></Ring>
                <div className="grow"><b>{n}</b><p className="muted small">{v}</p></div>
              </div>
            ))}
          </div>
          <div className="float f1 glass"><Icon name="flame" size={18} /> <b>21 day streak</b></div>
          <div className="float f2 glass"><span className="live" /> Synced just now</div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div>{[...WORDS, ...WORDS, ...WORDS, ...WORDS].map((w, i) => <span key={i}>{w}<i>✦</i></span>)}</div></div>

      <section className="bento">
        <article className="glass b1">
          <h3>Streaks, computed in SQL</h3>
          <p className="muted">Your current and best streaks come straight from PostgreSQL using window functions, not guesswork in the browser.</p>
          <div className="mini-bars">{[3, 5, 4, 7, 6, 9, 8, 10].map((h, i) => <i key={i} style={{ height: `${h * 10}%` }} />)}</div>
        </article>
        <article className="glass b2">
          <h3>A 12-week heatmap</h3>
          <p className="muted">Spot your strongest weeks at a glance.</p>
          <div className="heat mini">{heat.map((l, i) => <i key={i} className={`cell l${l}`} />)}</div>
        </article>
        <article className="glass b3">
          <h3>One-tap logging</h3>
          <p className="muted">Add a glass of water in a tap. Rings fill as you go.</p>
        </article>
        <article className="glass b4">
          <h3>Private by design</h3>
          <p className="muted">Passwords hashed, sessions signed with JWT, and every query scoped to you.</p>
        </article>
      </section>

      <footer className="l-foot"><span className="logo"><span className="dot" />Pulse</span><span className="muted small">Built with React, Express and PostgreSQL</span></footer>
    </div>
  );
}

require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(cors());
app.use(express.json());

// ---------- helpers ----------
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dayOf = (q) => (DATE.test(q || '') ? q : new Date().toISOString().slice(0, 10)); // client sends its local date
const sign = (u) => jwt.sign({ id: u.id, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Please sign in again' }); }
};

// Current + best streak per habit using the "gaps and islands" window-function technique.
async function streaks(userId, today) {
  const { rows } = await pool.query(
    `WITH hit AS (
       SELECT l.habit_id, l.log_date,
              l.log_date - (row_number() OVER (PARTITION BY l.habit_id ORDER BY l.log_date))::int AS grp
       FROM pulse.logs l JOIN pulse.habits h ON h.id = l.habit_id
       WHERE h.user_id = $1 AND NOT h.archived AND l.value >= h.goal AND l.log_date <= $2::date
     ), runs AS (
       SELECT habit_id, count(*)::int AS len, max(log_date) AS last_day FROM hit GROUP BY habit_id, grp
     )
     SELECT habit_id, max(len)::int AS best,
            coalesce(max(len) FILTER (WHERE last_day >= $2::date - 1), 0)::int AS current
     FROM runs GROUP BY habit_id`, [userId, today]);
  return Object.fromEntries(rows.map((r) => [r.habit_id, { best: r.best, current: r.current }]));
}

// ---------- auth ----------
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.includes('@') || !password || password.length < 6)
    return res.status(400).json({ error: 'Enter your name, a valid email and a password of 6+ characters' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO pulse.users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name',
      [name.trim(), email.trim().toLowerCase(), await bcrypt.hash(password, 10)]);
    res.status(201).json({ token: sign(rows[0]), user: rows[0] });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'An account with that email already exists' });
    throw e;
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM pulse.users WHERE email=$1', [(email || '').trim().toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
    return res.status(401).json({ error: 'Email or password is incorrect' });
  res.json({ token: sign(u), user: { id: u.id, name: u.name } });
});

// ---------- habits ----------
app.get('/api/habits', auth, async (req, res) => {
  const today = dayOf(req.query.today);
  const [habits, recent, st] = await Promise.all([
    pool.query(
      `SELECT h.id, h.name, h.unit, h.goal::float, h.step::float, h.color, h.icon, coalesce(t.value, 0)::float AS today_value
       FROM pulse.habits h LEFT JOIN pulse.logs t ON t.habit_id = h.id AND t.log_date = $2::date
       WHERE h.user_id = $1 AND NOT h.archived ORDER BY h.id`, [req.user.id, today]),
    pool.query(
      `SELECT l.habit_id, (l.log_date - $2::date)::int AS off, l.value::float
       FROM pulse.logs l JOIN pulse.habits h ON h.id = l.habit_id
       WHERE h.user_id = $1 AND l.log_date BETWEEN $2::date - 6 AND $2::date`, [req.user.id, today]),
    streaks(req.user.id, today),
  ]);
  const weeks = {};
  recent.rows.forEach((r) => { (weeks[r.habit_id] ||= Array(7).fill(0))[6 + r.off] = r.value; });
  res.json(habits.rows.map((h) => ({ ...h, week: weeks[h.id] || Array(7).fill(0), streak: st[h.id] || { current: 0, best: 0 } })));
});

app.post('/api/habits', auth, async (req, res) => {
  const { name, unit, goal, step, color, icon } = req.body;
  if (!name?.trim() || !(Number(goal) > 0) || !(Number(step || 1) > 0))
    return res.status(400).json({ error: 'A name and a goal above zero are required' });
  const { rows } = await pool.query(
    'INSERT INTO pulse.habits (user_id,name,unit,goal,step,color,icon) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
    [req.user.id, name.trim().slice(0, 40), (unit || 'times').slice(0, 20), goal, step || 1, (color || '#c6ff3d').slice(0, 9), (icon || 'heart').slice(0, 20)]);
  res.status(201).json(rows[0]);
});

app.delete('/api/habits/:id', auth, async (req, res) => {
  await pool.query('UPDATE pulse.habits SET archived = true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.status(204).end();
});

app.put('/api/habits/:id/log', auth, async (req, res) => {
  const { date, value } = req.body;
  const v = Number(value);
  if (!DATE.test(date || '') || !Number.isFinite(v) || v < 0) return res.status(400).json({ error: 'A valid date and value are required' });
  const own = await pool.query('SELECT 1 FROM pulse.habits WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  if (!own.rowCount) return res.status(404).json({ error: 'Habit not found' });
  const { rows } = await pool.query(
    `INSERT INTO pulse.logs (habit_id, log_date, value) VALUES ($1, $2::date, $3)
     ON CONFLICT (habit_id, log_date) DO UPDATE SET value = EXCLUDED.value RETURNING value::float`,
    [req.params.id, date, v]);
  res.json(rows[0]);
});

// ---------- insights ----------
app.get('/api/overview', auth, async (req, res) => {
  const today = dayOf(req.query.today);
  const [series, perHabit, st] = await Promise.all([
    pool.query(
      `WITH days AS (SELECT generate_series($2::date - 83, $2::date, '1 day')::date AS day),
            hab AS (SELECT id, goal FROM pulse.habits WHERE user_id = $1 AND NOT archived)
       SELECT d.day::text AS day, to_char(d.day, 'Dy') AS label,
              count(h.id)::int AS total,
              count(l.id) FILTER (WHERE l.value >= h.goal)::int AS done
       FROM days d CROSS JOIN hab h
       LEFT JOIN pulse.logs l ON l.habit_id = h.id AND l.log_date = d.day
       GROUP BY d.day ORDER BY d.day`, [req.user.id, today]),
    pool.query(
      `SELECT h.id, h.name, h.color, h.icon,
              count(l.id) FILTER (WHERE l.value >= h.goal)::int AS days_hit
       FROM pulse.habits h
       LEFT JOIN pulse.logs l ON l.habit_id = h.id AND l.log_date BETWEEN $2::date - 29 AND $2::date
       WHERE h.user_id = $1 AND NOT h.archived GROUP BY h.id ORDER BY h.id`, [req.user.id, today]),
    streaks(req.user.id, today),
  ]);
  const s = series.rows;
  const last14 = s.slice(-14);
  const sum = (a, k) => a.reduce((n, r) => n + r[k], 0);
  res.json({
    series: s,
    today: s.length ? { done: s[s.length - 1].done, total: s[s.length - 1].total } : { done: 0, total: 0 },
    consistency: sum(last14, 'total') ? Math.round((sum(last14, 'done') / sum(last14, 'total')) * 100) : 0,
    perfectDays: s.filter((r) => r.total > 0 && r.done === r.total).length,
    bestStreak: Math.max(0, ...Object.values(st).map((x) => x.best)),
    activeStreaks: Object.values(st).filter((x) => x.current > 0).length,
    habits: perHabit.rows.map((h) => ({ ...h, rate: Math.round((h.days_hit / 30) * 100), streak: st[h.id] || { current: 0, best: 0 } })),
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Something went wrong on the server' }); });
app.listen(process.env.PORT || 4000, () => console.log('Pulse API running'));

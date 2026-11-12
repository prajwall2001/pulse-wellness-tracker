// Creates the schema and a demo account with ~90 days of SYNTHETIC history.
require('dotenv').config();
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const iso = (d) => d.toISOString().slice(0, 10);

(async () => {
  await pool.query(fs.readFileSync(__dirname + '/schema.sql', 'utf8'));
  const hash = await bcrypt.hash('demo123', 10);
  const { rows: [u] } = await pool.query(
    "INSERT INTO pulse.users (name,email,password_hash) VALUES ('Demo User','demo@pulse.app',$1) RETURNING id", [hash]);

  const habits = [
    ['Hydrate', 'glasses', 8, 1, '#5ec8ff', 'water', 0.8],
    ['Sleep', 'hours', 8, 0.5, '#a78bfa', 'moon', 0.7],
    ['Walk', 'steps', 8000, 1000, '#c6ff3d', 'activity', 0.75],
    ['Read', 'minutes', 20, 5, '#ffc24b', 'book', 0.6],
    ['Meditate', 'minutes', 10, 5, '#4be3b0', 'leaf', 0.65],
  ];
  const ids = [], dates = [], vals = [];
  for (const [name, unit, goal, step, color, icon, p] of habits) {
    const { rows: [h] } = await pool.query(
      'INSERT INTO pulse.habits (user_id,name,unit,goal,step,color,icon) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [u.id, name, unit, goal, step, color, icon]);
    for (let back = 90; back >= 0; back--) {
      const d = new Date(); d.setUTCDate(d.getUTCDate() - back);
      const recent = back < 14 ? 0.12 : 0; // a hot streak lately
      const r = rand();
      let v;
      if (back === 0) v = r < 0.5 ? Math.round((goal * 0.5) / step) * step : 0; // today in progress
      else if (r < p + recent) v = goal + Math.floor(rand() * 2) * step;
      else if (r < p + 0.15) v = Math.max(0, Math.round((goal * (0.3 + rand() * 0.5)) / step) * step);
      else continue;
      if (v === 0) continue;
      ids.push(h.id); dates.push(iso(d)); vals.push(v);
    }
  }
  await pool.query('INSERT INTO pulse.logs (habit_id,log_date,value) SELECT * FROM unnest($1::int[],$2::date[],$3::float[])', [ids, dates, vals]);
  console.log(`Seeded ${ids.length} log entries. Sign in with demo@pulse.app / demo123`);
  await pool.end();
})();

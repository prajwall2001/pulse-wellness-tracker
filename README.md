# Pulse: a wellness and habit tracker

Track water, sleep, movement and mindfulness. Watch streaks grow, see consistency in a 12-week heatmap, and log a habit in one tap.

**Stack:** React (Vite) · React Router · Node.js + Express · PostgreSQL · JWT auth · hand-written CSS (no UI kit)

## Live demo
- App: https://YOUR-APP.vercel.app
- API: https://YOUR-API.onrender.com (free tier, the first request may take about a minute to wake)
- Demo login: `demo@pulse.app` / `demo123`

## Screenshots
![Landing](landing.png)
![Habbits](habbits.png)
![Insights](insights.png)

## Highlights
- Sign up and sign in with hashed passwords (bcrypt) and signed JWT sessions; every query is scoped to the signed-in user
- Create habits with a goal, unit, step size, colour and icon, and log progress with one tap
- **Streaks computed in PostgreSQL** with a gaps-and-islands window-function query (`row_number() OVER (PARTITION BY ...)`)
- 12-week consistency heatmap built from a CTE with `generate_series` and conditional aggregates (`COUNT ... FILTER`)
- Idempotent logging with `INSERT ... ON CONFLICT DO UPDATE`
- Streaks follow the user's own calendar day (the client sends its local date)
- Animated aurora background, progress rings and a responsive layout with a bottom tab bar on phones

## Run locally
1. Create a PostgreSQL database (a free one on [Neon](https://neon.com) works). Pulse uses its own `pulse` schema, so it can share a database with other projects.
2. Server:
   ```bash
   cd server
   cp .env.example .env     # add DATABASE_URL and JWT_SECRET
   npm install
   npm run seed             # creates the schema and demo data
   npm run dev              # http://localhost:4000
   ```
3. Client (new terminal):
   ```bash
   cd client
   npm install
   npm run dev              # http://localhost:5173
   ```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Create an account, sign in |
| GET | /api/habits?today=YYYY-MM-DD | Habits with today's value, 7-day trend and streaks |
| POST | /api/habits | Create a habit |
| DELETE | /api/habits/:id | Archive a habit (history is kept) |
| PUT | /api/habits/:id/log | Set a day's value (upsert) |
| GET | /api/overview?today=YYYY-MM-DD | 84-day series, consistency, best streak, per-habit rates |

## Deploy
Database on Neon, API on Render (root `server`, build `npm install`, start `npm start`, set `DATABASE_URL` and `JWT_SECRET`), client on Vercel (root `client`, set `VITE_API_URL` to the API URL).

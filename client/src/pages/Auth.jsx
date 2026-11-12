import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Auth() {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try { await (mode === 'login' ? login({ email: f.email, password: f.password }) : register(f)); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="auth">
      <Link to="/" className="logo auth-logo"><span className="dot" />Pulse</Link>
      <form className="glass auth-card" onSubmit={submit}>
        <h1 className="display">{mode === 'login' ? <>Welcome <em>back</em></> : <>Start your <em>streak</em></>}</h1>
        {mode === 'register' && <label>Name<input value={f.name} onChange={set('name')} required /></label>}
        <label>Email<input type="email" value={f.email} onChange={set('email')} required /></label>
        <label>Password<input type="password" value={f.password} onChange={set('password')} minLength="6" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button type="button" className="btn ghost" onClick={() => setF({ ...f, email: 'demo@pulse.app', password: 'demo123' })}>Fill demo account</button>
        <p className="muted switch">
          {mode === 'login' ? 'New here?' : 'Already have an account?'}{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </a>
        </p>
      </form>
    </div>
  );
}

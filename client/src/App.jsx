import { NavLink, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { Icon } from './ui.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Today from './pages/Today.jsx';
import Insights from './pages/Insights.jsx';
import Habits from './pages/Habits.jsx';

function Shell() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="shell">
      <aside className="side">
        <div className="logo"><span className="dot" />Pulse</div>
        <nav>
          <NavLink to="/app" end><Icon name="today" />Today</NavLink>
          <NavLink to="/app/insights"><Icon name="bars" />Insights</NavLink>
          <NavLink to="/app/habits"><Icon name="list" />Habits</NavLink>
        </nav>
        <div className="me">
          <span className="avatar">{user.name[0]}</span>
          <span className="me-name">{user.name}</span>
          <button className="icon-btn" onClick={logout} aria-label="Sign out"><Icon name="out" size={18} /></button>
        </div>
      </aside>
      <main className="page"><Outlet /></main>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <Landing />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/app" element={<Shell />}>
        <Route index element={<Today />} />
        <Route path="insights" element={<Insights />} />
        <Route path="habits" element={<Habits />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

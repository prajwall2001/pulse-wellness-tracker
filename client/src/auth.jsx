import { createContext, useContext, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pulse_user') || 'null'));
  const enter = async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    localStorage.setItem('pulse_token', data.token);
    localStorage.setItem('pulse_user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem('pulse_token'); localStorage.removeItem('pulse_user'); setUser(null); };
  return <Ctx.Provider value={{ user, login: (b) => enter('/auth/login', b), register: (b) => enter('/auth/register', b), logout }}>{children}</Ctx.Provider>;
}

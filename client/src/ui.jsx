const PATHS = {
  water: 'M12 3c3 4 6 7 6 10a6 6 0 0 1-12 0c0-3 3-6 6-10z',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  book: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM8 7h7',
  leaf: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14zM5 19l8-8',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  flame: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M5 12l5 5 9-10',
  today: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
  bars: 'M5 20V10M12 20V4M19 20v-7',
  list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  out: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
};
export const ICONS = ['water', 'moon', 'activity', 'book', 'leaf', 'heart'];

export const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={PATHS[name] || PATHS.heart} />
  </svg>
);

export function Ring({ value = 0, size = 64, stroke = 7, color = '#c6ff3d', children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, v = Math.min(1, Math.max(0, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.09)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

export const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString() : n.toFixed(1));
